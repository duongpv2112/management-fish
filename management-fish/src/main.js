import { createApp } from "vue";
import router from "./router";
import App from "./App.vue";
import clickOutside from "./directives/clickOutside";

const app = createApp(App);

app.use(router);
app.directive('click-outside', clickOutside);

app.mount("#app");
