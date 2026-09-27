<template>
  <CatalogManager title="Ao" entityLabel="ao" idPrefix="pond" :fields="fields" :api="api" />
</template>

<script setup>
import CatalogManager from "./CatalogManager.vue";
import PondAPI from "@/services/pondAPI";

const fields = [
  { key: "pondName", label: "Tên ao", type: "text", placeholder: "Nhập tên ao" },
  {
    key: "area",
    label: "Diện tích (m²)",
    type: "number",
    optional: true,
    placeholder: "Không bắt buộc",
    invalidMessage: "Diện tích ao không hợp lệ!",
  },
];

const api = {
  list: () => PondAPI.getPonds(),
  create: (data) => PondAPI.createPond(data),
  update: (id, data) => PondAPI.updatePond(id, data),
  remove: (id) => PondAPI.deletePond(id),
};
</script>
