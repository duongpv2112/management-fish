<template>
  <CatalogManager
    title="Loại cá"
    entityLabel="loại cá"
    idPrefix="fishType"
    :fields="fields"
    :api="api"
  />
</template>

<script setup>
import CatalogManager from "./CatalogManager.vue";
import FishTypeAPI from "@/services/fishTypeAPI";

const fields = [
  { key: "fishName", label: "Tên loại cá", type: "text", placeholder: "Nhập tên loại cá" },
];

const api = {
  list: () => FishTypeAPI.getFishTypes(),
  create: (data) => FishTypeAPI.createFishType(data),
  update: (id, data) => FishTypeAPI.updateFishType(id, data),
  remove: (id) => FishTypeAPI.deleteFishType(id),
};
</script>
