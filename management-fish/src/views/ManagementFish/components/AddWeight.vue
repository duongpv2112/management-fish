<template>
  <div class="add-weight-container">
    <h1>ADD WEIGHT</h1>
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
<script>
import { onMounted, ref, watch } from "vue";

import CPCombobox from "@/components/ComboboxComponent.vue";
import CPInput from "@/components/InputComponent.vue";
import CPButton from "@/components/ButtonComponent.vue";

import FishTypeAPI from "@/services/fishTypeAPI";
import BasketTypeAPI from "@/services/basketTypeAPI";
import FishWeightAPI from "@/services/fishWeightAPI";

export default {
  components: { CPCombobox, CPInput, CPButton },
  setup(props, { emit }) {
    const lstDataFishType = ref([]);
    const lstDataBasketType = ref([]);
    const fishTypeValue = ref(null);
    const basketTypeValue = ref(null);
    const fishWeightValue = ref(null);

    const initDateForm = async () => {
      await getDataFishType();
      await getDataBasketType();
    };

    const getDataFishType = async () => {
      let result = await FishTypeAPI.getFishTypes();
      lstDataFishType.value = result.data;
    };

    const getDataBasketType = async () => {
      let result = await BasketTypeAPI.getBasketTypes();
      lstDataBasketType.value = result.data;
    };

    const saveFishWeight = async () => {
      let dataSaveFishWeight = {
        fishType: fishTypeValue.value,
        fishWeight: fishWeightValue.value,
        basketType: basketTypeValue.value,
      };

      let result = await FishWeightAPI.saveFishWeight(dataSaveFishWeight);
      lstDataBasketType.value = result.data;
    };

    onMounted(async () => {
      await initDateForm();
    });

    return {
      lstDataFishType,
      lstDataBasketType,
      fishTypeValue,
      basketTypeValue,
      fishWeightValue,
      saveFishWeight,
    };
  },
};
</script>
<style lang="scss" scoped>
.add-weight-container {
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 16px;

  .add-weight-form {
    display: flex;
    gap: 16px;

    .flex-1 {
      flex: 1;
    }
  }
  
  .btn-add-weight {
    margin-top: 12px;
    
  }
}
</style>
