<template>
  <div class="catalog">
    <h1 class="catalog-title">Danh mục</h1>
    <div class="catalog__container">
      <FishTypeManager />
      <BasketTypeManager />
    </div>
  </div>
</template>

<script setup>
import FishTypeManager from "./components/FishTypeManager.vue";
import BasketTypeManager from "./components/BasketTypeManager.vue";
</script>

<style lang="scss" scoped>
.catalog {
  width: 100%;
  padding: 0 16px 20px;

  .catalog-title {
    font-size: 24px;
    text-transform: uppercase;
    text-align: center;
    padding: 20px 0;
    font-weight: 600;
    color: $color-primary;
  }

  .catalog__container {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>
