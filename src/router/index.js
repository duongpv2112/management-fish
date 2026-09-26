import { createRouter, createWebHashHistory } from "vue-router";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import CatalogView from "@/views/Catalog/CatalogView.vue";

// Hash history để tải lại trang (ví dụ /#/danh-muc) trên GitHub Pages vẫn vào đúng trang
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "weigh", component: ManagementFishViews },
    { path: "/danh-muc", name: "catalog", component: CatalogView },
  ],
});

export default router;
