import DefaultTheme from 'vitepress/theme'
import './custom.css'
import LandingHome from './components/LandingHome.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('LandingHome', LandingHome)
  }
}
