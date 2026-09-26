<template>
  <div class="management-fish">
    <div class="management-fish__heading">Quản lý cân cá nhà Đặng Ánh</div>
    <div class="management-fish__container">
      <div class="viewer-data">
        <DataViewer
          ref="dataViewerRef"
          :isLoading="isLoading"
        ></DataViewer>
      </div>
      <div class="add-data">
        <AddWeight @weightAdded="loadData"></AddWeight>
      </div>
      <div class="statistic-data">
        <StatisticData></StatisticData>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import FishTypeAPI from "../../services/fishTypeAPI";

import DataViewer from "./components/DataViewer.vue";
import AddWeight from "./components/AddWeight.vue";
import StatisticData from "./components/StatisticData.vue";

const dataViewerRef = ref(null);
const isLoading = ref(false);

const loadData = async () => {
  isLoading.value = true;
  let result = await FishTypeAPI.getDataFish();
  let maxRows = Math.max(
    ...Object.values(result.data).map((arr) => arr.fishWeights.length)
  );

  if (dataViewerRef.value) {
    dataViewerRef.value.initDataTable(result.data, maxRows);
  }

  isLoading.value = false;
};

onMounted(async () => {
  await loadData();
});
</script>

<style lang="scss" scoped>
.management-fish {
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
  width: 100%;
  height: 100vh;
  background-color: $color-background;

  .management-fish__heading {
    font-size: 24px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0px;
    font-weight: 600;
    color: $color-primary;
  }

  .management-fish__container {
    display: flex;
    width: 100%;
    gap: 16px;
    flex-wrap: wrap;
    flex: 1;

    .viewer-data {
      width: 100%;
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .add-data {
      flex: 1;
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }

    .statistic-data {
      flex: 1;
      background-color: $color-card-background;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      padding: 16px;
      transition: box-shadow 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }
    }
  }
}
</style>
