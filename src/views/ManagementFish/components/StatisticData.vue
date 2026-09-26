<template>
  <div class="statistic-data-container">
    <h1>Thống kê dữ liệu</h1>
    <div v-if="!hasData" class="loading">Chưa có dữ liệu cân cá.</div>
    <div v-show="hasData" class="chart-container">
      <canvas ref="chartCanvas" width="400" height="200"></canvas>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import Chart from 'chart.js/auto';

const props = defineProps({
  // Dữ liệu do ManagementFishViews tải một lần và truyền xuống: [{ fishName, fishWeights: number[] }]
  fishData: {
    type: Array,
    default: () => [],
  },
});

const chartCanvas = ref(null);
let chart = null;

const hasData = computed(() => props.fishData.length > 0);

const destroyChart = () => {
  chart?.destroy();
  chart = null;
};

const hasNetWeight = () =>
  props.fishData.some((item) =>
    item.fishWeightItems?.some((weight) => typeof weight.netWeight === "number")
  );

// Tổng trọng lượng thực (đã trừ giỏ) nếu có, không thì tổng số cân
const totalWeight = (item) => {
  const total = item.fishWeightItems
    ? item.fishWeightItems.reduce((sum, weight) => sum + (weight.netWeight ?? weight.fishWeight), 0)
    : item.fishWeights.reduce((sum, weight) => sum + weight, 0);
  return Math.round(total * 100) / 100;
};

const renderChart = async () => {
  destroyChart();
  if (!hasData.value) return;
  // Đợi DOM cập nhật để canvas hiển thị
  await nextTick();
  if (!chartCanvas.value) return;

  chart = new Chart(chartCanvas.value, {
    type: 'bar',
    data: {
      labels: props.fishData.map(item => item.fishName),
      datasets: [{
        label: hasNetWeight() ? 'Trọng lượng thực (kg)' : 'Tổng cân nặng (kg)',
        data: props.fishData.map(totalWeight),
        backgroundColor: 'rgba(46, 125, 50, 0.6)',
        borderColor: 'rgba(46, 125, 50, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      responsive: true,
      maintainAspectRatio: false
    }
  });
};

watch(() => props.fishData, renderChart, { immediate: true });

onBeforeUnmount(() => {
  destroyChart();
});
</script>

<style lang="scss" scoped>
.statistic-data-container {
  height: 100%;
  width: 100%;
  border: 1px solid $color-border;
  border-radius: 8px;
  background-color: $color-card-background;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;

  h1 {
    font-size: 18px;
    font-weight: 600;
    color: $color-primary;
    margin-bottom: 16px;
    text-align: center;
  }

  .loading, .error-message {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 200px;
    font-size: 16px;
    color: $color-text-primary;
  }

  .error-message {
    color: $color-error;
  }

  .chart-container {
    height: 200px;
  }
}
</style>
