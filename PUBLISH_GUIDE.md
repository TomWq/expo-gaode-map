# Monorepo 发包指南

本项目采用 Monorepo 架构，包含两个独立的 npm 包：
- `expo-gaode-map` - 核心包（地图、定位、覆盖物）
- `expo-gaode-map-search` - 搜索扩展包

## 📦 发包前准备

### 1. 确保所有代码已提交

```bash
git status
git add .
git commit -m "chore: prepare for release"
```

### 2. 确保依赖已安装

```bash
pnpm install
```

### 3. 构建所有包

```bash
# 在根目录执行
pnpm build

# 或分别构建
cd packages/core && pnpm build
cd packages/search && pnpm build
```

---

## 🚀 发包方式

### 方式一：手动分别发布（推荐用于首次发布）

#### 发布核心包

```bash
# 1. 进入核心包目录
cd packages/core

# 2. 更新版本号
npm version patch  # 或 minor、major
# 例如：0.1.0 -> 0.1.1

# 3. 登录 npm（如果还未登录）
npm login

# 4. 发布到 npm
npm publish --access public

# 5. 返回根目录
cd ../..

# 6. 提交版本标签
git add .
git commit -m "chore(core): release v0.1.1"
git tag core-v0.1.1
git push origin main --tags
```

#### 发布搜索包

```bash
# 1. 进入搜索包目录
cd packages/search

# 2. 更新版本号
npm version patch  # 或 minor、major
# 例如：0.1.0 -> 0.1.1

# 3. 发布到 npm
npm publish --access public

# 4. 返回根目录
cd ../..

# 5. 提交版本标签
git add .
git commit -m "chore(search): release v0.1.1"
git tag search-v0.1.1
git push origin main --tags
```

---

### 方式二：使用脚本批量发布

创建发布脚本 `scripts/publish.sh`：

```bash
#!/bin/bash

set -e

echo "📦 开始发布 Monorepo 包..."

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
  echo "❌ 有未提交的更改，请先提交"
  exit 1
fi

# 获取当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️  警告: 当前不在 main 分支"
  read -p "是否继续? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# 构建所有包
echo "🔨 构建所有包..."
pnpm build

# 发布核心包
echo ""
echo "📦 发布核心包 (expo-gaode-map)..."
cd packages/core
npm publish --access public
CORE_VERSION=$(node -p "require('./package.json').version")
cd ../..

# 发布搜索包
echo ""
echo "📦 发布搜索包 (expo-gaode-map-search)..."
cd packages/search
npm publish --access public
SEARCH_VERSION=$(node -p "require('./package.json').version")
cd ../..

# 提交和打标签
echo ""
echo "✅ 发布完成!"
echo "  - expo-gaode-map: v${CORE_VERSION}"
echo "  - expo-gaode-map-search: v${SEARCH_VERSION}"

echo ""
echo "📝 提交版本标签..."
git add .
git commit -m "chore: release packages

- expo-gaode-map@${CORE_VERSION}
- expo-gaode-map-search@${SEARCH_VERSION}"

git tag "core-v${CORE_VERSION}"
git tag "search-v${SEARCH_VERSION}"

echo ""
echo "🚀 推送到远程仓库..."
git push origin main --tags

echo ""
echo "✨ 发布流程完成!"
```

使用脚本：

```bash
# 赋予执行权限
chmod +x scripts/publish.sh

# 执行发布
./scripts/publish.sh
```

---

### 方式三：使用 Changesets（推荐用于团队协作）

Changesets 是一个用于管理 Monorepo 版本和变更日志的工具。

#### 1. 安装 Changesets

```bash
pnpm add -Dw @changesets/cli
pnpm changeset init
```

#### 2. 添加变更集

每次修改后，添加变更集：

```bash
pnpm changeset
```

会提示：
- 选择要更新的包（core/search）
- 选择版本类型（patch/minor/major）
- 填写变更说明

#### 3. 更新版本号

```bash
pnpm changeset version
```

这会：
- 更新 `package.json` 中的版本号
- 生成 `CHANGELOG.md`
- 删除已应用的变更集

#### 4. 发布包

```bash
pnpm changeset publish
```

这会：
- 发布所有有变更的包
- 创建 git 标签

#### 5. 推送更改

```bash
git push origin main --follow-tags
```

---

## 📋 发包检查清单

发布前请确认：

- [ ] 所有测试通过
- [ ] 代码已经过 lint 检查
- [ ] 已更新 CHANGELOG.md（如果手动管理）
- [ ] 已更新文档（如果有 API 变更）
- [ ] 版本号符合语义化版本规范
- [ ] 已在本地测试过包的安装和使用
- [ ] README 中的版本号已更新
- [ ] 依赖版本已固定（避免使用 `^` 或 `~`）

---

## 🔢 版本号管理

遵循 [语义化版本](https://semver.org/lang/zh-CN/) 规范：

- **Major (主版本号)**: 不兼容的 API 修改
  - 例如：`1.0.0` -> `2.0.0`
  - 命令：`npm version major`

- **Minor (次版本号)**: 向下兼容的功能新增
  - 例如：`1.0.0` -> `1.1.0`
  - 命令：`npm version minor`

- **Patch (修订号)**: 向下兼容的问题修正
  - 例如：`1.0.0` -> `1.0.1`
  - 命令：`npm version patch`

### 版本同步策略

**核心包和搜索包的版本可以独立管理**：

- 核心包有更新 → 只发布核心包
- 搜索包有更新 → 只发布搜索包
- 都有更新 → 分别发布两个包

**示例场景**：

```bash
# 场景1: 只修复了核心包的 bug
cd packages/core
npm version patch  # 0.1.0 -> 0.1.1
npm publish

# 场景2: 搜索包新增功能
cd packages/search
npm version minor  # 0.1.0 -> 0.2.0
npm publish

# 场景3: 核心包有破坏性更改，搜索包需要适配
cd packages/core
npm version major  # 0.1.0 -> 1.0.0
npm publish

cd packages/search
# 更新 peerDependencies 指向新的核心包版本
npm version major  # 0.2.0 -> 1.0.0
npm publish
```

---

## 🏷️ Git 标签规范

使用前缀区分不同的包：

```bash
# 核心包标签
git tag core-v0.1.0
git tag core-v0.1.1

# 搜索包标签
git tag search-v0.1.0
git tag search-v0.1.1

# 推送标签
git push origin --tags
```

---

## 📝 CHANGELOG 管理

### 手动维护

在每个包的目录下维护独立的 `CHANGELOG.md`：

```markdown
# Changelog

## [0.1.1] - 2024-01-15

### Fixed
- 修复定位权限问题

### Changed
- 优化地图渲染性能

## [0.1.0] - 2024-01-01

### Added
- 初始版本发布
```

### 自动生成

使用 Changesets 或 conventional-changelog：

```bash
# 使用 conventional-changelog
pnpm add -Dw conventional-changelog-cli

# 生成 CHANGELOG
npx conventional-changelog -p angular -i CHANGELOG.md -s
```

---

## 🧪 发布前测试

### 本地测试

```bash
# 1. 在核心包目录打包
cd packages/core
npm pack
# 生成 expo-gaode-map-0.1.0.tgz

# 2. 在搜索包目录打包
cd packages/search
npm pack
# 生成 expo-gaode-map-search-0.1.0.tgz

# 3. 在测试项目中安装
cd /path/to/test-project
npm install /path/to/expo-gaode-map-0.1.0.tgz
npm install /path/to/expo-gaode-map-search-0.1.0.tgz

# 4. 测试功能
npm run ios
npm run android
```

### 使用 npm link 测试

```bash
# 1. 在核心包目录创建链接
cd packages/core
npm link

# 2. 在搜索包目录创建链接
cd packages/search
npm link

# 3. 在测试项目中使用链接
cd /path/to/test-project
npm link expo-gaode-map
npm link expo-gaode-map-search

# 4. 测试完成后取消链接
npm unlink expo-gaode-map
npm unlink expo-gaode-map-search
```

---

## 🔐 npm 认证

### 首次发布

```bash
# 1. 登录 npm
npm login

# 输入用户名、密码、邮箱

# 2. 验证登录状态
npm whoami
```

### 使用 npm token（CI/CD）

```bash
# 1. 生成 token
npm token create --read-only  # 只读
npm token create              # 发布权限

# 2. 设置环境变量
export NPM_TOKEN=your-token-here

# 3. 在 .npmrc 中配置
echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc
```

---

## 🤖 自动化发布（GitHub Actions）

创建 `.github/workflows/publish.yml`：

```yaml
name: Publish Packages

on:
  push:
    tags:
      - 'core-v*'
      - 'search-v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build packages
        run: pnpm build
      
      - name: Publish core package
        if: startsWith(github.ref, 'refs/tags/core-v')
        run: |
          cd packages/core
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Publish search package
        if: startsWith(github.ref, 'refs/tags/search-v')
        run: |
          cd packages/search
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

---

## 📚 相关资源

- [npm 发布文档](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [Changesets 文档](https://github.com/changesets/changesets)
- [pnpm workspace 文档](https://pnpm.io/workspaces)

---

## ❓ 常见问题

### Q: 如何撤销已发布的版本？

```bash
# 撤销最近24小时内的版本
npm unpublish expo-gaode-map@0.1.0

# 注意：超过24小时后无法撤销，只能发布新版本
```

### Q: 如何发布 beta 版本？

```bash
# 1. 更新版本号为 beta
npm version 0.2.0-beta.0

# 2. 发布到 beta tag
npm publish --tag beta

# 3. 用户安装 beta 版本
npm install expo-gaode-map@beta
```

### Q: 搜索包依赖的核心包版本如何管理？

在 `packages/search/package.json` 中使用 `peerDependencies`：

```json
{
  "peerDependencies": {
    "expo-gaode-map": "^0.1.0"
  }
}
```

这样用户必须同时安装核心包，版本兼容性由 npm 管理。

### Q: 如何处理发布失败？

```bash
# 1. 检查错误信息
npm publish --dry-run  # 模拟发布

# 2. 常见错误
# - 版本号已存在：更新版本号
# - 权限问题：检查 npm 登录状态
# - 网络问题：检查网络连接或使用代理

# 3. 清理并重试
pnpm clean
pnpm install
pnpm build
npm publish

---

## 🧪 测试版本发布（Beta/Alpha/Canary）

### 什么是测试版本？

测试版本是用于在正式发布前进行测试的版本，不会影响现有用户使用的稳定版本。

**版本类型**：
- **Beta (β)** - 功能基本完成，需要更多测试
- **Alpha (α)** - 早期测试版本，可能不稳定
- **Canary (金丝雀)** - 最新开发版本，每日构建

### 为什么使用测试版本？

✅ **不影响现有用户** - 测试版本使用独立的 npm tag，不会成为默认版本  
✅ **安全测试新功能** - 可以让部分用户提前试用  
✅ **快速迭代** - 无需等待完整的发布周期  
✅ **收集反馈** - 在正式发布前发现问题  

### 使用交互式脚本发布测试版本

```bash
# 运行发布脚本
pnpm publish:interactive

# 按提示操作：
# 1. 选择要发布的包
# 2. 选择发布类型：
#    - 选择 "2) Beta 测试版"
#    - 或 "3) Alpha 测试版"
#    - 或 "4) Canary 金丝雀版"
```

脚本会自动：
- 生成预发布版本号（如 `0.1.1-beta.0`）
- 发布到指定 tag
- 不影响 `latest` 标签

### 手动发布测试版本

#### 发布 Beta 版本

```bash
# 1. 进入包目录
cd packages/core

# 2. 生成 beta 版本号
npm version prerelease --preid=beta --no-git-tag-version
# 首次: 0.1.0 -> 0.1.1-beta.0
# 再次: 0.1.1-beta.0 -> 0.1.1-beta.1

# 3. 发布到 beta tag
npm publish --tag beta --access public

# 4. 提交和标签
cd ../..
git add packages/core/package.json
git commit -m "chore(core): release v0.1.1-beta.0"
git tag "core-v0.1.1-beta.0"
git push origin main --tags
```

#### 发布 Alpha 版本

```bash
cd packages/search
npm version prerelease --preid=alpha --no-git-tag-version
npm publish --tag alpha --access public
```

#### 发布 Canary 版本

```bash
cd packages/core
npm version prerelease --preid=canary --no-git-tag-version
npm publish --tag canary --access public
```

### 版本号规则

| 当前版本 | 命令 | 新版本 |
|---------|------|--------|
| 0.1.0 | `npm version prerelease --preid=beta` | 0.1.1-beta.0 |
| 0.1.1-beta.0 | `npm version prerelease --preid=beta` | 0.1.1-beta.1 |
| 0.1.1-beta.1 | `npm version prerelease --preid=beta` | 0.1.1-beta.2 |
| 0.1.1-beta.2 | `npm version minor` | 0.2.0 (正式版) |

### 用户如何安装测试版本？

#### 安装最新的测试版本

```bash
# 安装最新的 beta 版本
npm install expo-gaode-map@beta
npm install expo-gaode-map-search@beta

# 安装最新的 alpha 版本
npm install expo-gaode-map@alpha

# 安装最新的 canary 版本
npm install expo-gaode-map@canary
```

#### 安装指定的测试版本

```bash
# 安装特定版本
npm install expo-gaode-map@0.1.1-beta.0
npm install expo-gaode-map-search@0.2.0-alpha.3
```

#### 在 package.json 中指定

```json
{
  "dependencies": {
    "expo-gaode-map": "0.1.1-beta.0",
    "expo-gaode-map-search": "beta"
  }
}
```

### 查看所有版本

```bash
# 查看所有发布的版本（包括测试版本）
npm view expo-gaode-map versions

# 查看当前各个 tag 的版本
npm view expo-gaode-map dist-tags

# 输出示例：
# {
#   latest: '0.1.0',
#   beta: '0.1.1-beta.2',
#   alpha: '0.2.0-alpha.0'
# }
```

### 从测试版本发布正式版本

当测试完成后，发布正式版本：

```bash
# 1. 进入包目录
cd packages/core

# 2. 发布正式版本（移除预发布标识）
npm version minor --no-git-tag-version
# 0.1.1-beta.2 -> 0.2.0

# 3. 发布到 latest（默认）
npm publish --access public

# 4. 提交
cd ../..
git add packages/core/package.json
git commit -m "chore(core): release v0.2.0"
git tag "core-v0.2.0"
git push origin main --tags
```

### 废弃测试版本

如果测试版本有严重问题，可以废弃：

```bash
# 废弃特定版本
npm deprecate expo-gaode-map@0.1.1-beta.0 "此版本有严重 bug，请使用 0.1.1-beta.1"

# 废弃整个 tag
npm deprecate expo-gaode-map@beta "Beta 测试已结束，请使用正式版本"
```

### 最佳实践

#### 1. 版本命名约定

```bash
# 功能开发阶段
0.2.0-alpha.0  → 0.2.0-alpha.1  → 0.2.0-alpha.2

# 功能完成，进入测试
0.2.0-beta.0  → 0.2.0-beta.1  → 0.2.0-beta.2

# 发布候选（可选）
0.2.0-rc.0  → 0.2.0-rc.1

# 正式发布
0.2.0
```

#### 2. 发布流程建议

```bash
# 开发新功能
git checkout -b feature/search-suggestions

# 完成开发后，发布 alpha 测试
pnpm publish:interactive  # 选择 alpha

# 经过内部测试后，发布 beta
pnpm publish:interactive  # 选择 beta

# 让部分用户试用，收集反馈

# 修复问题后，发布新的 beta
pnpm publish:interactive  # 选择 beta（版本号递增）

# 确认稳定后，发布正式版
pnpm publish:interactive  # 选择正式版本
```

#### 3. 通知用户

在 GitHub Releases 中说明测试版本：

```markdown
## 📦 v0.2.0-beta.0

这是一个 **Beta 测试版本**，用于收集反馈。

### 🎯 新功能
- 添加搜索建议功能

### 📝 安装方法
\`\`\`bash
npm install expo-gaode-map@beta
\`\`\`

### ⚠️ 注意事项
- 此版本可能不稳定
- 不建议在生产环境使用
- 欢迎反馈问题

### 🔗 相关链接
- Issue: #123
- 文档: https://xxx
```

### 常见问题

**Q: 测试版本会影响正式版本吗？**  
A: 不会。测试版本使用独立的 npm tag，用户执行 `npm install expo-gaode-map` 时仍会安装 `latest` 标签的正式版本。

**Q: 如何让用户切换回正式版本？**  
A: 执行 `npm install expo-gaode-map@latest` 或删除版本号后重新安装。

**Q: 可以删除已发布的测试版本吗？**  
A: 24小时内可以使用 `npm unpublish`，超过24小时只能使用 `npm deprecate` 标记为废弃。

**Q: 测试版本会在 npm 网站上显示吗？**  
A: 会显示，但不会作为默认版本。用户需要点击查看所有版本才能看到。

**Q: 如何自动化测试版本发布？**  
A: 可以使用 GitHub Actions，在推送特定分支时自动发布 canary 版本：

```yaml
name: Publish Canary
on:
  push:
    branches: [develop]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm build
      - run: |
          cd packages/core
          npm version prerelease --preid=canary --no-git-tag-version
          npm publish --tag canary --access public
```


---

## ⚙️ Beta 版本的 peerDependencies 管理

### 问题说明

当你发布 beta 版本时，可能会遇到 peerDependencies 冲突问题：

```
expo-gaode-map@2.1.0-beta.2
expo-gaode-map-search@1.0.0-beta.1

错误: peer expo-gaode-map@"^2.0.0" 与 2.1.0-beta.2 不兼容
```

这是因为语义化版本中，`^2.0.0` 不包含预发布版本（beta/alpha/canary）。

### 解决方案

#### 方案一：放宽 peerDependencies 范围（推荐）

在搜索包的 `package.json` 中，使用 `||` 运算符支持多个版本范围：

```json
{
  "peerDependencies": {
    "expo-gaode-map": "^2.0.0 || ^2.1.0-beta"
  }
}
```

这样可以同时支持：
- 正式版本：`2.0.0`, `2.0.1`, `2.0.2` ...
- Beta 版本：`2.1.0-beta.0`, `2.1.0-beta.1` ...

**优点**：
- ✅ 灵活性高，支持多个版本
- ✅ 用户可以混合使用正式版和 beta 版
- ✅ 不需要频繁修改

**完整示例**：

```json
{
  "peerDependencies": {
    "expo": "*",
    "expo-gaode-map": "^2.0.0 || ^2.1.0-beta || ^2.1.0-alpha",
    "react": "*",
    "react-native": "*"
  }
}
```

#### 方案二：使用宽松的版本范围

```json
{
  "peerDependencies": {
    "expo-gaode-map": ">=2.0.0"
  }
}
```

**优点**：
- ✅ 最简单，支持所有 2.x 版本
- ✅ 包括所有预发布版本

**缺点**：
- ⚠️ 可能允许不兼容的未来版本
- ⚠️ 缺乏版本控制

#### 方案三：同步版本号

让核心包和搜索包使用相同的版本号策略：

```bash
# 核心包发布 beta
cd packages/core
npm version 2.1.0-beta.0

# 搜索包也发布相同的 beta
cd packages/search
npm version 1.1.0-beta.0
```

然后更新 peerDependencies：

```json
{
  "peerDependencies": {
    "expo-gaode-map": "^2.1.0-beta.0"
  }
}
```

**优点**：
- ✅ 版本对应清晰
- ✅ 强制版本同步

**缺点**：
- ⚠️ 需要频繁修改 peerDependencies
- ⚠️ 即使搜索包没有变化也要发新版本

### 推荐的发布流程

#### 1. 初次发布 Beta

```bash
# 发布核心包 beta
cd packages/core
npm version 2.1.0-beta.0 --no-git-tag-version
npm publish --tag beta --access public

# 更新搜索包的 peerDependencies
cd packages/search
# 编辑 package.json
{
  "peerDependencies": {
    "expo-gaode-map": "^2.0.0 || ^2.1.0-beta"
  }
}

# 发布搜索包 beta
npm version 1.0.0-beta.0 --no-git-tag-version
npm publish --tag beta --access public
```

#### 2. 更新 Beta 版本

```bash
# 只更新核心包
cd packages/core
npm version prerelease --preid=beta --no-git-tag-version
# 2.1.0-beta.0 -> 2.1.0-beta.1
npm publish --tag beta --access public

# 搜索包不需要修改（因为 peerDependencies 已经支持 ^2.1.0-beta）
```

#### 3. 发布正式版本

```bash
# 发布核心包正式版
cd packages/core
npm version 2.1.0 --no-git-tag-version
npm publish --access public

# 搜索包不需要修改（因为 peerDependencies 支持 ^2.0.0）
# 但如果搜索包也有更新，可以发布新版本
cd packages/search
npm version 1.0.0 --no-git-tag-version
npm publish --access public
```

### 验证兼容性

发布后，测试不同版本组合的兼容性：

```bash
# 测试 1: 正式版 + 正式版
npm install expo-gaode-map@2.0.0
npm install expo-gaode-map-search@1.0.0

# 测试 2: Beta 版 + Beta 版
npm install expo-gaode-map@beta
npm install expo-gaode-map-search@beta

# 测试 3: 正式版 + Beta 版（如果适用）
npm install expo-gaode-map@2.0.0
npm install expo-gaode-map-search@beta
```

### 自动化脚本更新

我们的发布脚本已经自动处理这个问题。当你使用交互式脚本发布 beta 版本时：

```bash
pnpm publish:interactive
```

脚本会：
1. ✅ 自动生成正确的预发布版本号
2. ✅ 使用正确的 npm tag 发布
3. ✅ 提示用户如何安装 beta 版本
4. ✅ 不会影响 latest 标签

### 常见问题

**Q: 用户安装时如何确保版本兼容？**

A: 在文档中说明推荐的版本组合：

```bash
# 推荐：都使用 beta 版本
npm install expo-gaode-map@beta expo-gaode-map-search@beta

# 或指定具体版本
npm install expo-gaode-map@2.1.0-beta.2 expo-gaode-map-search@1.0.0-beta.1
```

**Q: 如果用户混合使用正式版和 beta 版会怎样？**

A: 取决于 peerDependencies 的配置。如果使用方案一（`^2.0.0 || ^2.1.0-beta`），npm 会允许这种组合。但建议在文档中说明最佳实践。

**Q: 发布正式版后，beta 版本会怎样？**

A: Beta 版本仍然存在于 npm 上，但不会成为默认版本。用户需要显式安装才能使用。

### 最佳实践总结

1. **使用方案一**：在 peerDependencies 中使用 `||` 支持多个版本范围
2. **在发布指南中说明**：建议用户同时使用相同类型的版本（都用正式版或都用 beta）
3. **测试兼容性**：在发布前测试不同版本组合
4. **更新文档**：在 CHANGELOG 和 Release Notes 中说明版本要求
5. **使用自动化脚本**：减少手动操作错误
