<template>
  <CatalogManager
    title="Loại giỏ"
    entityLabel="loại giỏ"
    idPrefix="basketType"
    :fields="fields"
    :api="api"
  />
</template>

<script setup>
import CatalogManager from "./CatalogManager.vue";
import BasketTypeAPI from "@/services/basketTypeAPI";

const fields = [
  { key: "basketName", label: "Tên loại giỏ", type: "text", placeholder: "Nhập tên loại giỏ" },
  {
    key: "basketWeight",
    label: "Trọng lượng giỏ (kg)",
    type: "number",
    placeholder: "Ví dụ: 1,5",
    invalidMessage: "Trọng lượng giỏ không hợp lệ!",
  },
];

const api = {
  list: () => BasketTypeAPI.getBasketTypes(),
  create: (data) => BasketTypeAPI.createBasketType(data),
  update: (id, data) => BasketTypeAPI.updateBasketType(id, data),
  remove: (id) => BasketTypeAPI.deleteBasketType(id),
};
</script>
