# Bun 迁移快速参考卡

一份从 pnpm 迁移到 Bun 的快速参考指南。

## 🚀 5 分钟快速迁移

### 步骤 1：安装 Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# 验证
bun --version
```

### 步骤 2：清理旧文件
```bash
rm -rf node_modules
rm -f pnpm-lock.yaml yarn.lock package-lock.json
rm -f bun.lockb
```

### 步骤 3：修改 package.json
```json
{
  "packageManager": "bun@1.0.0",
  "scripts": {
    "build": "bun run build",
    "test": "bun run test",
    "lint": "bun run lint"
  }
}
```

### 步骤 4：删除 pnpm-workspace.yaml
```bash
rm pnpm-workspace.yaml
```

### 步骤 5：安装依赖
```bash
bun install
```

### 步骤 6：验证
```bash
bun run build
bun run test
```

## 📝 常用命令对照

### 包管理

| pnpm | Bun | 说明 |
|------|-----|------|
| `pnpm install` | `bun install` | 安装依赖 |
| `pnpm add package` | `bun add package` | 添加依赖 |
| `pnpm add -D package` | `bun add -d package` | 添加开发依赖 |
| `pnpm remove package` | `bun remove package` | 删除依赖 |
| `pnpm update` | `bun update` | 更新依赖 |
| `pnpm outdated` | `bun pm outdated` | 检查过期包 |

### 脚本运行

| pnpm | Bun | 说明 |
|------|-----|------|
| `pnpm run build` | `bun run build` | 运行脚本 |
| `pnpm run build --filter pkg` | `bun run build --filter pkg` | 过滤运行 |
| `pnpm -r run build` | `bun run build --filter '*'` | 递归运行 |

### Monorepo

| pnpm | Bun | 说明 |
|------|-----|------|
| `pnpm -r install` | `bun install` | 安装所有包 |
| `pnpm -r run build` | `bun run build --filter '*'` | 构建所有包 |
| `pnpm --filter pkg run build` | `bun run build --filter pkg` | 构建指定包 |

### 测试

| pnpm | Bun | 说明 |
|------|-----|------|
| `pnpm test` | `bun test` | 运行测试 |
| `pnpm test --watch` | `bun test --watch` | 监听模式 |
| `pnpm test --coverage` | `bun test --coverage` | 覆盖率 |

### 缓存管理

| pnpm | Bun | 说明 |
|------|-----|------|
| `pnpm store prune` | `bun pm cache rm` | 清理缓存 |
| `pnpm store path` | `bun pm cache ls` | 查看缓存 |

## 🔧 配置文件对比

### pnpm-workspace.yaml → package.json

**pnpm-workspace.yaml (删除)**
```yaml
packages:
  - 'packages/*'
  - 'example'
```

**package.json (添加)**
```json
{
  "workspaces": [
    "packages/*",
    "example"
  ]
}
```

### .npmrc (可选修改)

**保留有用的配置**
```ini
registry=https://registry.npmjs.org/
strict-peer-dependencies=false
```

**删除 pnpm 特定配置**
```ini
# 删除以下行
shamefully-hoist=true
public-hoist-pattern[]=*
```

### bunfig.toml (新建，可选)

```toml
[install]
cache = true
lockfile = true

[run]
shell = "bash"

[test]
coverage = false
```

## 🎯 Expo 特定配置

### 推荐的混合方案

```json
{
  "scripts": {
    # Bun 用于开发
    "build": "bun run build --filter 'packages/*'",
    "lint": "bun run lint --filter 'packages/*'",
    "test": "bun run test --filter 'packages/*'",
    
    # pnpm 用于 Expo（更稳定）
    "android": "pnpm run android",
    "ios": "pnpm run ios",
    "prebuild": "pnpm exec expo prebuild --clean",
    "start": "pnpm exec expo start"
  }
}
```

### 为什么保留 pnpm 用于 Expo？

- Expo CLI 对 Bun 的支持还在发展中
- 某些 Expo 命令在 Bun 下可能不稳定
- pnpm 对 Expo 生态有更好的兼容性

## 🐛 常见问题速查

### 问题 1：Bun 安装失败
```bash
# 检查网络连接
ping bun.sh

# 使用代理
curl -fsSL https://bun.sh/install | PROXY=http://proxy:port bash

# 使用 npm 安装
npm install -g bun
```

### 问题 2：依赖安装错误
```bash
# 清理缓存
bun pm cache rm

# 删除 lock 文件重新安装
rm bun.lockb
bun install

# 使用 npm 兼容模式
bun install --bun-pm
```

### 问题 3：测试失败
```bash
# 清理并重新安装
rm -rf .bun node_modules bun.lockb
bun install

# 检查测试配置
bun test --help

# 使用 Jest
bunx jest
```

### 问题 4：TypeScript 错误
```bash
# 重新安装类型
bun add -D @types/node @types/react

# 检查 tsconfig.json
bunx tsc --noEmit

# 使用 Bun 类型
bun add -D bun-types
```

### 问题 5：Expo 命令不工作
```bash
# 使用 npx
npx expo run:android

# 或安装 Expo CLI
bun add -g expo-cli
```

## 📊 性能优化技巧

### 1. 并发执行
```bash
# 并行测试
bun test --concurrency 4

# 并行构建
bun run build --filter 'packages/*' --concurrency 2
```

### 2. 缓存利用
```bash
# 冻结 lock 文件（更快）
bun install --frozen-lockfile

# 预热缓存
bun install --prefer-offline

# 查看缓存大小
du -sh ~/.bun/install/cache
```

### 3. 减少依赖
```bash
# 检查未使用的包
bunx depcheck

# 移除未使用的包
bun remove unused-package
```

### 4. 使用工作区
```json
{
  "scripts": {
    "dev": "bun run dev --filter 'packages/*' --filter 'example'",
    "build:all": "bun run build --filter '*'"
  }
}
```

## 🔄 迁移检查清单

### 安装前
- [ ] Bun 已安装 (`bun --version`)
- [ ] 项目已备份
- [ ] 了解了 Bun 的限制

### 迁移中
- [ ] 删除了所有 lock 文件
- [ ] 删除了 pnpm-workspace.yaml
- [ ] 更新了根目录 package.json
- [ ] 更新了所有子包 package.json
- [ ] 运行 `bun install` 成功
- [ ] 生成了 bun.lockb

### 迁移后
- [ ] `bun run build` 成功
- [ ] `bun run test` 通过
- [ ] 示例应用可以运行
- [ ] 文档网站可以构建
- [ ] CI/CD 已更新
- [ ] 团队成员已通知

### 验证
- [ ] 所有测试通过
- [ ] 构建产物正确
- [ ] 性能提升明显
- [ ] 无运行时错误

## 🆘 紧急回滚

如果迁移失败，快速回滚：

```bash
# 1. 恢复 Git
git checkout backup-before-bun-migration

# 2. 或手动回滚
rm -f bun.lockb
rm -rf .bun
git checkout pnpm-lock.yaml
git checkout pnpm-workspace.yaml

# 3. 恢复 package.json
# 将所有 bun 替换为 pnpm

# 4. 重新安装
pnpm install
```

## 📚 有用的链接

- [Bun 官方文档](https://bun.sh/docs)
- [Bun Discord](https://discord.gg/bun)
- [Bun GitHub](https://github.com/oven-sh/bun)
- [Expo 文档](https://docs.expo.dev/)
- [项目迁移指南](./BUN_MIGRATION_GUIDE.md)

## 💡 提示和技巧

### 开发技巧
```bash
# 快速重启开发服务器
bunx nodemon

# 环境变量
bun run dev --env-file .env.local

# 调试
bun run dev --inspect
```

### 发布技巧
```bash
# 干运行（不实际发布）
bun publish --dry-run

# 指定 registry
bun publish --registry https://registry.npmjs.org/

# 标签发布
bun publish --tag beta
```

### 调试技巧
```bash
# 查看 Bun 版本和环境
bun --version
bun --revision

# 查看安装的包
bun pm ls

# 查看依赖树
bun pm ls --all
```

## 🎓 学习资源

### 官方资源
- [Bun 官网](https://bun.sh/)
- [Bun 文档](https://bun.sh/docs)
- [Bun 示例](https://bun.sh/examples)

### 社区资源
- [Bun Discord](https://discord.gg/bun)
- [Bun Twitter](https://twitter.com/bjavascript)
- [Awesome Bun](https://github.com/oven-sh/awesome-bun)

### 视频教程
- [Bun YouTube](https://www.youtube.com/@bunjavascript)
- [Expo Modules](https://www.youtube.com/@Expo)

## 📞 获取帮助

### 社区支持
- [GitHub Issues](https://github.com/TomWq/expo-gaode-map/issues)
- [Discussions](https://github.com/TomWq/expo-gaode-map/discussions)
- [Bun Discord](https://discord.gg/bun)

### 文档
- [完整迁移指南](./BUN_MIGRATION_GUIDE.md)
- [Bun 官方文档](https://bun.sh/docs)
- [Expo 文档](https://docs.expo.dev/)

---

**最后更新**: 2025-12-25
**版本**: 1.0.0
**维护者**: expo-gaode-map 团队
