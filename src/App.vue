<script setup>
import { RouterView } from "vue-router";
import AppNav from "@/components/AppNav.vue";
</script>

<template>
  <div class="app-layout">
    <AppNav />

    <main class="app-layout__main">
      <RouterView />
    </main>
  </div>
</template>

<style lang="scss">
@import "@/assets/scss/main.scss";

.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: $color-background;

  .app-layout__main {
    flex: 1;
    display: flex;
  }
}
</style>
