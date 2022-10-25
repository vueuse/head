import Vue from 'vue'
import App from './App.vue'
import { createHead, HeadVuePlugin } from "@vueuse/head"

Vue.config.productionTip = false

Vue.use(HeadVuePlugin)
const head = createHead()

new Vue({
  render: h => h(App),
  head,
}).$mount('#app')
