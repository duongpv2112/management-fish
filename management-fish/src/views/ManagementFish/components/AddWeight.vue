<template>
  <div class="add-weight-container">
    <h1>ADD WEIGHT</h1>
    <div class="add-weight-form">
      <CPCombobox
        class="flex-1"
        labelText="Loại cá"
        :modelValue="fishTypeValue"
        height="36px"
        placeholderText="Chọn loại cá"
        :lstData="lstDataFishType"
        dataField="ID"
        dataFieldText="Name"
        iconCombobox="icon-chevron-down"
        @update="($event) => (fishTypeValue = $event)"
      />

      <CPCombobox
        class="flex-1"
        labelText="Loại giỏ"
        :modelValue="basketTypeValue"
        height="36px"
        placeholderText="Chọn loại cá"
        :lstData="lstDataBasketType"
        dataField="ID"
        dataFieldText="Name"
        iconCombobox="icon-chevron-down"
        @update="($event) => (basketTypeValue = $event)"
      />
    </div>
  </div>
</template>
<script>
import CPCombobox from "@/components/ComboboxComponent.vue";
import { onMounted, ref, watch } from "vue";

export default {
  components: { CPCombobox },
  setup(props, { emit }) {
    const lstDataFishType = ref([
      {
        ID: 1,
        Name: "Cá Chắm 1",
      },
      {
        ID: 2,
        Name: "Cá Cơm 2",
      },
      {
        ID: 3,
        Name: "Cá Quả 3",
      },
      {
        ID: 4,
        Name: "Cá Mập 4",
      },
      {
        ID: 5,
        Name: "Cá Kình 5",
      },
      {
        ID: 6,
        Name: "Cá Chuối 6",
      },
      {
        ID: 7,
        Name: "Cá Rô 7",
      },
      {
        ID: 8,
        Name: "Cá Voi 8",
      },
    ]);
    const lstDataBasketType = ref([
      {
        ID: 1,
        Name: "Cá Chắm 1",
      },
      {
        ID: 2,
        Name: "Cá Cơm 2",
      },
      {
        ID: 3,
        Name: "Cá Quả 3",
      },
      {
        ID: 4,
        Name: "Cá Mập 4",
      },
      {
        ID: 5,
        Name: "Cá Kình 5",
      },
      {
        ID: 6,
        Name: "Cá Chuối 6",
      },
      {
        ID: 7,
        Name: "Cá Rô 7",
      },
      {
        ID: 8,
        Name: "Cá Voi 8",
      },
    ]);
    const fishTypeValue = ref(null);
    const basketTypeValue = ref(null);
    return {
      lstDataFishType,
      lstDataBasketType,
      fishTypeValue,
      basketTypeValue,
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
}
</style>
