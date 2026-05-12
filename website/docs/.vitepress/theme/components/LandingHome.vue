<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'

const props = withDefaults(defineProps<{
  locale?: 'zh' | 'en'
}>(), {
  locale: 'zh'
})

const copy = computed(() => {
  if (props.locale === 'en') {
    return {
   
      title: 'expo-gaode-map',
      subtitle: 'Expo / React Native AMap component library',
      lead:
        'expo-gaode-map brings map, location, search, navigation, offline maps, and Web API support into one entry point for Expo / React Native projects.',
      primary: 'Open docs',
      secondary: 'Get started',
      aiAction: 'AI setup',
      route1Title: 'Documentation overview',
      route1Text: 'Keep the original home content for a quick scan of installation, capabilities, and package layout.',
      route2Title: 'Get started',
      route2Text: 'Go from install and setup to a first map screen in the shortest path possible.',
      route3Title: 'Examples and API',
      route3Text: 'Explore common scenarios, API definitions, and module-level usage.',
      tags: ['Maps', 'Location', 'Search', 'Navigation', 'Offline maps', 'Web API'],
      overviewLink: 'overview',
      gettingStartedLink: 'guide/getting-started',
      skillLink: 'guide/getting-started#ai-assisted-integration-skill',
      examplesLink: 'examples/'
    }
  }

  return {
   
    title: 'expo-gaode-map',
    subtitle: 'Expo / React Native 高德地图组件库',
    lead:
      'expo-gaode-map 把地图、定位、搜索、导航、离线地图和 Web API 放在同一个入口里，适合 Expo / React Native 项目直接上手。',
    primary: '进入文档',
    secondary: '快速开始',
    aiAction: 'AI 自动接入',
    route1Title: '文档概览',
    route1Text: '保留原首页内容，适合快速扫一遍安装、能力和包结构。',
    route2Title: '快速开始',
    route2Text: '从安装、初始化到第一个地图页面，直接走通最短路径。',
    route3Title: '示例与 API',
    route3Text: '查看典型场景、接口定义和各模块的具体用法。',
    tags: ['地图', '定位', '搜索', '导航', '离线地图', 'Web API'],
    overviewLink: 'overview',
    gettingStartedLink: 'guide/getting-started',
    skillLink: 'guide/getting-started#ai-自动接入-skill',
    examplesLink: 'examples/'
  }
})

const base = props.locale === 'en' ? '/en/' : '/'
const resolve = (path: string) => withBase(`${base}${path}`)
</script>

<template>
  <div class="landing-page">
    <section class="landing-hero" :style="{ '--landing-hero-image': `url(${withBase('/bg.png')})` }">
      <div class="landing-hero__inner">
        <div class="landing-hero__content">
          <p class="landing-kicker">{{ copy.kicker }}</p>
          <h1 class="landing-title">{{ copy.title }}</h1>
          <p class="landing-subtitle">{{ copy.subtitle }}</p>
          <p class="landing-lead">{{ copy.lead }}</p>

          <div class="landing-actions">
            <a class="landing-button landing-button--primary" :href="resolve(copy.overviewLink)">
              {{ copy.primary }}
            </a>
            <a class="landing-button landing-button--secondary" :href="resolve(copy.gettingStartedLink)">
              {{ copy.secondary }}
            </a>
            <a class="landing-button landing-button--ai" :href="resolve(copy.skillLink)">
              {{ copy.aiAction }}
            </a>
            <a class="landing-button landing-button--secondary" href="https://github.com/TomWq/expo-gaode-map">GitHub</a>
          </div>

          <div class="landing-tags" :aria-label="locale === 'en' ? 'Feature tags' : '功能标签'">
            <span v-for="tag in copy.tags" :key="tag">{{ tag }}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="landing-routes" :aria-label="locale === 'en' ? 'Entry points' : '入口导航'">
      <a class="landing-route" :href="resolve(copy.overviewLink)">
        <span class="landing-route__index">01</span>
        <h2>{{ copy.route1Title }}</h2>
        <p>{{ copy.route1Text }}</p>
      </a>

      <a class="landing-route" :href="resolve(copy.gettingStartedLink)">
        <span class="landing-route__index">02</span>
        <h2>{{ copy.route2Title }}</h2>
        <p>{{ copy.route2Text }}</p>
      </a>

      <a class="landing-route" :href="resolve(copy.examplesLink)">
        <span class="landing-route__index">03</span>
        <h2>{{ copy.route3Title }}</h2>
        <p>{{ copy.route3Text }}</p>
      </a>
    </section>
  </div>
</template>
