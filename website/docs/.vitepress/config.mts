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
                { text: '架构说明', link: '/guide/architecture' }
              ]
            }
          ],
          '/api/': [
            {
              text: 'API 参考',
              items: [
                { text: 'API 总览', link: '/api/' },
                { text: 'MapView Props', link: '/api/mapview' },
                { text: '定位 API', link: '/api/location' },
                { text: '覆盖物', link: '/api/overlays' }
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
                { text: '覆盖物', link: '/examples/overlays' }
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
                { text: 'Architecture', link: '/en/guide/architecture' }
              ]
            }
          ],
          '/en/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'API Overview', link: '/en/api/' },
                { text: 'MapView Props', link: '/en/api/mapview' },
                { text: 'Location API', link: '/en/api/location' },
                { text: 'Overlays', link: '/en/api/overlays' }
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
                { text: 'Overlays', link: '/en/examples/overlays' }
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