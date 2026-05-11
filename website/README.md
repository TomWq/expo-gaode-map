# expo-gaode-map 文档网站

这是 expo-gaode-map 项目的官方文档网站，使用 VitePress 构建。

## 🚀 本地开发

### 安装依赖

```bash
# 在仓库根目录执行
yarn install --immutable
```

### 启动开发服务器

```bash
yarn workspace expo-gaode-map-docs docs:dev
```

访问 http://localhost:5173 查看文档。

### 构建生产版本

```bash
yarn workspace expo-gaode-map-docs docs:build
```

构建产物将输出到 `docs/.vitepress/dist` 目录。

### 预览生产版本

```bash
yarn workspace expo-gaode-map-docs docs:preview
```

## 📦 部署到 GitHub Pages

### 自动部署（推荐）

本项目已配置 GitHub Actions 自动部署。当代码推送到 `main` 或 `master` 分支时，会自动触发部署流程。

#### 配置步骤：

1. **启用 GitHub Pages**
   - 进入仓库的 Settings > Pages
   - Source 选择 "GitHub Actions"

2. **推送代码**
   ```bash
   git add .
   git commit -m "Add documentation website"
   git push origin main
   ```

3. **等待部署完成**
   - 查看 Actions 标签页，等待部署完成
   - 部署完成后，访问 `https://<username>.github.io/<repository>/`

### 手动部署

如果需要手动部署，可以按照以下步骤操作：

1. **构建网站**
   ```bash
   # 在仓库根目录执行
   yarn install --immutable
   yarn workspace expo-gaode-map-docs docs:build
   ```

2. **部署到 GitHub Pages**
   ```bash
   # 进入构建产物目录
   cd docs/.vitepress/dist
   
   # 初始化 git 仓库
   git init
   git add -A
   git commit -m 'deploy'
   
   # 推送到 gh-pages 分支
   git push -f git@github.com:<username>/<repository>.git main:gh-pages
   
   cd -
   ```

3. **配置 GitHub Pages**
   - 进入仓库的 Settings > Pages
   - Source 选择 "Deploy from a branch"
   - Branch 选择 "gh-pages" 和 "/ (root)"

## 📝 文档结构

```
website/
├── docs/
│   ├── .vitepress/
│   │   └── config.mts          # VitePress 配置
│   ├── guide/                  # 指南
│   │   ├── getting-started.md  # 快速开始
│   │   ├── initialization.md   # 初始化
│   │   ├── architecture.md     # 架构
│   │   ├── config-plugin.md    # 配置插件
│   │   └── search.md           # 搜索功能
│   ├── api/                    # API 文档
│   │   ├── index.md           # API 总览
│   │   ├── mapview.md         # MapView
│   │   ├── location.md        # 定位
│   │   ├── overlays.md        # 覆盖物
│   │   ├── search.md          # 搜索 API
│   │   └── types.md           # 类型定义
│   ├── examples/              # 示例
│   │   ├── index.md           # 示例总览
│   │   ├── basic-map.md       # 基础地图
│   │   ├── overlays.md        # 覆盖物示例
│   │   ├── search.md          # 搜索示例
│   │   └── location-tracking.md # 定位追踪
│   ├── en/                    # 英文文档
│   │   ├── guide/             # 英文指南
│   │   ├── api/               # 英文 API
│   │   └── examples/          # 英文示例
│   ├── public/                # 静态资源
│   │   ├── logo.svg           # 网站图标
│   │   └── hero-map.svg       # 首页背景图
│   └── index.md               # 首页
├── package.json
└── README.md                  # 本文件
```

## 🔧 配置说明

### Base URL

文档网站的 base URL 配置在 `docs/.vitepress/config.mts` 中：

```ts
export default defineConfig({
  base: '/expo-gaode-map/',  // 修改为你的仓库名
  // ...
})
```

::: warning 注意
如果你的 GitHub 仓库名不是 `expo-gaode-map`，需要修改 `base` 配置为 `/<your-repo-name>/`
:::

### 多语言支持

本文档网站支持中英文双语，配置在 `docs/.vitepress/config.mts` 的 `locales` 选项中。

## 📚 添加新文档

1. 在相应目录下创建 `.md` 文件
2. 在 `docs/.vitepress/config.mts` 中添加导航和侧边栏配置
3. 编写文档内容
4. 提交并推送

## 🤝 贡献

欢迎提交文档改进！

1. Fork 本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT
