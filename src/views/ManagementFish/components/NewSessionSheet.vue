<template>
  <BottomSheet :open="open" title="Phiên mới" @close="emit('close')">
    <div class="new-session">
      <div class="new-session__error" v-if="errorMessage">{{ errorMessage }}</div>

      <div class="new-session__label">Kéo cá ao nào?</div>
      <div v-if="isLoading" class="new-session__loading">Đang tải danh sách ao...</div>
      <ChoiceGrid
        v-else
        idPrefix="newSessionPond"
        :items="ponds"
        :modelValue="selectedPondId"
        textField="pondName"
        :subText="pondSubText"
        :maxVisible="8"
        moreLabel="Ao khác"
        emptyText="Chưa có ao. Thêm ao trong Danh mục."
        :showCatalogLink="!loadFailed"
        :disabled="isSaving"
        @update="($event) => (selectedPondId = $event)"
      />

      <CPInput
        idControl="new-session-buyer"
        labelControl="Người mua (có thể để trống)"
        :modelValue="buyerName"
        placeholderText="Ví dụ: Anh Tuấn"
        height="44px"
        @update="($event) => (buyerName = $event)"
      />

      <CPButton
        class="btn-create-session"
        typeButton="primary"
        textButton="Tạo phiên"
        height="48px"
        :disabled="!selectedPondId || isSaving"
        @click="createSession"
      />
    </div>
  </BottomSheet>
</template>

<script setup>
import { computed, ref, watch } from "vue";

import BottomSheet from "@/components/BottomSheet.vue";
import ChoiceGrid from "@/components/ChoiceGrid.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";
import PondAPI from "@/services/pondAPI";
import CropAPI from "@/services/cropAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";

// Tạo phiên bán: chọn ao (phiên gắn vào vụ đang nuôi của ao đó) và tên người mua
const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["close", "created"]);

const ponds = ref([]);
const openCrops = ref([]);
const selectedPondId = ref(null);
const buyerName = ref("");
const isLoading = ref(false);
const loadFailed = ref(false);
const isSaving = ref(false);
const errorMessage = ref("");

const openCropByPond = computed(() => new Map(openCrops.value.map((crop) => [crop.pond?._id, crop])));

const pondSubText = (pond) => openCropByPond.value.get(pond._id)?.cropName ?? "Chưa có vụ";

// Mỗi lần mở: làm mới form và tải lại ao / vụ (có thể vừa đổi ở trang Vụ nuôi)
const loadChoices = async () => {
  isLoading.value = true;
  loadFailed.value = false;
  try {
    const [pondResult, cropResult] = await Promise.all([PondAPI.getPonds(), CropAPI.getCrops({ status: "open" })]);
    ponds.value = pondResult?.data ?? [];
    openCrops.value = cropResult?.data ?? [];
  } catch (error) {
    loadFailed.value = true;
    errorMessage.value = "Không thể tải danh sách ao, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách ao:", error);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    selectedPondId.value = null;
    buyerName.value = "";
    errorMessage.value = "";
    loadChoices();
  }
);

const createSession = async () => {
  errorMessage.value = "";
  let crop = openCropByPond.value.get(selectedPondId.value);
  if (!crop && !window.confirm("Ao này chưa có vụ, bắt đầu vụ mới?")) return;

  isSaving.value = true;
  try {
    if (!crop) {
      crop = (await CropAPI.createCrop({ pondId: selectedPondId.value }))?.data;
      // Ghi nhận ngay: nếu tạo phiên lỗi, bấm lại sẽ dùng vụ này thay vì tạo vụ lần nữa
      openCrops.value = [...openCrops.value, crop];
    }
    const result = await WeighSessionAPI.createWeighSession({ buyerName: buyerName.value.trim(), cropId: crop._id });
    emit("created", result?.data);
    emit("close");
  } catch (error) {
    errorMessage.value = error?.message || "Tạo phiên cân không thành công!";
  } finally {
    isSaving.value = false;
  }
};
</script>

<style lang="scss" scoped>
.new-session {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .new-session__error {
    padding: 8px;
    border-radius: $radius-md;
    font-size: 14px;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .new-session__label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: -4px;
  }

  .new-session__loading {
    font-size: 14px;
    opacity: 0.75;
  }
}
</style>
