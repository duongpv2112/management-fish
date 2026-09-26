<template>
  <nav class="app-nav">
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
  </nav>
</template>

<script setup>
import { RouterLink } from "vue-router";

const links = [
  { name: "weigh", text: "Cân cá" },
  { name: "catalog", text: "Danh mục" },
];
</script>

<style lang="scss" scoped>
.app-nav {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background-color: $color-primary;

  .app-nav__link {
    padding: 8px 16px;
    border-radius: 6px;
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
