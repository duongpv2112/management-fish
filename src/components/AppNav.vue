<template>
  <nav class="app-nav" v-if="route.name !== 'login'">
    <RouterLink
      v-for="link in links"
      :key="link.name"
      :to="{ name: link.name }"
      class="app-nav__link"
      active-class="app-nav__link--active"
      exact-active-class="app-nav__link--active"
    >
      {{ link.text }}
    </RouterLink>
    <button type="button" class="app-nav__logout" @click="logout">Đăng xuất</button>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute, useRouter } from "vue-router";
import { clearSession } from "@/common/auth";

const route = useRoute();
const router = useRouter();

const logout = () => {
  clearSession();
  router.push({ name: "login" });
};

const links = [
  { name: "weigh", text: "Cân cá" },
  { name: "crops", text: "Vụ nuôi" },
  { name: "expenses", text: "Chi phí" },
  { name: "report", text: "Báo cáo" },
  { name: "catalog", text: "Danh mục" },
  { name: "log", text: "Nhật ký" },
];
</script>

<style lang="scss" scoped>
.app-nav {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background-color: $color-primary;

  .app-nav__logout {
    margin-left: auto;
    padding: 8px 16px;
    border: 1px solid $color-card-background;
    border-radius: $radius-md;
    background: transparent;
    color: $color-card-background;
    font-weight: 600;
    cursor: pointer;

    &:hover {
      background-color: darken($color-primary, 8%);
    }
  }

  .app-nav__link {
    padding: 8px 16px;
    border-radius: $radius-md;
    color: $color-card-background;
    text-decoration: none;
    font-weight: 600;
    transition: background-color 0.3s ease;

    &:hover {
      background-color: darken($color-primary, 8%);
    }

    &.app-nav__link--active {
      background-color: $color-card-background;
      color: $color-primary;
    }
  }
}
</style>
