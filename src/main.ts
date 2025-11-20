import { createApp } from "vue";
import App from "./App.vue";
import vuetify from './plugins/vuetify'
import router from './router'
import '@mdi/font/css/materialdesignicons.css'
import './styles/fonts.css'
import './styles/global.css'

createApp(App).use(vuetify).use(router).mount("#app");
