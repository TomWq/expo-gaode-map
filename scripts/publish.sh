#!/bin/bash

set -e

echo "📦 Monorepo 发包工具"
echo "===================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否有未提交的更改
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}❌ 检测到未提交的更改${NC}"
  echo "请先提交所有更改："
  git status -s
  exit 1
fi

# 检查当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "当前分支: ${BRANCH}"
if [ "$BRANCH" != "main" ]; then
  echo -e "${YELLOW}⚠️  警告: 当前不在 main 分支${NC}"
  read -p "是否继续? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo ""
echo "选择要发布的包："
echo "1) expo-gaode-map (核心包)"
echo "2) @expo-gaode-map/search (搜索包)"
echo "3) 两个包都发布"
read -p "请选择 (1/2/3): " choice

echo ""
echo "选择发布类型："
echo "1) 正式版本 (latest)"
echo "2) Beta 测试版 (beta)"
echo "3) Alpha 测试版 (alpha)"
echo "4) Canary 金丝雀版 (canary)"
read -p "请选择 (1/2/3/4): " release_type

case $release_type in
  1)
    RELEASE_TAG="latest"
    PRERELEASE=""
    echo "选择版本更新类型："
    echo "1) patch (修订号，例如: 0.1.0 -> 0.1.1)"
    echo "2) minor (次版本号，例如: 0.1.0 -> 0.2.0)"
    echo "3) major (主版本号，例如: 0.1.0 -> 1.0.0)"
    read -p "请选择 (1/2/3): " version_type
    case $version_type in
      1) VERSION_FLAG="patch" ;;
      2) VERSION_FLAG="minor" ;;
      3) VERSION_FLAG="major" ;;
      *) echo "无效选择"; exit 1 ;;
    esac
    ;;
  2)
    RELEASE_TAG="beta"
    PRERELEASE="beta"
    VERSION_FLAG="prerelease --preid=beta"
    ;;
  3)
    RELEASE_TAG="alpha"
    PRERELEASE="alpha"
    VERSION_FLAG="prerelease --preid=alpha"
    ;;
  4)
    RELEASE_TAG="canary"
    PRERELEASE="canary"
    VERSION_FLAG="prerelease --preid=canary"
    ;;
  *) echo "无效选择"; exit 1 ;;
esac

# 检查 npm 登录状态
echo ""
echo "🔐 检查 npm 登录状态..."
if ! npm whoami > /dev/null 2>&1; then
  echo -e "${RED}❌ 未登录 npm，请先执行: npm login${NC}"
  exit 1
fi

NPM_USER=$(npm whoami)
echo -e "${GREEN}✓ 已登录为: ${NPM_USER}${NC}"

# 构建所有包
echo ""
echo "🔨 构建包..."
pnpm build

# 临时替换搜索包的 workspace:* 依赖
echo ""
echo "🔧 临时替换 workspace 协议..."
SEARCH_PKG_PATH="packages/search/package.json"
if [ -f "$SEARCH_PKG_PATH" ]; then
  # 备份原始文件
  cp "$SEARCH_PKG_PATH" "$SEARCH_PKG_PATH.backup"
  
  # 获取当前核心包版本
  CURRENT_CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
  echo "将搜索包依赖临时改为: ^${CURRENT_CORE_VERSION}"
  
  # 替换 workspace:* 为实际版本号
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('$SEARCH_PKG_PATH','utf8'));pkg.dependencies['expo-gaode-map']='^${CURRENT_CORE_VERSION}';fs.writeFileSync('$SEARCH_PKG_PATH',JSON.stringify(pkg,null,2)+'\n');"
fi

publish_core() {
  echo ""
  echo "📦 发布核心包 (expo-gaode-map) [${RELEASE_TAG}]..."
  cd packages/core
  
  OLD_VERSION=$(node -p "require('./package.json').version")
  pnpm version $VERSION_FLAG --no-git-tag-version
  NEW_VERSION=$(node -p "require('./package.json').version")
  
  echo "版本: ${OLD_VERSION} -> ${NEW_VERSION}"
  
  if [ "$RELEASE_TAG" == "latest" ]; then
    pnpm publish --access public --no-git-checks
  else
    pnpm publish --access public --tag $RELEASE_TAG --no-git-checks
    echo -e "${YELLOW}⚠️  注意: 这是一个 ${RELEASE_TAG} 版本，用户需要显式安装${NC}"
    echo "   安装命令: npm install expo-gaode-map@${RELEASE_TAG}"
    echo "   或指定版本: npm install expo-gaode-map@${NEW_VERSION}"
  fi
  
  cd ../..
  
  git add packages/core/package.json
  if [ "$PRERELEASE" != "" ]; then
    git commit -m "chore(core): release v${NEW_VERSION} [${PRERELEASE}]"
  else
    git commit -m "chore(core): release v${NEW_VERSION}"
  fi
  git tag "core-v${NEW_VERSION}"
  
  echo -e "${GREEN}✓ 核心包发布成功: v${NEW_VERSION} [${RELEASE_TAG}]${NC}"
}

publish_search() {
  echo ""
  echo "📦 发布搜索包 (@expo-gaode-map/search) [${RELEASE_TAG}]..."
  cd packages/search
  
  OLD_VERSION=$(node -p "require('./package.json').version")
  pnpm version $VERSION_FLAG --no-git-tag-version
  NEW_VERSION=$(node -p "require('./package.json').version")
  
  echo "版本: ${OLD_VERSION} -> ${NEW_VERSION}"
  
  # 获取核心包的实际版本号
  CORE_VERSION=$(node -p "require('../core/package.json').version")
  echo "检测到核心包版本: ${CORE_VERSION}"
  
  # 更新依赖版本号（已经在开始时替换过了，这里更新为最新版本）
  echo "更新依赖为 ^${CORE_VERSION}..."
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.dependencies['expo-gaode-map']='^${CORE_VERSION}';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');"
  
  if [ "$RELEASE_TAG" == "latest" ]; then
    pnpm publish --access public --no-git-checks
  else
    pnpm publish --access public --tag $RELEASE_TAG --no-git-checks
    echo -e "${YELLOW}⚠️  注意: 这是一个 ${RELEASE_TAG} 版本，用户需要显式安装${NC}"
    echo "   安装命令: npm install @expo-gaode-map/search@${RELEASE_TAG}"
    echo "   或指定版本: npm install @expo-gaode-map/search@${NEW_VERSION}"
  fi
  
  cd ../..
  
  git add packages/search/package.json
  if [ "$PRERELEASE" != "" ]; then
    git commit -m "chore(search): release v${NEW_VERSION} [${PRERELEASE}]"
  else
    git commit -m "chore(search): release v${NEW_VERSION}"
  fi
  git tag "search-v${NEW_VERSION}"
  
  echo -e "${GREEN}✓ 搜索包发布成功: v${NEW_VERSION} [${RELEASE_TAG}]${NC}"
}

# 根据选择发布
case $choice in
  1) publish_core ;;
  2) publish_search ;;
  3) 
    publish_core
    publish_search
    ;;
  *) echo "无效选择"; exit 1 ;;
esac

# 恢复搜索包的 workspace:* 协议
echo ""
echo "🔧 恢复 workspace 协议..."
if [ -f "$SEARCH_PKG_PATH.backup" ]; then
  mv "$SEARCH_PKG_PATH.backup" "$SEARCH_PKG_PATH"
  echo "已恢复搜索包的 workspace:* 依赖"
fi

# 推送到远程
echo ""
read -p "是否推送到远程仓库? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 推送到远程仓库..."
  git push origin $BRANCH --tags
  echo -e "${GREEN}✓ 推送完成${NC}"
fi

echo ""
echo -e "${GREEN}✨ 发布流程完成!${NC}"
echo ""
echo "发布信息："
echo "发布类型: ${RELEASE_TAG}"
echo ""

if [ "$choice" == "1" ] || [ "$choice" == "3" ]; then
  CORE_VERSION=$(node -p "require('./packages/core/package.json').version")
  echo "  📦 expo-gaode-map: v${CORE_VERSION}"
  if [ "$RELEASE_TAG" == "latest" ]; then
    echo "     npm install expo-gaode-map"
    echo "     或: npm install expo-gaode-map@${CORE_VERSION}"
  else
    echo "     npm install expo-gaode-map@${RELEASE_TAG}"
    echo "     或: npm install expo-gaode-map@${CORE_VERSION}"
  fi
fi

if [ "$choice" == "2" ] || [ "$choice" == "3" ]; then
  SEARCH_VERSION=$(node -p "require('./packages/search/package.json').version")
  echo "  📦 @expo-gaode-map/search: v${SEARCH_VERSION}"
  if [ "$RELEASE_TAG" == "latest" ]; then
    echo "     npm install @expo-gaode-map/search"
    echo "     或: npm install @expo-gaode-map/search@${SEARCH_VERSION}"
  else
    echo "     npm install @expo-gaode-map/search@${RELEASE_TAG}"
    echo "     或: npm install @expo-gaode-map/search@${SEARCH_VERSION}"
  fi
fi

if [ "$RELEASE_TAG" != "latest" ]; then
  echo ""
  echo -e "${YELLOW}⚠️  测试版本说明:${NC}"
  echo "  - 测试版本不会成为默认版本（latest tag）"
  echo "  - 用户执行 'npm install' 时不会自动安装测试版本"
  echo "  - 必须显式指定版本号或 tag 才能安装"
  echo "  - 适合内部测试或提前让部分用户试用新功能"
fi

echo ""