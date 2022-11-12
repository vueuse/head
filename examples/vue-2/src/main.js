import Vue from 'vue'
import App from './App.vue'
import { createHead, HeadVuePlugin } from "@vueuse/head"

Vue.config.productionTip = false

const head = createHead()
Vue.use(HeadVuePlugin, head)
Vue.use(head)

new Vue({
  render: h => h(App),
}).$mount('#app')
