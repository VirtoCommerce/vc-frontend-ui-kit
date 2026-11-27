import { uiKit } from "@vc-frontend/ui-kit";
import { createApp } from "vue";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import "./style.css";

createApp(App).use(createI18n({ legacy: false, locale: "en" })).use(uiKit).mount("#app");
