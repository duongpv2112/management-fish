<template>
  <div class="management-fish">
    <div class="management-fish__heading">Quản lý cân cá nhà Đặng Ánh</div>
    <div class="management-fish__container">
      <!-- <div class="viewer-data" v-if="!isLoading">
        <DataViewer
          :lstDataTable="dataTable"
          :numberRows="maxRows"
        ></DataViewer>
      </div> -->
      <div class="add-data">
        <AddWeight></AddWeight>
      </div>
      <div class="statistic-data">
        <StatisticData></StatisticData>
      </div>
    </div>
  </div>
</template>
<script>
import { onMounted, ref } from "vue";
import FishTypeAPI from "../../services/fishTypeAPI";
import DataViewer from "./components/DataViewer.vue";
import AddWeight from "./components/AddWeight.vue";
import StatisticData from "./components/StatisticData.vue";

export default {
  components: {
    DataViewer,
    AddWeight,
    StatisticData,
  },
  setup(props, { emit }) {
    const dataTable = ref([]);
    const maxRows = ref(0);
    const isLoading = ref(false);

    const loadData = async () => {
      isLoading.value = true;
      let result = await FishTypeAPI.getDataFish();
      dataTable.value = result.data;
      maxRows.value = Math.max(
        ...Object.values(dataTable.value).map((arr) => arr.fishWeights.length)
      );
      isLoading.value = false;
    };

    onMounted(async () => {
      await loadData();
    });

    return {
      dataTable,
      maxRows,
      isLoading,
    };
  },
};
</script>
<style lang="scss" scoped>
.management-fish {
  display: flex;
  flex-direction: column;
  padding: 0 16px 20px;
  width: 100%;
  height: 100vh;

  .management-fish__heading {
    font-size: 24px;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px 0px;
    font-weight: 600;
  }

  .management-fish__container {
    display: flex;
    width: 100%;
    gap: 10px;
    flex-wrap: wrap;
    flex: 1;

    .viewer-data {
      width: 100%;
    }

    .add-data {
      flex: 1;
    }

    .statistic-data {
      flex: 1;
    }
  }
}
</style>
