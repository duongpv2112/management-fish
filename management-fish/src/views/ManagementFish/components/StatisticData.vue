<template>
  <div class="statistic-data-container">
    <h1>Thống kê dữ liệu</h1>
    <div v-if="isLoading" class="loading">Đang tải dữ liệu...</div>
    <div v-else-if="errorMessage" class="error-message">{{ errorMessage }}</div>
    <div v-else class="chart-container">
      <canvas id="fishWeightChart" width="400" height="200"></canvas>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import Chart from 'chart.js/auto';
import FishTypeAPI from "@/services/fishTypeAPI";

const dataTable = ref([]);
const errorMessage = ref("");
const isLoading = ref(false);

const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    // Kiểm tra xem dữ liệu có được lưu trong localStorage không
    const cachedData = localStorage.getItem('fishData');
    if (cachedData) {
      const parsedData = JSON.parse(cachedData);
      // Kiểm tra xem dữ liệu trong cache có cũ hơn 5 phút không
      if (Date.now() - parsedData.timestamp < 5 * 60 * 1000) {
        dataTable.value = parsedData.data;
        renderChart();
        isLoading.value = false;
        return;
      }
    }
    
    // Nếu không có cache hợp lệ, lấy dữ liệu từ API
    let result = await FishTypeAPI.getDataFish();
    dataTable.value = result.data;
    // Lưu dữ liệu vào cache kèm theo thời gian
    localStorage.setItem('fishData', JSON.stringify({
      data: result.data,
      timestamp: Date.now()
    }));
    renderChart();
  } catch (error) {
    errorMessage.value = "Không thể kết nối đến máy chủ, vui lòng thử lại sau.";
    console.error("Lỗi khi tải dữ liệu:", error);
  } finally {
    isLoading.value = false;
  }
};

const renderChart = () => {
  if (dataTable.value.length === 0) return;
  setTimeout(() => {
    const canvas = document.getElementById('fishWeightChart');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dataTable.value.map(item => item.fishName),
          datasets: [{
            label: 'Tổng cân nặng (kg)',
            data: dataTable.value.map(item => {
              return item.fishWeights.reduce((sum, weight) => sum + weight, 0);
            }),
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
    } else {
      console.error("Không tìm thấy phần tử canvas");
    }
  }, 100); // Trì hoãn để đảm bảo DOM được render hoàn toàn
};

onMounted(async () => {
  await loadData();
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
