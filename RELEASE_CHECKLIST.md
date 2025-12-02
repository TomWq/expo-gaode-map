# 🚀 发布检查清单

快速参考 - 发布新版本时需要执行的命令

## 📋 发布前检查

```bash
# 1. 确保在主分支且代码最新
git checkout main
git pull origin main

# 2. 确保没有未提交的更改
git status
```

## 🔨 构建和测试

```bash
# 1. 清理旧的构建产物
npm run clean

# 2. 安装依赖(如果需要)
npm install

# 3. 构建项目(包含主模块和 Config Plugin)
npm run build

# 4. 运行测试
npm test

# 5. 运行 lint 检查
npm run lint
```

## 📝 更新版本信息

```bash
# 选择一个版本更新命令:

# Patch 版本 (1.0.0 -> 1.0.1) - 修复 bug
npm version patch

# Minor 版本 (1.0.0 -> 1.1.0) - 新增功能
npm version minor

# Major 版本 (1.0.0 -> 2.0.0) - 破坏性更新
npm version major

# 或手动编辑 package.json 中的 version 字段
```

## 📦 发布到 npm

```bash
# 发布稳定版本(推荐)
npm run publish:latest

# 或发布预览版本(alpha/beta)
npm run publish:next
```

## 🏷️ 创建 Git 标签

```bash
# 自动创建(如果使用 npm version 命令会自动创建标签)
# 或手动创建:

git tag -a v2.0.0 -m "Release v2.0.0"
git push origin v2.0.0
git push origin main
```

## 📄 完整命令序列(复制粘贴)

```bash
# === 稳定版发布 ===
npm run clean && \
npm run build && \
npm test && \
npm run lint && \
npm version patch && \
npm run publish:latest && \
git push origin main && \
git push --tags

# === 预览版发布 ===
npm run clean && \
npm run build && \
npm test && \
npm run lint && \
npm version prerelease --preid=alpha && \
npm run publish:next && \
git push origin main && \
git push --tags
```

## ✅ 发布后验证

```bash
# 1. 检查 npm 上的版本
npm view expo-gaode-map version

# 2. 在测试项目中安装新版本
cd /path/to/test-project
npm install expo-gaode-map@latest

# 3. 验证 Config Plugin 是否工作
npx expo prebuild
```

## 🔙 回滚(如有问题)

```bash
# 废弃有问题的版本
npm deprecate expo-gaode-map@版本号 "此版本存在问题,请使用 x.x.x 版本"
```

## 📊 检查清单

- [ ] 代码已提交且推送到 main 分支
- [ ] 运行 `npm run clean`
- [ ] 运行 `npm run build` 成功
- [ ] 运行 `npm test` 通过
- [ ] 运行 `npm run lint` 无错误
- [ ] 确认 `build/` 目录存在
- [ ] 确认 `plugin/build/` 目录存在
- [ ] 更新了 CHANGELOG.md
- [ ] 版本号已更新
- [ ] 发布到 npm 成功
- [ ] Git 标签已创建并推送
- [ ] 在 GitHub 创建了 Release
- [ ] 测试项目中验证新版本可用

## 💡 常用版本号规则

| 类型 | 命令 | 示例 | 说明 |
|------|------|------|------|
| Patch | `npm version patch` | 1.0.0 → 1.0.1 | Bug 修复 |
| Minor | `npm version minor` | 1.0.0 → 1.1.0 | 新功能(向下兼容) |
| Major | `npm version major` | 1.0.0 → 2.0.0 | 破坏性更新 |
| Prerelease | `npm version prerelease --preid=alpha` | 1.0.0 → 1.0.1-alpha.0 | 预发布版本 |

## 🔗 相关文档

- 详细发布流程: [PUBLISHING.md](./PUBLISHING.md)
- 项目部署文档: [DEPLOY_DOCS.md](./DEPLOY_DOCS.md)