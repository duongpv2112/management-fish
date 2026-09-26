<template>
  <div class="add-weight-container">
    <h1>Thêm cân nặng</h1>
    <div class="add-weight-form">
      <div class="add-weight-field">
        <div class="add-weight-label">Loại cá</div>
        <ChoiceGrid
          idPrefix="fishType"
          :items="lstDataFishType"
          :modelValue="fishTypeValue"
          valueField="_id"
          textField="fishName"
          :ranking="fishRanking"
          :maxVisible="5"
          :emptyText="catalogEmptyText(fishLoadState, 'cá')"
          :showCatalogLink="fishLoadState === 'ok'"
          @update="selectFishType"
        />
      </div>

      <div class="add-weight-field">
        <div class="add-weight-label">Loại giỏ</div>
        <ChoiceGrid
          idPrefix="basketType"
          :items="lstDataBasketType"
          :modelValue="basketTypeValue"
          valueField="_id"
          textField="basketName"
          :subText="basketSubText"
          :ranking="basketRanking"
          :maxVisible="4"
          :emptyText="catalogEmptyText(basketLoadState, 'giỏ')"
          :showCatalogLink="basketLoadState === 'ok'"
          @update="selectBasketType"
        />
      </div>

      <CPInput
        class="flex-1 add-weight-weight"
        idControl="fishWeight"
        labelControl="Số cân (gồm giỏ)"
        :modelValue="fishWeightValue"
        height="48px"
        placeholderText="Nhập số cân"
        :typeInput="1"
        @update="($event) => (fishWeightValue = $event)"
        @enter="save"
      />
      <div v-if="netPreview" class="net-preview" :class="{ 'net-preview--error': netPreview.isError }">
        {{ netPreview.text }}
      </div>
      <!-- Micro đặt ngay dưới ô số cân (việc hay nói nhất là số cân) -->
      <VoiceInput
        ref="voiceInputRef"
        :fishTypes="lstDataFishType"
        :basketTypes="lstDataBasketType"
        @parsed="handleVoiceParsed"
      />
    </div>
    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
    <div class="success-message" v-if="successMessage">
      <span>{{ successMessage }}</span>
      <button v-if="undoItemId" type="button" class="btn-undo" :disabled="isLoading" @click="undoLastSave">
        Hoàn tác
      </button>
    </div>
    <CPButton
      class="btn-add-weight add-weight__save"
      idControl="btnSaveFishWeight"
      height="52px"
      textButton="Lưu số cân"
      :disabled="isLoading || !canSave"
      @click="save"
    />
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

import ChoiceGrid from "@/components/ChoiceGrid.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import VoiceInput from "./VoiceInput.vue";

import FishTypeAPI from "@/services/fishTypeAPI";
import BasketTypeAPI from "@/services/basketTypeAPI";
import FishWeightAPI from "@/services/fishWeightAPI";
import { common } from "@/common/common";
import { rankChoices } from "@/common/rankChoices";
import { getRecent, pushRecent, RECENT_BASKET_KEY, RECENT_FISH_KEY } from "@/common/recentChoices";

const props = defineProps({
  // getDataFish của phiên đang chọn: dùng để đưa loại cá/giỏ cân nhiều lên đầu lưới
  sessionFishData: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["weightAdded", "weightUndone"]);

const FISH_MAX_VISIBLE = 5;
const BASKET_MAX_VISIBLE = 4;

// Thời gian còn hiện nút "Hoàn tác" sau khi lưu
const UNDO_TIMEOUT_MS = 10000;

const lstDataFishType = ref([]);
const lstDataBasketType = ref([]);
const fishTypeValue = ref(null);
const basketTypeValue = ref(null);
const fishWeightValue = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);
const voiceInputRef = ref(null);
// _id lần cân vừa lưu, còn giá trị thì hiện nút "Hoàn tác"
const undoItemId = ref(null);
let undoTimer = null;

const clearUndo = () => {
  clearTimeout(undoTimer);
  undoTimer = null;
  undoItemId.value = null;
};

const offerUndo = (itemId) => {
  clearUndo();
  if (!itemId) return;
  undoItemId.value = itemId;
  undoTimer = setTimeout(clearUndo, UNDO_TIMEOUT_MS);
};

// Lưu nhầm: xóa ngay lần cân vừa lưu (không hỏi lại vì người dùng đã chủ động bấm Hoàn tác)
const undoLastSave = async () => {
  const itemId = undoItemId.value;
  if (!itemId) return;
  clearUndo();
  errorMessage.value = "";
  successMessage.value = "";
  isLoading.value = true;
  try {
    await FishWeightAPI.deleteFishWeight(itemId);
    successMessage.value = "Đã hoàn tác lần cân vừa lưu.";
    emit("weightUndone");
  } catch (error) {
    errorMessage.value = error?.message || "Hoàn tác không thành công, vui lòng thử lại.";
  } finally {
    isLoading.value = false;
  }
};

// Trạng thái tải danh mục: "loading" | "error" | "ok" — để lưới rỗng không bảo "thêm ở Danh mục" khi chỉ là đang tải/tải lỗi
const fishLoadState = ref("loading");
const basketLoadState = ref("loading");

const catalogEmptyText = (state, name) => {
  if (state === "loading") return "Đang tải…";
  if (state === "error") return `Không tải được danh sách loại ${name}.`;
  return `Chưa có loại ${name} — thêm ở trang Danh mục`;
};

const initDateForm = async () => {
  // Xóa lỗi một lần ở đây; từng hàm tải không xóa lỗi của nhau
  errorMessage.value = "";
  await getDataFishType();
  await getDataBasketType();
};

const getDataFishType = async () => {
  isLoading.value = true;
  fishLoadState.value = "loading";
  try {
    // Không cache: danh sách nhỏ và loại cá mới thêm ở trang Danh mục phải hiện ngay
    let result = await FishTypeAPI.getFishTypes();
    lstDataFishType.value = result.data ?? [];
    fishLoadState.value = "ok";
  } catch (error) {
    fishLoadState.value = "error";
    errorMessage.value = "Không thể tải danh sách loại cá, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách loại cá:", error);
  } finally {
    isLoading.value = false;
  }
};

const getDataBasketType = async () => {
  isLoading.value = true;
  basketLoadState.value = "loading";
  try {
    // Không cache: danh sách nhỏ và loại giỏ mới thêm ở trang Danh mục phải hiện ngay
    let result = await BasketTypeAPI.getBasketTypes();
    lstDataBasketType.value = result.data ?? [];
    basketLoadState.value = "ok";
  } catch (error) {
    basketLoadState.value = "error";
    // Giữ lỗi tải loại cá nếu có (lỗi nào cũng chặn việc lưu)
    errorMessage.value ||= "Không thể tải danh sách loại giỏ, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách loại giỏ:", error);
  } finally {
    isLoading.value = false;
  }
};

// Danh sách "dùng gần đây" đọc từ localStorage; cập nhật khi lưu hoặc chọn từ "Loại khác"
const recentFishIds = ref(getRecent(RECENT_FISH_KEY));
const recentBasketIds = ref(getRecent(RECENT_BASKET_KEY));

// Số lần cân trong phiên theo loại cá và theo loại giỏ
const sessionCounts = computed(() => {
  const fish = {};
  const basket = {};
  props.sessionFishData.forEach((fishType) => {
    const items = fishType.fishWeightItems ?? [];
    fish[fishType._id] = items.length;
    items.forEach((item) => {
      if (item.basketType) basket[item.basketType] = (basket[item.basketType] ?? 0) + 1;
    });
  });
  return { fish, basket };
});

const fishRanking = computed(() =>
  rankChoices({
    items: lstDataFishType.value,
    valueField: "_id",
    sessionCounts: sessionCounts.value.fish,
    recentIds: recentFishIds.value,
  })
);

const basketRanking = computed(() =>
  rankChoices({
    items: lstDataBasketType.value,
    valueField: "_id",
    sessionCounts: sessionCounts.value.basket,
    recentIds: recentBasketIds.value,
  })
);

const basketSubText = (basket) => `${String(basket.basketWeight ?? 0).replace(".", ",")} kg`;

// Chọn một loại không nằm trong nhóm đang hiện (tức là từ "Loại khác") → đưa lên nhóm hay cân ngay
const selectFishType = (id) => {
  fishTypeValue.value = id;
  if (!fishRanking.value.slice(0, FISH_MAX_VISIBLE).includes(id)) {
    recentFishIds.value = pushRecent(RECENT_FISH_KEY, id);
  }
};

const selectBasketType = (id) => {
  basketTypeValue.value = id;
  if (!basketRanking.value.slice(0, BASKET_MAX_VISIBLE).includes(id)) {
    recentBasketIds.value = pushRecent(RECENT_BASKET_KEY, id);
  }
};

const canSave = computed(() => {
  const weight = common.parseDecimal(fishWeightValue.value);
  return Boolean(fishTypeValue.value && basketTypeValue.value && weight && weight > 0);
});

const round2 = (value) => Math.round(value * 100) / 100;
const formatKg = (value) => String(round2(value)).replace(".", ",");

// Lần cân mới trừ theo trọng lượng hiện tại của giỏ đang chọn (giống server)
const netPreview = computed(() => {
  const fishWeight = common.parseDecimal(fishWeightValue.value);
  const basket = lstDataBasketType.value.find((item) => item._id === basketTypeValue.value);
  if (!fishWeight || fishWeight <= 0 || !basket) return null;
  const basketWeight = basket.basketWeight ?? 0;
  const net = round2(fishWeight - basketWeight);
  if (net <= 0) {
    return { isError: true, text: `Số cân phải lớn hơn trọng lượng giỏ (${formatKg(basketWeight)} kg)` };
  }
  return { isError: false, text: `Còn ${formatKg(net)} kg sau khi trừ giỏ ${formatKg(basketWeight)} kg` };
});

// Lệnh "hủy" bằng giọng nói chỉ xóa số cân
const resetWeight = () => {
  fishWeightValue.value = null;
};

// Lưu thành công thì xóa hết dữ liệu đã nhập để lần cân sau nhập lại từ đầu
const resetForm = () => {
  fishTypeValue.value = null;
  basketTypeValue.value = null;
  fishWeightValue.value = null;
};

// Điền giá trị vào form từ bên ngoài (ví dụ: nhập bằng giọng nói)
const setFormValues = ({ fishType, basketType, fishWeight } = {}) => {
  if (fishType !== undefined) fishTypeValue.value = fishType;
  if (basketType !== undefined) basketTypeValue.value = basketType;
  if (fishWeight !== undefined) {
    fishWeightValue.value = fishWeight === null ? null : String(fishWeight);
  }
};

/**
 * Validate → gọi API → thành công thì reset form và emit weightAdded,
 * thất bại thì giữ nguyên dữ liệu trên form để người dùng thử lại
 * @returns {Promise<boolean>} true nếu lưu thành công
 */
const save = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  clearUndo();

  // Validate input
  if (!fishTypeValue.value) {
    errorMessage.value = "Vui lòng chọn loại cá.";
    return false;
  }
  if (!basketTypeValue.value) {
    errorMessage.value = "Vui lòng chọn loại giỏ.";
    return false;
  }
  const fishWeight = common.parseDecimal(fishWeightValue.value);
  if (!fishWeight || fishWeight <= 0) {
    errorMessage.value = "Số cân cá phải là số dương.";
    return false;
  }

  let dataSaveFishWeight = {
    fishType: fishTypeValue.value,
    fishWeight: fishWeight,
    basketType: basketTypeValue.value,
  };

  isLoading.value = true;
  try {
    let result = await FishWeightAPI.saveFishWeight(dataSaveFishWeight);
    successMessage.value = "Lưu số cân thành công!";
    offerUndo(result?.data?._id);
    recentFishIds.value = pushRecent(RECENT_FISH_KEY, dataSaveFishWeight.fishType);
    recentBasketIds.value = pushRecent(RECENT_BASKET_KEY, dataSaveFishWeight.basketType);
    resetForm();
    // Chỉ báo cho component cha tải lại dữ liệu sau khi đã lưu thành công
    emit("weightAdded", result?.data);
    return true;
  } catch (error) {
    // Hiện lý do cụ thể từ server (ví dụ "Số cân phải lớn hơn trọng lượng giỏ (2 kg)!")
    errorMessage.value = error?.message || "Lưu số cân thất bại, vui lòng thử lại sau.";
    console.error("Lỗi khi lưu số cân cá:", error);
    return false;
  } finally {
    isLoading.value = false;
  }
};

/**
 * Xử lý một câu nói đã phân tích: điền các trường nghe được, rồi thực hiện lệnh "lưu"/"hủy".
 * Lưu thành công thì form được xóa hết, lần nói sau cần nói lại loại cá và loại giỏ.
 */
const handleVoiceParsed = async ({ fishTypeId, basketTypeId, weight, command }) => {
  if (fishTypeId) fishTypeValue.value = fishTypeId;
  if (basketTypeId) basketTypeValue.value = basketTypeId;
  if (weight !== null && weight !== undefined) fishWeightValue.value = String(weight);

  if (command === "cancel") {
    resetWeight();
    return;
  }
  if (command !== "save") return;

  // Không lưu nếu thiếu dữ liệu: báo cụ thể thiếu gì
  if (!fishTypeValue.value) {
    errorMessage.value = "Chưa chọn loại cá";
    return;
  }
  if (!basketTypeValue.value) {
    errorMessage.value = "Chưa chọn loại giỏ";
    return;
  }
  if (!common.parseDecimal(fishWeightValue.value)) {
    errorMessage.value = "Chưa có số cân";
    return;
  }

  // Ghi lại trước khi lưu vì lưu thành công sẽ xóa form
  const fishName = lstDataFishType.value.find((item) => item._id === fishTypeValue.value)?.fishName ?? "";
  const weightText = String(common.parseDecimal(fishWeightValue.value)).replace(".", ",");
  const ok = await save();
  voiceInputRef.value?.announce(
    ok ? `Đã lưu ${fishName.replace(/^cá\s+/i, "")} ${weightText} cân` : "Lưu thất bại"
  );
};

defineExpose({ setFormValues, save });

onMounted(async () => {
  await initDateForm();
});

onBeforeUnmount(clearUndo);
</script>

<style lang="scss" scoped>
.add-weight-container {
  width: 100%;
  border: 1px solid $color-border;
  border-radius: 8px;
  padding: 16px;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 16px;
    text-align: center;
  }

  .loading, .error-message, .success-message {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    text-align: center;
  }

  .loading {
    color: $color-text-primary;
    background-color: lighten($color-background, 5%);
  }

  .error-message {
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .success-message {
    gap: 12px;
    color: $color-success;
    background-color: lighten($color-success, 40%);

    .btn-undo {
      padding: 4px 12px;
      border: 1px solid $color-success;
      border-radius: 4px;
      background-color: $color-card-background;
      color: $color-success;
      font-weight: 600;
      cursor: pointer;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }
  }

  .add-weight-form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .flex-1 {
      flex: 1;
    }

    .add-weight-label {
      font-size: 14px;
      font-weight: 600;
      color: $color-text-primary;
      margin-bottom: 6px;
    }

    // Ô số cân chữ to để đọc được khi đứng cạnh cân
    .add-weight-weight :deep(input) {
      font-size: 24px;
      font-weight: 700;
    }

    .net-preview {
      margin-top: -4px;
      font-size: 14px;
      color: $color-primary;

      &.net-preview--error {
        color: $color-error;
      }
    }
  }
  
  .btn-add-weight {
    margin-top: 20px;
    width: 100%;
    background-color: $color-primary;
    color: $color-card-background;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &:hover:not(:disabled) {
      background-color: darken($color-primary, 10%);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    :deep(.button-control) {
      font-size: 17px;
    }
  }
}

// Điện thoại: bỏ khung thẻ và tiêu đề cho gọn; nút Lưu ghim ngay trên thanh tab, trong tầm ngón cái
@media (max-width: 899.98px) {
  .add-weight-container {
    padding: 0;
    border: none;
    box-shadow: none;
    background-color: transparent;

    h1 {
      display: none;
    }

    // Hoàn tác hay phải bấm vội ngay sau khi lưu nhầm → vùng chạm đủ lớn
    .success-message .btn-undo {
      min-height: 44px;
      padding: 0 16px;
      font-size: 16px;
    }

    .add-weight__save {
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: calc(56px + 8px + env(safe-area-inset-bottom));
      z-index: 700;
      margin-top: 0;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

      :deep(.button-control) {
        font-size: 18px;
      }
    }
  }
}
</style>
