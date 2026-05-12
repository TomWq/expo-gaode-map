import { defineConfig, type HeadConfig, type TransformContext } from 'vitepress'

const siteUrl = 'https://tomwq.github.io'
const siteBase = '/expo-gaode-map/'
const siteOrigin = `${siteUrl}${siteBase}`
const defaultOgImage = `${siteOrigin}bg.png`

function toRoutePath(relativePath: string): string {
  if (relativePath === 'index.md') {
    return '/'
  }

  if (relativePath.endsWith('/index.md')) {
    return `/${relativePath.slice(0, -'index.md'.length)}`
  }

  return `/${relativePath.replace(/\.md$/, '')}`
}

function resolveCanonicalUrl(routePath: string): string {
  const normalizedPath = routePath === '/' ? '' : routePath.replace(/^\//, '')

  return `${siteOrigin}${normalizedPath}`
}

function resolveAlternateLinks(routePath: string): Array<{ lang: string; url: string }> {
  if (routePath.startsWith('/en/')) {
    const zhPath = routePath.replace(/^\/en/, '') || '/'

    return [
      { lang: 'en', url: resolveCanonicalUrl(routePath) },
      { lang: 'zh-CN', url: resolveCanonicalUrl(zhPath) },
      { lang: 'x-default', url: resolveCanonicalUrl(zhPath) },
    ]
  }

  const enPath = routePath === '/' ? '/en/' : `/en${routePath}`

  return [
    { lang: 'zh-CN', url: resolveCanonicalUrl(routePath) },
    { lang: 'en', url: resolveCanonicalUrl(enPath) },
    { lang: 'x-default', url: resolveCanonicalUrl(routePath) },
  ]
}

function createJsonLd(context: TransformContext, canonicalUrl: string): string {
  const pageTitle = context.pageData.title || 'expo-gaode-map'
  const pageDescription = context.pageData.description || 'Expo / React Native AMap documentation site.'
  const inEnglish = context.pageData.relativePath.startsWith('en/')

  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      inLanguage: inEnglish ? 'en-US' : 'zh-CN',
      isPartOf: {
        '@type': 'WebSite',
        name: 'expo-gaode-map',
        url: siteOrigin,
      },
      publisher: {
        '@type': 'Organization',
        name: 'expo-gaode-map',
        url: siteOrigin,
      },
      image: defaultOgImage,
    },
    null,
    0
  )
}

function buildSeoHead(context: TransformContext): HeadConfig[] {
  const routePath = toRoutePath(context.pageData.relativePath)
  const canonicalUrl = resolveCanonicalUrl(routePath)
  const alternateLinks = resolveAlternateLinks(routePath)
  const pageTitle = context.pageData.title || 'expo-gaode-map'
  const pageDescription = context.pageData.description || 'Expo / React Native AMap documentation site.'
  const locale = context.pageData.relativePath.startsWith('en/') ? 'en_US' : 'zh_CN'

  return [
    ['link', { rel: 'canonical', href: canonicalUrl }],
    ...alternateLinks.map(({ lang, url }) => ['link', { rel: 'alternate', hreflang: lang, href: url }] as HeadConfig),
    ['meta', { property: 'og:url', content: canonicalUrl }],
    ['meta', { property: 'og:title', content: pageTitle }],
    ['meta', { property: 'og:description', content: pageDescription }],
    ['meta', { property: 'og:locale', content: locale }],
    ['meta', { name: 'twitter:title', content: pageTitle }],
    ['meta', { name: 'twitter:description', content: pageDescription }],
    ['script', { type: 'application/ld+json' }, createJsonLd(context, canonicalUrl)],
  ]
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  lang: 'zh-CN',
  title: "expo-gaode-map",
  description: "Expo / React Native 高德地图（AMap）组件库文档：地图、定位、搜索、导航、离线地图。",
  sitemap: {
    hostname: siteOrigin
  },
  transformHead(context) {
    return buildSeoHead(context)
  },
  head: [
    [
      'meta',
      {
        name: 'keywords',
        content: 'rn 高德地图, react native 高德地图, expo 高德地图, react native amap, expo amap, gaode map react native, amap react native, react-native-amap3d, amap3d, expo-gaode-map, gaode map, china map'
      }
    ],
    [
      'meta',
      {
        property: 'og:type',
        content: 'website'
      }
    ],
    [
      'meta',
      {
        property: 'og:title',
        content: 'expo-gaode-map | React Native 高德地图'
      }
    ],
    [
      'meta',
      {
        property: 'og:description',
        content: 'Expo / React Native 高德地图组件库：地图、定位、覆盖物、搜索、导航、离线地图。'
      }
    ],
    [
      'meta',
      {
        property: 'og:url',
        content: siteOrigin
      }
    ],
    [
      'meta',
      {
        property: 'og:image',
        content: defaultOgImage
      }
    ],
    [
      'meta',
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      }
    ],
    [
      'meta',
      {
        name: 'twitter:title',
        content: 'expo-gaode-map | React Native 高德地图'
      }
    ],
    [
      'meta',
      {
        name: 'twitter:description',
        content: 'Expo / React Native 高德地图组件库：地图、定位、覆盖物、搜索、导航、离线地图。'
      }
    ],
    [
      'meta',
      {
        name: 'twitter:image',
        content: defaultOgImage
      }
    ]
  ],
  base: siteBase,
  
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
          { text: '概览', link: '/overview' },
          { text: '快速开始', link: '/guide/getting-started' },
          { text: 'API', link: '/api/' },
          { text: '示例', link: '/examples/' },
          { text: 'GitHub', link: 'https://github.com/TomWq/expo-gaode-map' }
        ],
        sidebar: {
          '/guide/': [
            {
              text: '指南',
              items: [
                { text: '快速开始', link: '/guide/getting-started' },
                { text: '初始化', link: '/guide/initialization' },
                { text: 'Config Plugin', link: '/guide/config-plugin' },
                { text: '错误处理', link: '/guide/error-handling' },
                { text: '测试与质量保证', link: '/guide/testing' },
                { text: '架构说明', link: '/guide/architecture' },
                { text: '搜索功能', link: '/guide/search' },
                { text: '导航功能', link: '/guide/navigation' },
                { text: '离线地图', link: '/guide/offline-map' },
                { text: 'Web API', link: '/guide/web-api' }
              ]
            }
          ],
          '/api/': [
            {
              text: '核心功能',
              items: [
                { text: 'API 总览', link: '/api/' },
                { text: 'MapView Props', link: '/api/mapview' },
                { text: '组件与 Hooks', link: '/api/components' },
                { text: '定位 API', link: '/api/location' },
                { text: '几何计算', link: '/api/geometry' },
                { text: '覆盖物', link: '/api/overlays' },
                { text: '类型定义', link: '/api/types' }
              ]
            },
            {
              text: '扩展功能',
              items: [
                { text: '搜索 API', link: '/api/search' },
                { text: '导航 API', link: '/api/navigation' },
                { text: '离线地图 API', link: '/api/offline-map' },
                { text: 'Web API', link: '/api/web-api' }
              ]
            }
          ],
          '/examples/': [
            {
              text: '使用示例',
              items: [
                { text: '示例总览', link: '/examples/' },
                { text: '场景推荐', link: '/examples/scenarios' },
                { text: '基础地图', link: '/examples/basic-map' },
                { text: '定位追踪', link: '/examples/location-tracking' },
                { text: '几何计算', link: '/examples/geometry' },
                { text: '覆盖物', link: '/examples/overlays' },
                { text: '搜索功能', link: '/examples/search' }
              ]
            }
          ]
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/TomWq/expo-gaode-map' }
        ],
        footer: {
          message: 'Released under the MIT License.',
          copyright: 'Copyright © 2024-present expo-gaode-map'
        }
      }
    },
    en: {
      label: 'English',
      lang: 'en-US',
      link: '/en/',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/en/' },
          { text: 'Overview', link: '/en/overview' },
          { text: 'Get Started', link: '/en/guide/getting-started' },
          { text: 'API', link: '/en/api/' },
          { text: 'Examples', link: '/en/examples/' },
          { text: 'GitHub', link: 'https://github.com/TomWq/expo-gaode-map' }
        ],
        sidebar: {
          '/en/guide/': [
            {
              text: 'Guide',
              items: [
                { text: 'Getting Started', link: '/en/guide/getting-started' },
                { text: 'Initialization', link: '/en/guide/initialization' },
                { text: 'Config Plugin', link: '/en/guide/config-plugin' },
                { text: 'Error Handling', link: '/en/guide/error-handling' },
                { text: 'Testing & QA', link: '/en/guide/testing' },
                { text: 'Architecture', link: '/en/guide/architecture' },
                { text: 'Search Features', link: '/en/guide/search' },
                { text: 'Navigation', link: '/en/guide/navigation' },
                { text: 'Offline Maps', link: '/en/guide/offline-map' },
                { text: 'Web API', link: '/en/guide/web-api' }
              ]
            }
          ],
          '/en/api/': [
            {
              text: 'Core Features',
              items: [
                { text: 'API Overview', link: '/en/api/' },
                { text: 'MapView & Components', link: '/en/api/mapview' },
                { text: 'Components & Hooks', link: '/en/api/components' },
                { text: 'Location API', link: '/en/api/location' },
                { text: 'Geometry Utils', link: '/en/api/geometry' },
                { text: 'Overlays', link: '/en/api/overlays' },
                { text: 'Type Definitions', link: '/en/api/types' }
              ]
            },
            {
              text: 'Extended Features',
              items: [
                { text: 'Search API', link: '/en/api/search' },
                { text: 'Navigation API', link: '/en/api/navigation' },
                { text: 'Offline Maps API', link: '/en/api/offline-map' },
                { text: 'Web API', link: '/en/api/web-api' }
              ]
            }
          ],
          '/en/examples/': [
            {
              text: 'Examples',
              items: [
                { text: 'Examples Overview', link: '/en/examples/' },
                { text: 'Scenarios', link: '/en/examples/scenarios' },
                { text: 'Basic Map', link: '/en/examples/basic-map' },
                { text: 'Location Tracking', link: '/en/examples/location-tracking' },
                { text: 'Geometry', link: '/en/examples/geometry' },
                { text: 'Overlays', link: '/en/examples/overlays' },
                { text: 'Search Features', link: '/en/examples/search' }
              ]
            }
          ]
        },
        socialLinks: [
          { icon: 'github', link: 'https://github.com/TomWq/expo-gaode-map' }
        ]
      }
    }
  },

  themeConfig: {
    search: {
      provider: 'local',
      options: {
        locales: {
          zh: {
            translations: {
              button: {
                buttonText: '搜索文档',
                buttonAriaLabel: '搜索文档'
              },
              modal: {
                noResultsText: '无法找到相关结果',
                resetButtonTitle: '清除查询条件',
                footer: {
                  selectText: '选择',
                  navigateText: '切换'
                }
              }
            }
          }
        }
      }
    }
  }
})
