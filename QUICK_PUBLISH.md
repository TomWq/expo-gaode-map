# 快速发布指南

## 🚀 最简单的发布方式

### 发布 Beta 版本（推荐）

```bash
# 一键发布，脚本会引导你完成所有步骤
pnpm publish:interactive
```

**脚本会自动处理：**
- ✅ 检查 git 状态和分支
- ✅ 检查 npm 登录状态
- ✅ 让你选择要发布的包
- ✅ 让你选择发布类型（beta/alpha/canary）
- ✅ **自动更新版本号**
- ✅ 构建包
- ✅ 发布到正确的 npm tag
- ✅ 创建 git 标签和提交
- ✅ 询问是否推送到远程

### 完整示例流程

```bash
$ pnpm publish:interactive

📦 Monorepo 发包工具
====================

当前分支: main
✓ 已登录为: your-npm-username

选择要发布的包：
1) expo-gaode-map (核心包)
2) expo-gaode-map-search (搜索包)
3) 两个包都发布
请选择 (1/2/3): 3

选择发布类型：
1) 正式版本 (latest)
2) Beta 测试版 (beta)
3) Alpha 测试版 (alpha)
4) Canary 金丝雀版 (canary)
请选择 (1/2/3/4): 2

🔨 构建包...
✓ 构建完成

📦 发布核心包 (expo-gaode-map) [beta]...
版本: 2.0.0 -> 2.1.0-beta.0
✓ 核心包发布成功: v2.1.0-beta.0 [beta]

📦 发布搜索包 (expo-gaode-map-search) [beta]...
版本: 1.0.0 -> 1.0.1-beta.0
✓ 搜索包发布成功: v1.0.1-beta.0 [beta]

是否推送到远程仓库? (y/n) y
🚀 推送到远程仓库...
✓ 推送完成

✨ 发布流程完成!

发布信息：
发布类型: beta

  📦 expo-gaode-map: v2.1.0-beta.0
     npm install expo-gaode-map@beta
     或: npm install expo-gaode-map@2.1.0-beta.0

  📦 expo-gaode-map-search: v1.0.1-beta.0
     npm install expo-gaode-map-search@beta
     或: npm install expo-gaode-map-search@1.0.1-beta.0

⚠️  测试版本说明:
  - 测试版本不会成为默认版本（latest tag）
  - 用户执行 'npm install' 时不会自动安装测试版本
  - 必须显式指定版本号或 tag 才能安装
  - 适合内部测试或提前让部分用户试用新功能
```

---

## 📝 版本号自动更新规则

脚本使用 `npm version` 命令自动更新版本号：

### Beta 版本递增

```bash
# 首次发布 beta
2.0.0 -> 2.0.1-beta.0

# 再次发布 beta
2.0.1-beta.0 -> 2.0.1-beta.1

# 继续发布 beta
2.0.1-beta.1 -> 2.0.1-beta.2
```

### 从 Beta 升级到正式版

```bash
# 选择 "1) 正式版本" 和 "1) patch"
2.0.1-beta.2 -> 2.0.1

# 或选择 minor
2.0.1-beta.2 -> 2.1.0

# 或选择 major
2.0.1-beta.2 -> 3.0.0
```

---

## ⚡ 常见场景

### 场景 1：只测试核心包的新功能

```bash
pnpm publish:interactive
# 选择 "1) expo-gaode-map (核心包)"
# 选择 "2) Beta 测试版"
```

结果：
- ✅ 只发布核心包的 beta 版本
- ✅ 搜索包不受影响
- ✅ 版本号自动递增

### 场景 2：核心包和搜索包都有更新

```bash
pnpm publish:interactive
# 选择 "3) 两个包都发布"
# 选择 "2) Beta 测试版"
```

结果：
- ✅ 两个包都发布 beta 版本
- ✅ 版本号各自独立递增
- ✅ 用户可以同时安装两个 beta 版本

### 场景 3：Beta 测试完成，发布正式版

```bash
pnpm publish:interactive
# 选择 "3) 两个包都发布"
# 选择 "1) 正式版本"
# 选择 "1) patch" 或 "2) minor" 或 "3) major"
```

结果：
- ✅ 两个包都发布正式版本
- ✅ 自动移除 `-beta.x` 后缀
- ✅ 成为默认版本（latest tag）

---

## 🎯 零手动操作发布流程

### 准备工作（只需一次）

```bash
# 1. 登录 npm
npm login

# 2. 验证登录
npm whoami
```

### 发布（每次都一样简单）

```bash
# 确保代码已提交
git add .
git commit -m "feat: add new features"

# 一键发布
pnpm publish:interactive

# 按提示选择即可，剩下的全自动！
```

---

## 📊 手动方式对比

### ❌ 传统手动方式（不推荐）

```bash
# 1. 手动修改 package.json 版本号
cd packages/core
# 编辑 package.json: "version": "2.1.0-beta.0"

# 2. 构建
cd ../..
pnpm build

# 3. 发布
cd packages/core
npm publish --tag beta --access public

# 4. 重复步骤 1-3 给搜索包

# 5. 手动创建 git 标签
git add .
git commit -m "chore: release"
git tag core-v2.1.0-beta.0
git tag search-v1.0.1-beta.0
git push origin main --tags
```

### ✅ 使用脚本（推荐）

```bash
pnpm publish:interactive
# 选择选项，剩下全自动！
```

---

## 🔧 自定义版本号（高级）

如果你需要指定特定的版本号，可以使用快捷命令：

```bash
# 手动指定版本号
cd packages/core
npm version 2.5.0-beta.0 --no-git-tag-version

# 然后发布
pnpm publish:core:beta
```

但大多数情况下，使用交互式脚本就足够了！

---

## 💡 提示

1. **不需要手动修改版本号** - 脚本会自动处理
2. **版本号会自动递增** - 根据当前版本和你选择的类型
3. **Git 标签自动创建** - 格式为 `core-v2.1.0-beta.0`
4. **可以随时取消** - 脚本会在推送前询问确认
5. **支持单独发布** - 只更新需要更新的包

---

## 🆘 遇到问题？

### 问题：版本号不符合预期

**解决**：脚本会显示版本变化（如 `2.0.0 -> 2.1.0-beta.0`），发布前确认是否正确。

### 问题：忘记构建

**解决**：脚本会自动执行 `pnpm build`，不用担心。

### 问题：发布失败

**解决**：检查错误信息，通常是网络问题或权限问题。脚本会检查 npm 登录状态。

### 问题：想撤销发布

**解决**：
```bash
# 24小时内可以撤销
npm unpublish expo-gaode-map@2.1.0-beta.0

# 超过24小时只能标记为废弃
npm deprecate expo-gaode-map@2.1.0-beta.0 "请使用新版本"
```

---

## 📚 相关文档

- [完整发布指南](./PUBLISH_GUIDE.md) - 详细的发布说明
- [Monorepo 架构](./MONOREPO.md) - 项目结构说明