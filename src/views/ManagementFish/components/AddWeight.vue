<template>
  <div class="add-weight-container">
    <h1>Thêm cân nặng</h1>
    <VoiceInput
      :fishTypes="lstDataFishType"
      :basketTypes="lstDataBasketType"
      @parsed="handleVoiceParsed"
    />
    <div class="add-weight-form">
      <CPCombobox
        class="flex-1"
        idControl="fishType"
        labelControl="Loại cá"
        :modelValue="fishTypeValue"
        height="36px"
        placeholderText="Nhập loại cá"
        :lstData="lstDataFishType"
        dataField="_id"
        dataFieldText="fishName"
        iconCombobox="icon-chevron-down"
        @update="($event) => (fishTypeValue = $event)"
      />

      <CPCombobox
        class="flex-1"
        idControl="basketType"
        labelControl="Loại giỏ"
        :modelValue="basketTypeValue"
        height="36px"
        placeholderText="Nhập loại giỏ"
        :lstData="lstDataBasketType"
        dataField="_id"
        dataFieldText="basketName"
        iconCombobox="icon-chevron-down"
        @update="($event) => (basketTypeValue = $event)"
      />

      <CPInput
        class="flex-1"
        idControl="fishWeight"
        labelControl="Số cân cá"
        :modelValue="fishWeightValue"
        height="36px"
        placeholderText="Nhập cân cá"
        :typeInput="1"
        @update="($event) => (fishWeightValue = $event)"
      />
    </div>
    <div class="error-message" v-if="errorMessage">{{ errorMessage }}</div>
    <div class="success-message" v-if="successMessage">{{ successMessage }}</div>
    <CPButton
      class="btn-add-weight"
      idControl="btnSaveFishWeight"
      height="36px"
      textButton="Lưu số cân"
      :disabled="isLoading"
      @click="save"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import VoiceInput from "./VoiceInput.vue";

import FishTypeAPI from "@/services/fishTypeAPI";
import BasketTypeAPI from "@/services/basketTypeAPI";
import FishWeightAPI from "@/services/fishWeightAPI";
import { common } from "@/common/common";

const emit = defineEmits(['weightAdded']);

const lstDataFishType = ref([]);
const lstDataBasketType = ref([]);
const fishTypeValue = ref(null);
const basketTypeValue = ref(null);
const fishWeightValue = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);

const initDateForm = async () => {
  await getDataFishType();
  await getDataBasketType();
};

const getDataFishType = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // Không cache: danh sách nhỏ và loại cá mới thêm ở trang Danh mục phải hiện ngay
    let result = await FishTypeAPI.getFishTypes();
    lstDataFishType.value = result.data;
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách loại cá, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách loại cá:", error);
  } finally {
    isLoading.value = false;
  }
};

const getDataBasketType = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // Không cache: danh sách nhỏ và loại giỏ mới thêm ở trang Danh mục phải hiện ngay
    let result = await BasketTypeAPI.getBasketTypes();
    lstDataBasketType.value = result.data;
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách loại giỏ, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách loại giỏ:", error);
  } finally {
    isLoading.value = false;
  }
};

// Sau khi lưu chỉ xóa số cân, giữ loại cá và loại giỏ vì người cân thường cân
// nhiều giỏ cùng một loại cá liên tiếp
const resetWeight = () => {
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
    resetWeight();
    // Chỉ báo cho component cha tải lại dữ liệu sau khi đã lưu thành công
    emit("weightAdded", result?.data);
    return true;
  } catch (error) {
    errorMessage.value = "Lưu số cân thất bại, vui lòng thử lại sau.";
    console.error("Lỗi khi lưu số cân cá:", error);
    return false;
  } finally {
    isLoading.value = false;
  }
};

/**
 * Xử lý một câu nói đã phân tích: điền các trường nghe được, rồi thực hiện lệnh "lưu"/"hủy".
 * Loại cá và loại giỏ tự "dính" giữa các lần nói vì form không xóa hai trường này.
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
  await save();
};

defineExpose({ setFormValues, save });

onMounted(async () => {
  await initDateForm();
});
</script>

<style lang="scss" scoped>
.add-weight-container {
  width: 100%;
  height: 100%;
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
    color: $color-success;
    background-color: lighten($color-success, 40%);
  }

  .add-weight-form {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .flex-1 {
      flex: 1;
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
  }
}
</style>
