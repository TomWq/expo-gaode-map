# 📚 文档网站部署指南

本文档说明如何部署 expo-gaode-map 的文档网站到 GitHub Pages。

## 🌟 项目结构

```
expo-gaode-map/
├── website/                      # 文档网站目录
│   ├── docs/                    # 文档源文件
│   │   ├── .vitepress/         # VitePress 配置
│   │   │   └── config.mts      # 网站配置文件
│   │   ├── guide/              # 指南文档
│   │   ├── api/                # API 文档
│   │   ├── examples/           # 示例文档
│   │   └── index.md            # 首页
│   ├── package.json            # 依赖配置
│   └── README.md               # 网站说明
└── .github/
    └── workflows/
        └── deploy-docs.yml     # 自动部署配置
```

## 🚀 快速部署

### 方式一：GitHub Actions 自动部署（推荐）

1. **启用 GitHub Pages**
   
   进入你的 GitHub 仓库设置：
   - 点击 `Settings` > `Pages`
   - 在 **Source** 下选择 `GitHub Actions`

2. **推送代码**
   
   ```bash
   git add .
   git commit -m "Add documentation website"
   git push origin main
   ```

3. **等待部署完成**
   
   - 进入仓库的 `Actions` 标签页
   - 查看 "Deploy Docs" 工作流的运行状态
   - 部署成功后，访问: `https://<your-username>.github.io/expo-gaode-map/`

### 方式二：本地构建后手动部署

1. **安装依赖**
   
   ```bash
   cd website
   npm install
   ```

2. **构建网站**
   
   ```bash
   npm run docs:build
   ```

3. **部署到 GitHub Pages**
   
   ```bash
   # 进入构建产物目录
   cd docs/.vitepress/dist
   
   # 初始化 git 仓库
   git init
   git add -A
   git commit -m 'Deploy documentation'
   
   # 推送到 gh-pages 分支
   git push -f git@github.com:<your-username>/expo-gaode-map.git main:gh-pages
   
   cd ../../../..
   ```

4. **配置 GitHub Pages**
   
   - 进入 `Settings` > `Pages`
   - Source 选择 `Deploy from a branch`
   - Branch 选择 `gh-pages` 和 `/ (root)`

## 🔧 配置说明

### 修改 Base URL

如果你的 GitHub 仓库名不是 `expo-gaode-map`，需要修改配置：

**文件:** `website/docs/.vitepress/config.mts`

```ts
export default defineConfig({
  base: '/your-repo-name/',  // 修改为你的仓库名
  // ...
})
```

**文件:** `.github/workflows/deploy-docs.yml`

确保工作流配置正确（当前配置已经是通用的，通常不需要修改）。

### 自定义域名（可选）

如果要使用自定义域名：

1. 在 `website/docs/public/` 目录下创建 `CNAME` 文件
2. 文件内容为你的域名，例如: `docs.yoursite.com`
3. 在你的域名 DNS 设置中添加 CNAME 记录指向 `<username>.github.io`

## 📝 本地开发

### 启动开发服务器

```bash
cd website
npm install
npm run docs:dev
```

访问 http://localhost:5173 查看文档。

### 预览生产版本

```bash
npm run docs:build
npm run docs:preview
```

## 🎨 自定义文档

### 添加新页面

1. 在相应目录下创建 `.md` 文件
2. 在 `config.mts` 中添加导航和侧边栏配置
3. 编写文档内容

### 修改主题

VitePress 支持主题自定义，详见 [VitePress 文档](https://vitepress.dev/guide/custom-theme)。

## ✅ 验证部署

部署完成后，访问以下 URL 验证：

- **首页:** `https://<username>.github.io/expo-gaode-map/`
- **快速开始:** `https://<username>.github.io/expo-gaode-map/guide/getting-started`
- **API 文档:** `https://<username>.github.io/expo-gaode-map/api/`

## 🐛 常见问题

### 1. 页面样式丢失或 404

**问题:** 部署后页面样式丢失或资源 404

**解决方案:** 检查 `base` 配置是否正确设置为 `/your-repo-name/`

### 2. GitHub Actions 部署失败

**问题:** Actions 工作流运行失败

**解决方案:**
- 检查 GitHub Pages 是否已启用
- 确保选择了 "GitHub Actions" 作为 Source
- 查看 Actions 日志获取详细错误信息

### 3. 本地可以访问，部署后无法访问

**问题:** 本地开发正常，部署后无法访问

**解决方案:**
- 确认 GitHub Pages 设置正确
- 等待几分钟让 DNS 传播
- 清除浏览器缓存

### 4. 中文路径问题

**问题:** 包含中文的文件名导致 URL 编码问题

**解决方案:** 使用英文文件名，在文档内容中使用中文标题

## 📚 参考资源

- [VitePress 官方文档](https://vitepress.dev/)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 🤝 贡献文档

欢迎改进文档！

1. Fork 本仓库
2. 创建特性分支
3. 修改文档内容
4. 提交 Pull Request

## 📄 许可证

MIT

---

**需要帮助？**

- 📝 [提交 Issue](https://github.com/TomWq/expo-gaode-map/issues)
- 💬 [参与讨论](https://github.com/TomWq/expo-gaode-map/discussions)
- 💬 加入 QQ 群: 952241387