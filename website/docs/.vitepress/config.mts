import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "expo-gaode-map",
  description: "高德地图 React Native 组件库文档",
  base: '/expo-gaode-map/',
  
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      themeConfig: {
        nav: [
          { text: '首页', link: '/' },
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
