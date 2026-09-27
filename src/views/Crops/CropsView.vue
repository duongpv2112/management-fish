<template>
  <div class="crops">
    <h1 class="crops-title">Vụ nuôi</h1>

    <div class="crops__error" v-if="errorMessage">{{ errorMessage }}</div>

    <div v-if="isLoading && ponds.length === 0" class="crops__empty">Đang tải dữ liệu...</div>
    <div v-else-if="!errorMessage && ponds.length === 0" class="crops__empty">
      Chưa có ao. <a href="#/danh-muc">Thêm ao trong Danh mục</a>.
    </div>

    <div class="crops__grid">
      <PondCard
        v-for="pond in ponds"
        :key="pond._id"
        :pond="pond"
        :openCrop="openCropByPond.get(pond._id) ?? null"
        @start="openSheet('start', pond, null)"
        @close="(crop) => openSheet('close', pond, crop)"
      />
    </div>

    <div v-if="closedCrops.length > 0" class="crops__closed">
      <h2>Vụ đã kết thúc</h2>
      <div v-for="crop in closedCrops" :key="crop._id" class="crops__closed-item">
        <span class="crops__closed-name">{{ crop.cropName }}</span>
        <span class="crops__closed-dates">
          {{ formatDateOnly(crop.startDate) }} – {{ formatDateOnly(crop.endDate) }}
        </span>
      </div>
    </div>

    <CropSheet
      :open="sheet.open"
      :mode="sheet.mode"
      :pond="sheet.pond"
      :crop="sheet.crop"
      @close="sheet.open = false"
      @saved="handleSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";

import PondCard from "./components/PondCard.vue";
import CropSheet from "./components/CropSheet.vue";
import PondAPI from "@/services/pondAPI";
import CropAPI from "@/services/cropAPI";
import { formatDateOnly } from "@/common/dateInput";

const ponds = ref([]);
const crops = ref([]);
const isLoading = ref(false);
const errorMessage = ref("");

const sheet = reactive({ open: false, mode: "start", pond: null, crop: null });

const openCropByPond = computed(
  () => new Map(crops.value.filter((crop) => crop.status === "open").map((crop) => [crop.pond?._id, crop]))
);

// Vụ đã kết thúc, mới kết thúc nhất trước
const closedCrops = computed(() =>
  crops.value
    .filter((crop) => crop.status === "closed")
    .sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)))
);

const loadData = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  try {
    const [pondResult, cropResult] = await Promise.all([PondAPI.getPonds(), CropAPI.getCrops()]);
    ponds.value = pondResult?.data ?? [];
    crops.value = cropResult?.data ?? [];
  } catch (error) {
    errorMessage.value = "Không thể tải danh sách ao, vui lòng thử lại sau.";
    console.error("Lỗi khi tải vụ nuôi:", error);
  } finally {
    isLoading.value = false;
  }
};

const openSheet = (mode, pond, crop) => {
  Object.assign(sheet, { open: true, mode, pond, crop });
};

const handleSaved = async () => {
  sheet.open = false;
  await loadData();
};

onMounted(loadData);
</script>

<style lang="scss" scoped>
.crops {
  width: 100%;
  padding: 0 16px 20px;

  .crops-title {
    font-size: 24px;
    text-transform: uppercase;
    text-align: center;
    padding: 20px 0;
    font-weight: 600;
    color: $color-primary;
  }

  .crops__error {
    margin-bottom: 12px;
    padding: 8px;
    border-radius: $radius-md;
    text-align: center;
    color: $color-error;
    background-color: lighten($color-error, 40%);
  }

  .crops__empty {
    padding: 12px 0;

    a {
      color: $color-primary;
      font-weight: 600;
    }
  }

  .crops__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .crops__closed {
    margin-top: 24px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }
  }

  .crops__closed-item {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    padding: 12px 8px;
    border-bottom: 1px solid $color-border;
  }

  .crops__closed-name {
    font-weight: 600;
  }

  .crops__closed-dates {
    font-size: 14px;
    opacity: 0.75;
  }
}

@media (max-width: 899.98px) {
  .crops {
    padding: 0 12px 20px;

    .crops-title {
      font-size: 20px;
      padding: 12px 0;
    }

    .crops__grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
