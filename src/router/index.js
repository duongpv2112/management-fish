import { createRouter, createWebHashHistory } from "vue-router";
import ManagementFishViews from "@/views/ManagementFish/ManagementFishViews.vue";
import CatalogView from "@/views/Catalog/CatalogView.vue";
import LoginView from "@/views/Login/LoginView.vue";
import ManagementTracking from "@/views/ManagementTracking/ManagementTracking.vue";
import { getToken } from "@/common/auth";

// Hash history để tải lại trang (ví dụ /#/danh-muc) trên GitHub Pages vẫn vào đúng trang
const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", name: "weigh", component: ManagementFishViews },
    { path: "/danh-muc", name: "catalog", component: CatalogView },
    { path: "/nhat-ky", name: "log", component: ManagementTracking },
    { path: "/dang-nhap", name: "login", component: LoginView },
  ],
});

// Chưa đăng nhập thì chuyển sang trang đăng nhập, nhớ trang đang muốn vào để quay lại
router.beforeEach((to) => {
  if (to.name !== "login" && !getToken()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
});

export default router;
