<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, useRoute, withBase } from 'vitepress'
import { computed, watchEffect } from 'vue'

const route = useRoute()
const { frontmatter, lang, site } = useData()

const normalizedRoutePath = computed(() => {
  const path = route.path || '/'
  const base = (site.value.base || '/').replace(/\/$/, '')

  if (base && base !== '/' && path.startsWith(base)) {
    const stripped = path.slice(base.length)
    return stripped.startsWith('/') ? stripped : `/${stripped}`
  }

  return path
})

const isV3Path = computed(() => {
  const path = normalizedRoutePath.value
  return path.startsWith('/v3/') || path.startsWith('/en/v3/')
})

const isZh = computed(() => (lang.value ?? 'zh-CN').startsWith('zh'))

function normalizeLegacyPath(path: string): string {
  if (path.startsWith('/en/v3/')) {
    const rest = path.slice('/en/v3'.length)
    if (rest === '/' || rest === '') {
      return '/en/'
    }
    if (rest.startsWith('/guide/migration')) {
      return '/en/'
    }
    return `/en${rest}`
  }

  if (path.startsWith('/v3/')) {
    const rest = path.slice('/v3'.length)
    if (rest === '/' || rest === '') {
      return '/'
    }
    if (rest.startsWith('/guide/migration')) {
      return '/'
    }
    return rest
  }

  return path
}

const dynamicLegacyPath = computed(() => normalizeLegacyPath(normalizedRoutePath.value))

const versionLinks = computed(() => {
  if (isZh.value) {
    return {
      legacy: withBase(dynamicLegacyPath.value),
      v3: withBase('/v3/'),
      packageBase: withBase('/v3'),
      legacyText: 'v2 旧版',
      v3Text: 'v3 新版',
      packageLabel: '按能力选包',
    }
  }

  return {
    legacy: withBase(dynamicLegacyPath.value),
    v3: withBase('/en/v3/'),
    packageBase: withBase('/en/v3'),
    legacyText: 'v2 Legacy',
    v3Text: 'v3 New',
    packageLabel: 'Pick by capability',
  }
})

watchEffect(() => {
  if (typeof document === 'undefined') {
    return
  }
  document.documentElement.classList.toggle('docs-v3', isV3Path.value)
})

const pageStatus = computed(() => {
  const meta = frontmatter.value ?? {}
  const manualBadges = Array.isArray(meta.badges) ? meta.badges : []
  const output: string[] = manualBadges.filter(
    (item): item is string => typeof item === 'string' && item.length > 0
  )

  if (meta.recommended === true) {
    output.unshift('Recommended (v3)')
  }

  if (meta.legacy === true) {
    output.push('Legacy Compatible')
  }

  if (typeof meta.package === 'string' && meta.package.length > 0) {
    output.push(isZh.value ? `包: ${meta.package}` : `Package: ${meta.package}`)
  }

  return Array.from(new Set(output))
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <div v-if="isV3Path" class="v3-top-strip">
        <div class="v3-top-strip__inner">
          <div class="v3-version-switch">
            <a :href="versionLinks.legacy">{{ versionLinks.legacyText }}</a>
            <span>/</span>
            <a :href="versionLinks.v3" class="is-active">{{ versionLinks.v3Text }}</a>
          </div>
          <div class="v3-package-switch">
            <span class="v3-package-switch__label">{{ versionLinks.packageLabel }}</span>
            <a :href="`${versionLinks.packageBase}/guide/getting-started`">Core</a>
            <a :href="`${versionLinks.packageBase}/guide/navigation`">Navigation</a>
            <a :href="`${versionLinks.packageBase}/guide/search`">Search</a>
            <a :href="`${versionLinks.packageBase}/guide/web-api`">Web API</a>
          </div>
        </div>
      </div>
    </template>

    <template #doc-before>
      <div v-if="isV3Path && pageStatus.length > 0" class="v3-page-meta">
        <span v-for="badge in pageStatus" :key="badge" class="v3-status-badge">{{ badge }}</span>
      </div>
    </template>
  </DefaultTheme.Layout>
</template>
