<template>
  <!-- Điện thoại: một việc mỗi tab (Cân | Bảng | Tiền), nút Lưu ghim đáy -->
  <div v-if="isMobile" class="management-fish management-fish--mobile">
    <div class="load-error" v-if="loadError">{{ loadError }}</div>

    <!-- v-show để form cân không bị tạo lại (mất số đang nhập) khi chuyển tab -->
    <section v-show="activeMobileTab === 'can'" class="mobile-panel">
      <div v-if="isSessionClosed" class="session-closed-panel">
        <p>Phiên đã kết thúc.</p>
        <button
          v-if="openSession"
          type="button"
          class="btn-go-open"
          @click="selectSession(openSession._id)"
        >
          Về phiên đang mở
        </button>
        <button type="button" class="btn-new-session-mobile" @click="isNewSessionOpen = true">Phiên mới</button>
      </div>
      <template v-else>
        <AddWeight
          :sessionFishData="fishData"
          @weightAdded="handleWeightAdded"
          @weightUndone="handleEditDone"
        ></AddWeight>
        <RecentWeights
          :fishData="fishData"
          :basketTypes="basketTypes"
          @edit="openEditDialog"
          @deleted="handleEditDone"
        />
      </template>
    </section>

    <section v-if="activeMobileTab === 'bang'" class="mobile-panel">
      <FishWeightCards :fishData="fishData" :readOnly="isSessionClosed" @editItem="openEditDialog" />
    </section>

    <section v-if="activeMobileTab === 'tien'" class="mobile-panel">
      <PriceCards :sessionId="selectedSessionId" :refreshKey="summaryRefreshKey" :fishData="fishData" />
    </section>

    <MobileTabBar v-model="activeMobileTab" />
    <SessionSheet
      :open="isSessionSheetOpen"
      :sessions="sessions"
      :selectedId="selectedSessionId"
      @close="isSessionSheetOpen = false"
      @select="selectSession"
      @closed="handleSessionChanged"
      @requestNew="isNewSessionOpen = true"
      @requestCrop="isSessionCropOpen = true"
    />
    <NewSessionSheet :open="isNewSessionOpen" @close="isNewSessionOpen = false" @created="handleSessionChanged" />
    <SessionCropSheet
      :open="isSessionCropOpen"
      :session="selectedSession ?? null"
      @close="isSessionCropOpen = false"
      @updated="handleSessionCropUpdated"
    />
    <WeightEditDialog
      v-if="editingItem"
      :item="editingItem"
      :fishTypes="fishData"
      :basketTypes="basketTypes"
      @saved="handleEditDone"
      @deleted="handleEditDone"
      @close="editingItem = null"
    />
  </div>

  <!-- Máy tính: nhập bên trái, xem bên phải -->
  <div v-else class="management-fish">
    <div class="management-fish__top">
      <SessionBar
        class="management-fish__session"
        :sessions="sessions"
        :selectedId="selectedSessionId"
        @select="selectSession"
        @closed="handleSessionChanged"
        @requestNew="isNewSessionOpen = true"
        @requestCrop="isSessionCropOpen = true"
      />
      <NewSessionSheet :open="isNewSessionOpen" @close="isNewSessionOpen = false" @created="handleSessionChanged" />
      <SessionCropSheet
        :open="isSessionCropOpen"
        :session="selectedSession ?? null"
        @close="isSessionCropOpen = false"
        @updated="handleSessionCropUpdated"
      />
    </div>
    <div class="management-fish__container">
      <div class="management-fish__left">
        <div class="add-data">
          <div v-if="isSessionClosed" class="session-closed">
            Phiên đã kết thúc. Chọn phiên đang mở hoặc bấm "Phiên mới" để cân tiếp.
          </div>
          <template v-else>
            <AddWeight
              :sessionFishData="fishData"
              @weightAdded="handleWeightAdded"
              @weightUndone="handleEditDone"
            ></AddWeight>
            <RecentWeights
              :fishData="fishData"
              :basketTypes="basketTypes"
              @edit="openEditDialog"
              @deleted="handleEditDone"
            />
          </template>
        </div>
      </div>
      <div class="management-fish__right">
      <div class="viewer-data">
        <div class="load-error" v-if="loadError">{{ loadError }}</div>
        <DataViewer
          ref="dataViewerRef"
          :isLoading="isLoading"
          :readOnly="isSessionClosed"
          @editItem="openEditDialog"
        ></DataViewer>
      </div>
      <div class="statistic-data">
        <div class="statistic-tabs">
          <button
            type="button"
            class="statistic-tabs__price"
            :class="{ active: activeTab === 'price' }"
            @click="activeTab = 'price'"
          >
            Tiền
          </button>
          <button
            type="button"
            class="statistic-tabs__chart"
            :class="{ active: activeTab === 'chart' }"
            @click="activeTab = 'chart'"
          >
            Biểu đồ
          </button>
        </div>
        <PriceSummary
          v-if="activeTab === 'price'"
          :sessionId="selectedSessionId"
          :refreshKey="summaryRefreshKey"
        />
        <StatisticData v-else :fishData="fishData"></StatisticData>
      </div>
      </div>
    </div>

    <WeightEditDialog
      v-if="editingItem"
      :item="editingItem"
      :fishTypes="fishData"
      :basketTypes="basketTypes"
      @saved="handleEditDone"
      @deleted="handleEditDone"
      @close="editingItem = null"
    />
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { routeLocationKey, routerKey } from "vue-router";

import FishTypeAPI from "../../services/fishTypeAPI";
import WeighSessionAPI from "@/services/weighSessionAPI";
import { useIsMobile } from "@/composables/useIsMobile";
import { clearTopBarAction, setTopBarAction } from "@/common/topBarAction";
import { sessionLabel } from "@/common/sessionLabel";

import MobileTabBar from "./components/MobileTabBar.vue";
import SessionSheet from "./components/SessionSheet.vue";
import FishWeightCards from "./components/FishWeightCards.vue";
import PriceCards from "./components/PriceCards.vue";
import SessionBar from "./components/SessionBar.vue";
import NewSessionSheet from "./components/NewSessionSheet.vue";
import SessionCropSheet from "./components/SessionCropSheet.vue";
import DataViewer from "./components/DataViewer.vue";
import AddWeight from "./components/AddWeight.vue";
import StatisticData from "./components/StatisticData.vue";
import PriceSummary from "./components/PriceSummary.vue";
import WeightEditDialog from "./components/WeightEditDialog.vue";
import RecentWeights from "./components/RecentWeights.vue";
import BasketTypeAPI from "@/services/basketTypeAPI";

const dataViewerRef = ref(null);
const isLoading = ref(false);

const fishData = ref([]);
const loadError = ref("");

const activeTab = ref("price");
// Tăng lên để bảng tiền tải lại sau khi thêm/sửa/xóa lần cân
const summaryRefreshKey = ref(0);

const sessions = ref([]);
const selectedSessionId = ref(null);
const selectedSession = computed(() =>
  sessions.value.find((session) => session._id === selectedSessionId.value)
);
// Phiên đã kết thúc thì chỉ xem, không thêm/sửa/xóa lần cân
const isSessionClosed = computed(() => selectedSession.value?.status === "closed");
const openSession = computed(() => sessions.value.find((session) => session.status === "open"));

const isMobile = useIsMobile();
const isSessionSheetOpen = ref(false);
// Sheet chọn ao khi tạo phiên mới / gán ao cho phiên đang chọn (dùng cho cả điện thoại và máy tính)
const isNewSessionOpen = ref(false);
const isSessionCropOpen = ref(false);

// Tab điện thoại lưu trong ?tab= để tải lại trang/Back vẫn đúng tab.
// inject thay cho useRoute để component vẫn chạy khi không có router (test cũ)
const MOBILE_TABS = ["can", "bang", "tien"];
const route = inject(routeLocationKey, null);
const router = inject(routerKey, null);
const localMobileTab = ref("can");
const activeMobileTab = computed({
  get() {
    const tab = route ? route.query.tab : localMobileTab.value;
    return MOBILE_TABS.includes(tab) ? tab : "can";
  },
  set(tab) {
    if (!router || !route) {
      localMobileTab.value = tab;
      return;
    }
    const query = { ...route.query };
    if (tab === "can") delete query.tab;
    else query.tab = tab;
    router.replace({ query });
  },
});

// Điện thoại: nút phiên nằm trên thanh trên cùng (AppTopBar)
watch(
  [isMobile, selectedSession],
  () => {
    if (isMobile.value) {
      setTopBarAction(sessionLabel(selectedSession.value), () => {
        isSessionSheetOpen.value = true;
      });
    } else {
      clearTopBarAction();
    }
  },
  { immediate: true }
);

onBeforeUnmount(clearTopBarAction);

// Tải danh sách phiên; giữ phiên đang chọn nếu còn, không thì chọn phiên đang mở (hoặc mới nhất)
const loadSessions = async ({ selectOpen = false } = {}) => {
  try {
    let result = await WeighSessionAPI.getWeighSessions();
    sessions.value = result?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách phiên cân:", error);
  }
  const stillExists = sessions.value.some((session) => session._id === selectedSessionId.value);
  if (selectOpen || !stillExists) {
    const openSession = sessions.value.find((session) => session.status === "open");
    selectedSessionId.value = (openSession ?? sessions.value[0])?._id ?? null;
  }
};

// Tải dữ liệu một lần rồi truyền xuống cả bảng và biểu đồ
const loadData = async () => {
  isLoading.value = true;
  loadError.value = "";
  try {
    let result = await FishTypeAPI.getDataFish(selectedSessionId.value ?? undefined);
    fishData.value = result?.data ?? [];
  } catch (error) {
    loadError.value = "Không thể tải dữ liệu, vui lòng thử lại sau.";
    console.error("Lỗi khi tải dữ liệu cá:", error);
  } finally {
    refreshTable();
    isLoading.value = false;
  }
};

// Đổ dữ liệu vào bảng; gọi cả khi bảng vừa được tạo (mở tab Bảng trên điện thoại, đổi bố cục)
const refreshTable = () => {
  // Math.max(0, ...) để DB trống không cho -Infinity
  let maxRows = Math.max(0, ...fishData.value.map((fishType) => fishType.fishWeights.length));
  dataViewerRef.value?.initDataTable(fishData.value, maxRows);
};

watch(dataViewerRef, (viewer) => {
  if (viewer) refreshTable();
});

const editingItem = ref(null);
const basketTypes = ref([]);

// Loại giỏ dùng cho tên giỏ ở "Lần cân gần đây" và cho hộp thoại sửa
const loadBasketTypes = async () => {
  try {
    let result = await BasketTypeAPI.getBasketTypes();
    basketTypes.value = result?.data ?? [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách loại giỏ:", error);
  }
};

// Mở hộp thoại sửa/xóa một lần cân; tải lại loại giỏ lúc mở để luôn mới nhất
const openEditDialog = async (item) => {
  if (isSessionClosed.value) return;
  editingItem.value = item;
  await loadBasketTypes();
};

const handleEditDone = async () => {
  editingItem.value = null;
  summaryRefreshKey.value++;
  await loadData();
};

const selectSession = async (sessionId) => {
  selectedSessionId.value = sessionId;
  await loadData();
};

// Tạo/kết thúc phiên, hoặc lần cân đầu tiên tự tạo phiên: tải lại danh sách và chuyển sang phiên đang mở
const handleSessionChanged = async () => {
  await loadSessions({ selectOpen: true });
  await loadData();
};

// Gán ao cho phiên: chỉ cần tải lại danh sách phiên (tên ao), giữ phiên đang xem
const handleSessionCropUpdated = async () => {
  await loadSessions();
};

const handleWeightAdded = async () => {
  if (!selectedSession.value) await loadSessions({ selectOpen: true });
  summaryRefreshKey.value++;
  await loadData();
};

onMounted(async () => {
  await loadSessions({ selectOpen: true });
  // Link từ báo cáo vụ (?session=<id>) mở đúng phiên đó, ví dụ để nhập giá còn thiếu
  const linkedSessionId = route?.query.session;
  if (linkedSessionId && sessions.value.some((session) => session._id === linkedSessionId)) {
    selectedSessionId.value = linkedSessionId;
  }
  await Promise.all([loadData(), loadBasketTypes()]);
});
</script>

<style lang="scss" scoped>
$card-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

@mixin card {
  background-color: $color-card-background;
  border-radius: $radius-lg;
  box-shadow: $card-shadow;
  padding: 16px;
}

.load-error {
  color: $color-error;
  background-color: lighten($color-error, 40%);
  border-radius: $radius-md;
  padding: 8px;
  margin-bottom: 12px;
  text-align: center;
  font-size: 14px;
}

// ---------- Máy tính (≥ 900px) ----------
.management-fish {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  width: 100%;
  flex: 1;
  background-color: $color-background;

  .management-fish__top {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  .management-fish__session {
    flex: 1;
    min-width: 320px;
  }

  .management-fish__container {
    display: grid;
    grid-template-columns: 360px minmax(0, 1fr);
    gap: 16px;
    align-items: start;
  }

  .management-fish__left,
  .management-fish__right {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  // Không bọc thêm thẻ: AddWeight và RecentWeights tự là thẻ, xếp chồng theo chiều cao nội dung
  .add-data {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .session-closed {
      @include card;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      font-weight: 600;
      color: $color-text-primary;
    }
  }

  .viewer-data {
    @include card;
  }

  .statistic-data {
    @include card;

    .statistic-tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 12px;
      border-bottom: 1px solid $color-border;

      button {
        min-height: 40px;
        padding: 8px 16px;
        border: none;
        border-bottom: 2px solid transparent;
        background: transparent;
        cursor: pointer;
        font-weight: 600;
        color: $color-text-primary;

        &.active {
          color: $color-primary;
          border-bottom-color: $color-primary;
        }
      }
    }
  }
}

// ---------- Điện thoại (< 900px) ----------
.management-fish--mobile {
  gap: 12px;
  padding: 12px;
  // Chừa chỗ cho nút Lưu ghim đáy (52px) + thanh tab (56px) + khoảng cách
  padding-bottom: calc(56px + 52px + 32px + env(safe-area-inset-bottom));

  .mobile-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .session-closed-panel {
    @include card;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: $color-text-primary;

    button {
      min-height: 48px;
      border-radius: $radius-md;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-go-open {
      border: none;
      background-color: $color-primary;
      color: $color-card-background;
    }

    .btn-new-session-mobile {
      border: 1px solid $color-border-strong;
      background-color: $color-card-background;
      color: $color-primary;
    }
  }
}
</style>
