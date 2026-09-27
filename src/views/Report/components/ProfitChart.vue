<template>
  <div class="profit-chart">
    <p v-if="!hasData" class="profit-chart__empty">Chưa có vụ nào trong kỳ.</p>
    <div v-else class="profit-chart__canvas">
      <canvas ref="chartCanvas"></canvas>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import Chart from "chart.js/auto";
import { formatMoney } from "@/common/currency";

const props = defineProps({
  // [{ label: "Ao 1 · Vụ 03/2026", profit: số âm = lỗ }]
  rows: {
    type: Array,
    default: () => [],
  },
});

// Cùng màu $color-primary / $color-error
const PROFIT_COLOR = "rgba(46, 125, 50, 0.7)";
const LOSS_COLOR = "rgba(211, 47, 47, 0.7)";

const chartCanvas = ref(null);
let chart = null;

const hasData = computed(() => props.rows.length > 0);

const destroyChart = () => {
  chart?.destroy();
  chart = null;
};

const renderChart = async () => {
  destroyChart();
  if (!hasData.value) return;
  // Đợi DOM cập nhật để canvas hiển thị
  await nextTick();
  if (!chartCanvas.value) return;

  chart = new Chart(chartCanvas.value, {
    type: "bar",
    data: {
      labels: props.rows.map((row) => row.label),
      datasets: [
        {
          label: "Lãi / lỗ",
          data: props.rows.map((row) => row.profit),
          backgroundColor: props.rows.map((row) => (row.profit < 0 ? LOSS_COLOR : PROFIT_COLOR)),
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${context.raw < 0 ? "Lỗ" : "Lãi"} ${formatMoney(Math.abs(context.raw))}`,
          },
        },
      },
      scales: { y: { beginAtZero: true } },
      responsive: true,
      maintainAspectRatio: false,
    },
  });
};

watch(() => props.rows, renderChart, { immediate: true });

onBeforeUnmount(() => {
  destroyChart();
});
</script>

<style lang="scss" scoped>
.profit-chart__canvas {
  position: relative;
  height: 260px;
}

.profit-chart__empty {
  padding: 12px 0;
  color: $color-text-primary;
}
</style>
