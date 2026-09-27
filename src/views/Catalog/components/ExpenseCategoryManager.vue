<template>
  <CatalogManager
    title="Nhóm chi"
    entityLabel="nhóm chi"
    idPrefix="expenseCategory"
    :fields="fields"
    :api="api"
  />
</template>

<script setup>
import CatalogManager from "./CatalogManager.vue";
import ExpenseCategoryAPI from "@/services/expenseCategoryAPI";

const fields = [
  { key: "categoryName", label: "Tên nhóm chi", type: "text", placeholder: "Nhập tên nhóm chi" },
  {
    key: "metric",
    label: "Dùng để tính",
    type: "select",
    defaultValue: "none",
    options: [
      { value: "seed", label: "Giống" },
      { value: "feed", label: "Thức ăn" },
      { value: "none", label: "Không" },
    ],
  },
];

const api = {
  list: () => ExpenseCategoryAPI.getExpenseCategories(),
  create: (data) => ExpenseCategoryAPI.createExpenseCategory(data),
  update: (id, data) => ExpenseCategoryAPI.updateExpenseCategory(id, data),
  remove: (id) => ExpenseCategoryAPI.deleteExpenseCategory(id),
};
</script>
