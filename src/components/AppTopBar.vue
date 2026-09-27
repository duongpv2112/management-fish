<template>
  <header class="app-top-bar" v-if="route.name !== 'login'">
    <div class="app-top-bar__title">{{ title }}</div>
    <button
      v-if="topBarAction.label"
      type="button"
      class="app-top-bar__action"
      @click="topBarAction.onClick?.()"
    >
      {{ topBarAction.label }}<template v-if="topBarAction.chevron"> ▾</template>
    </button>
    <button type="button" class="app-top-bar__menu" aria-label="Mở menu" @click="isMenuOpen = true">☰</button>

    <BottomSheet :open="isMenuOpen" title="Menu" @close="isMenuOpen = false">
      <RouterLink
        v-for="link in links"
        :key="link.name"
        :to="{ name: link.name }"
        class="app-top-bar__link"
        active-class="app-top-bar__link--active"
        @click="isMenuOpen = false"
      >
        {{ link.text }}
      </RouterLink>
      <button
        v-if="isVoiceSupported"
        type="button"
        role="switch"
        class="app-top-bar__readback"
        :aria-checked="String(isVoiceReadbackOn)"
        @click="setVoiceReadback(!isVoiceReadbackOn)"
      >
        <span>Đọc xác nhận giọng nói</span>
        <span class="app-top-bar__readback-state" :class="{ 'app-top-bar__readback-state--on': isVoiceReadbackOn }">
          {{ isVoiceReadbackOn ? "Bật" : "Tắt" }}
        </span>
      </button>
      <button type="button" class="app-top-bar__logout" @click="logout">Đăng xuất</button>
    </BottomSheet>
  </header>
</template>

<script setup>
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";

import BottomSheet from "@/components/BottomSheet.vue";
import { clearSession } from "@/common/auth";
import { topBarAction } from "@/common/topBarAction";
import { isVoiceReadbackOn, loadVoiceReadback, setVoiceReadback } from "@/common/voiceReadback";

// Thanh trên cùng cho điện thoại: tên trang, nút hành động của trang, menu ☰
const route = useRoute();
const router = useRouter();

// Mục "Đọc xác nhận giọng nói" chỉ có nghĩa khi trình duyệt nhận được giọng nói
const isVoiceSupported = Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
loadVoiceReadback();

const isMenuOpen = ref(false);

const links = [
  { name: "weigh", text: "Cân cá" },
  { name: "crops", text: "Vụ nuôi" },
  { name: "expenses", text: "Chi phí" },
  { name: "report", text: "Báo cáo" },
  { name: "catalog", text: "Danh mục" },
  { name: "log", text: "Nhật ký" },
];

// Trang ngoài menu (vd. báo cáo vụ) lấy tiêu đề từ route.meta.title
const title = computed(() => links.find((link) => link.name === route.name)?.text ?? route.meta?.title ?? "");

const logout = () => {
  isMenuOpen.value = false;
  clearSession();
  router.push({ name: "login" });
};
</script>

<style lang="scss" scoped>
.app-top-bar {
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 4px 8px 4px 12px;
  background-color: $color-primary;
  color: $color-card-background;

  .app-top-bar__title {
    flex: 1;
    font-size: 17px;
    font-weight: 700;
    white-space: nowrap;
  }

  .app-top-bar__action {
    min-height: 44px;
    max-width: 60%;
    padding: 0 12px;
    border: none;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    color: $color-card-background;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
  }

  .app-top-bar__menu {
    width: 44px;
    height: 44px;
    border: none;
    background: transparent;
    color: $color-card-background;
    font-size: 22px;
    cursor: pointer;
  }

  .app-top-bar__link,
  .app-top-bar__readback,
  .app-top-bar__logout {
    display: flex;
    align-items: center;
    width: 100%;
    min-height: 48px;
    padding: 0 8px;
    border: none;
    border-bottom: 1px solid $color-border;
    background: transparent;
    color: $color-text-primary;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
  }

  .app-top-bar__link--active {
    color: $color-primary;
  }

  .app-top-bar__readback {
    justify-content: space-between;
    gap: 12px;
    font-weight: 400;
  }

  .app-top-bar__readback-state {
    min-width: 48px;
    padding: 4px 10px;
    border-radius: $radius-sm;
    background-color: $color-border;
    color: $color-text-primary;
    font-weight: 600;
    text-align: center;
  }

  .app-top-bar__readback-state--on {
    background-color: $color-primary;
    color: $color-card-background;
  }

  .app-top-bar__logout {
    color: $color-error;
    border-bottom: none;
  }
}
</style>
