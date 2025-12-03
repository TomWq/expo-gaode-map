# 接下来的操作步骤

## 📋 快速指引

你现在有两个选择:

### 选项 A: 快速方案 - 先发布核心包(推荐先做这个)
### 选项 B: 完整方案 - 迁移到 Monorepo 并实现搜索功能

---

## 🚀 选项 A: 快速方案(推荐)

**目标**: 先发布核心包,保留未来扩展能力

### 步骤 1: 提交当前更改

```bash
# 查看修改的文件
git status

# 添加新文件
git add src/utils/ModuleLoader.ts
git add src/index.ts
git add android/build.gradle
git add ios/ExpoGaodeMap.podspec
git add docs/OPTIONAL_MODULES*.md
git add docs/PACKAGE_JSON_GUIDE.md

# 提交
git commit -m "feat: 添加可选模块架构支持

- 创建模块检测工具
- 更新 Android/iOS 配置支持可选依赖
- 添加完整的架构文档"
```

### 步骤 2: 构建核心包

```bash
# 构建
npm run build

# 检查构建产物
ls build/
```

### 步骤 3: 测试核心包

```bash
# 在 example 目录测试
cd example
npm install
npm run android
# 或
npm run ios
```

### 步骤 4: 发布核心包

```bash
# 回到根目录
cd ..

# 更新版本号(如果需要)
npm version patch  # 或 minor, major

# 发布
npm publish

# 或发布为 next 标签(用于测试)
npm publish --tag next
```

### 步骤 5: 验证发布

```bash
# 在新目录测试安装
mkdir test-install
cd test-install
npm init -y
npm install expo-gaode-map@latest

# 测试模块检测功能
node
> const { isModuleAvailable } = require('expo-gaode-map');
> console.log(isModuleAvailable('expo-gaode-map-search'));
```

**完成!** 核心包已经支持可选模块架构,用户可以开始使用。

---

## 🏗️ 选项 B: 完整方案 - Monorepo 迁移

**目标**: 迁移到 Monorepo 结构,实现搜索模块

### 步骤 1: 安装 pnpm

```bash
# 安装 pnpm
npm install -g pnpm

# 验证安装
pnpm --version
```

### 步骤 2: 备份当前项目

```bash
# 创建备份
cd ..
cp -r expo-gaode-map expo-gaode-map-backup
cd expo-gaode-map
```

### 步骤 3: 创建 packages/core 目录

```bash
# 创建目录结构
mkdir -p packages/core

# 移动核心文件
mv src packages/core/
mv android packages/core/
mv ios packages/core/
mv expo-module.config.json packages/core/
mv tsconfig.json packages/core/
mv .eslintrc.js packages/core/
mv .npmignore packages/core/
mv app.plugin.js packages/core/
mv plugin packages/core/

# 复制 package.json 到 core (已经创建好了)
# packages/core/package.json 已存在

# 注意: 保留在根目录的文件
# - docs/
# - example/
# - README.md
# - .gitignore
# - package.json (根目录的新版本)
# - pnpm-workspace.yaml
```

### 步骤 4: 安装依赖

```bash
# 清理旧的 node_modules
rm -rf node_modules

# 使用 pnpm 安装
pnpm install
```

### 步骤 5: 构建所有包

```bash
# 构建核心包
pnpm --filter expo-gaode-map build

# 构建搜索模块
pnpm --filter expo-gaode-map-search build
```

### 步骤 6: 更新 Example 应用

```bash
cd example

# 修改 package.json,使用 workspace 包
# 将 "expo-gaode-map": "^2.0.0" 改为:
# "expo-gaode-map": "workspace:*"
```

编辑 `example/package.json`:
```json
{
  "dependencies": {
    "expo-gaode-map": "workspace:*",
    "expo-gaode-map-search": "workspace:*"
  }
}
```

```bash
# 重新安装
pnpm install

# 测试运行
pnpm android
```

### 步骤 7: 测试搜索功能

创建测试文件 `example/SearchTest.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Button, Text } from 'react-native';
import { searchPOI } from 'expo-gaode-map-search';

export default function SearchTest() {
  const [results, setResults] = useState([]);

  const handleSearch = async () => {
    const data = await searchPOI({
      keyword: '餐厅',
      city: '北京',
      pageSize: 10
    });
    setResults(data.pois);
  };

  return (
    <View>
      <Button title="搜索餐厅" onPress={handleSearch} />
      {results.map((poi, index) => (
        <Text key={index}>{poi.name}</Text>
      ))}
    </View>
  );
}
```

### 步骤 8: 提交 Monorepo 更改

```bash
# 回到根目录
cd ..

# 查看所有更改
git status

# 添加所有新文件
git add .

# 提交
git commit -m "refactor: 重构为 Monorepo 结构

- 移动核心包到 packages/core
- 创建搜索模块 packages/search
- 配置 pnpm workspaces
- 实现完整的搜索功能 (POI/周边/地理编码)"
```

### 步骤 9: 发布包

```bash
# 发布核心包
cd packages/core
npm run build
npm publish

# 发布搜索模块
cd ../search
npm run build
npm publish
```

---

## 🤔 我应该选择哪个方案?

### 选择选项 A (快速方案) 如果:
- ✅ 你想快速发布更新
- ✅ 暂时不需要实现搜索功能
- ✅ 想保持项目结构简单
- ✅ 为未来的可选模块做准备

### 选择选项 B (完整方案) 如果:
- ✅ 你现在就需要搜索功能
- ✅ 愿意花时间迁移项目结构
- ✅ 计划添加更多可选模块
- ✅ 想要更好的包管理

---

## 💡 我的建议

**第一阶段: 先做选项 A**
1. 提交当前的模块检测功能
2. 发布核心包 v2.0.0
3. 让用户开始使用

**第二阶段: 再做选项 B**
1. 在新分支上迁移到 Monorepo
2. 实现搜索模块
3. 充分测试后再发布

这样可以:
- 尽快让用户获得模块检测功能
- 有充足时间完善 Monorepo 结构
- 降低风险,逐步迁移

---

## ❓ 常见问题

### Q: 迁移会影响现有用户吗?
A: 不会。核心包名称不变 (`expo-gaode-map`),API 兼容。

### Q: 必须使用 pnpm 吗?
A: Monorepo 推荐用 pnpm,但也可以用 npm workspaces 或 yarn workspaces。

### Q: 搜索模块什么时候可用?
A: 完成 Monorepo 迁移并发布后即可用。

### Q: 如果迁移出问题怎么办?
A: 已经建议备份。如有问题可以回滚到备份目录。

---

## 📞 需要帮助?

选择你想执行的方案,我可以帮你:
1. 生成完整的命令脚本
2. 解决遇到的具体问题
3. 创建测试用例

**你想从哪个选项开始?**