<script>
import ManagementFishViews from "./views/ManagementFish/ManagementFishViews.vue";
export default {
  components: {
    ManagementFishViews,
  },
  setup(props, { emit }) {
    return {};
  },
};
</script>

<template>
  <header></header>

  <main>
    <ManagementFishViews />
  </main>
</template>

<style lang="scss">
@import "@/assets/scss/main.scss";
</style>
