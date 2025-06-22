<template>
  <div class="add-weight-container">
    <h1>Thêm cân nặng</h1>
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
    <CPButton
      class="btn-add-weight"
      idControl="fishWeight"
      height="36px"
      textButton="Lưu số cân"
      @click="saveFishWeight"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";

import FishTypeAPI from "@/services/fishTypeAPI";
import BasketTypeAPI from "@/services/basketTypeAPI";
import FishWeightAPI from "@/services/fishWeightAPI";

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
    // Kiểm tra xem dữ liệu có được lưu trong localStorage không
    const cachedFishData = localStorage.getItem('fishTypes');
    if (cachedFishData) {
      const parsedFishData = JSON.parse(cachedFishData);
      // Kiểm tra xem dữ liệu trong cache có cũ hơn 10 phút không
      if (Date.now() - parsedFishData.timestamp < 10 * 60 * 1000) {
        lstDataFishType.value = parsedFishData.data;
        isLoading.value = false;
        return;
      }
    }
    
    // Nếu không có cache hợp lệ, lấy dữ liệu từ API
    let result = await FishTypeAPI.getFishTypes();
    lstDataFishType.value = result.data;
    // Lưu dữ liệu vào cache kèm theo thời gian
    localStorage.setItem('fishTypes', JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
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
    // Kiểm tra xem dữ liệu có được lưu trong localStorage không
    const cachedBasketData = localStorage.getItem('basketTypes');
    if (cachedBasketData) {
      const parsedBasketData = JSON.parse(cachedBasketData);
      // Kiểm tra xem dữ liệu trong cache có cũ hơn 10 phút không
      if (Date.now() - parsedBasketData.timestamp < 10 * 60 * 1000) {
        lstDataBasketType.value = parsedBasketData.data;
        isLoading.value = false;
        return;
      }
    }
    
    // Nếu không có cache hợp lệ, lấy dữ liệu từ API
    let result = await BasketTypeAPI.getBasketTypes();
    lstDataBasketType.value = result.data;
    // Lưu dữ liệu vào cache kèm theo thời gian
    localStorage.setItem('basketTypes', JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách loại giỏ, vui lòng thử lại sau.";
    console.error("Lỗi khi tải danh sách loại giỏ:", error);
  } finally {
    isLoading.value = false;
  }
};

const saveFishWeight = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  
  // Validate input
  if (!fishTypeValue.value) {
    errorMessage.value = "Vui lòng chọn loại cá.";
    return;
  }
  if (!basketTypeValue.value) {
    errorMessage.value = "Vui lòng chọn loại giỏ.";
    return;
  }
  if (!fishWeightValue.value || fishWeightValue.value <= 0) {
    errorMessage.value = "Số cân cá phải là số dương.";
    return;
  }

  let dataSaveFishWeight = {
    fishType: fishTypeValue.value,
    fishWeight: parseFloat(fishWeightValue.value),
    basketType: basketTypeValue.value,
  };

  // Đặt lại form trước khi lưu
  fishTypeValue.value = null;
  basketTypeValue.value = null;
  fishWeightValue.value = null;
  
  // Phát sự kiện để thông báo cho component cha bắt đầu loading danh sách cân
  emit('weightAdded');
  
  isLoading.value = true;
  try {
    let result = await FishWeightAPI.saveFishWeight(dataSaveFishWeight);
    successMessage.value = "Lưu số cân thành công!";
    // Đảm bảo form được đặt lại sau khi lưu thành công
    fishTypeValue.value = null;
    basketTypeValue.value = null;
    fishWeightValue.value = null;
  } catch (error) {
    errorMessage.value = "Lưu số cân thất bại, vui lòng thử lại sau.";
    console.error("Lỗi khi lưu số cân cá:", error);
    // Đặt lại form ngay cả khi có lỗi để đảm bảo dữ liệu không còn trên giao diện
    fishTypeValue.value = null;
    basketTypeValue.value = null;
    fishWeightValue.value = null;
  } finally {
    isLoading.value = false;
  }
};

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
