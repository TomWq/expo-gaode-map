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
echo "2) expo-gaode-map-search (搜索包)"
echo "3) 两个包都发布"
read -p "请选择 (1/2/3): " choice

echo ""
echo "选择发布类型："
echo "1) 正式版本 (latest)"
echo "2) 测试版本 (next)"
read -p "请选择 (1/2): " release_type

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
    RELEASE_TAG="next"
    PRERELEASE="next"
    echo "选择测试版本更新类型："
    echo "1) 基于当前版本创建测试版 (例如: 2.1.0 -> 2.1.1-next.0)"
    echo "2) 升级 minor 并创建测试版 (例如: 2.0.1 -> 2.1.0-next.0)"
    echo "3) 升级 major 并创建测试版 (例如: 2.0.1 -> 3.0.0-next.0)"
    read -p "请选择 (1/2/3): " next_type
    case $next_type in
      1) VERSION_FLAG="prerelease --preid=next" ;;
      2) VERSION_FLAG="preminor --preid=next" ;;
      3) VERSION_FLAG="premajor --preid=next" ;;
      *) echo "无效选择"; exit 1 ;;
    esac
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

publish_core() {
  echo ""
  echo "📦 发布核心包 (expo-gaode-map) [${RELEASE_TAG}]..."
  cd packages/core
  
  OLD_VERSION=$(node -p "require('./package.json').version")
  
  # 直接计算新版本号（避免 npm/pnpm version 命令解析依赖）
  echo "计算新版本号..."
  if [[ "$VERSION_FLAG" == "patch" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[2]=String(Number(v[2])+1);console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" == "minor" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[1]=String(Number(v[1])+1);v[2]='0';console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" == "major" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[0]=String(Number(v[0])+1);v[1]='0';v[2]='0';console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" =~ ^prerelease ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[2]=String(Number(v[2])+1);console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  elif [[ "$VERSION_FLAG" =~ ^preminor ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[1]=String(Number(v[1])+1);v[2]='0';console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  elif [[ "$VERSION_FLAG" =~ ^premajor ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[0]=String(Number(v[0])+1);v[1]='0';v[2]='0';console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  fi
  
  # 直接修改 package.json 的版本号
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.version='${NEW_VERSION}';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');"
  
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
  echo "📦 发布搜索包 (expo-gaode-map-search) [${RELEASE_TAG}]..."
  cd packages/search
  
  OLD_VERSION=$(node -p "require('./package.json').version")
  
  # 备份原始 package.json
  cp package.json package.json.backup
  
  # 直接计算新版本号（避免 npm/pnpm version 命令解析依赖）
  echo "计算新版本号..."
  if [[ "$VERSION_FLAG" == "patch" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[2]=String(Number(v[2])+1);console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" == "minor" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[1]=String(Number(v[1])+1);v[2]='0';console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" == "major" ]]; then
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[0]=String(Number(v[0])+1);v[1]='0';v[2]='0';console.log(v.slice(0,3).join('.'))")
  elif [[ "$VERSION_FLAG" =~ ^prerelease ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[2]=String(Number(v[2])+1);console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  elif [[ "$VERSION_FLAG" =~ ^preminor ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[1]=String(Number(v[1])+1);v[2]='0';console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  elif [[ "$VERSION_FLAG" =~ ^premajor ]]; then
    PREID=$(echo "$VERSION_FLAG" | sed 's/.*--preid=//')
    NEW_VERSION=$(node -e "const v=require('./package.json').version.split(/[.-]/);v[0]=String(Number(v[0])+1);v[1]='0';v[2]='0';console.log(v.slice(0,3).join('.')+'-${PREID}.0')")
  fi
  
  # 直接修改 package.json 的版本号
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.version='${NEW_VERSION}';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');"
  
  echo "版本: ${OLD_VERSION} -> ${NEW_VERSION}"
  
  # 获取核心包的最新版本号
  CORE_VERSION=$(node -p "require('../core/package.json').version")
  echo "检测到核心包版本: ${CORE_VERSION}"
  
  # 替换为实际的核心包版本号（用于发布）
  echo "更新依赖为 ^${CORE_VERSION}..."
  node -e "const fs=require('fs');const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));pkg.dependencies['expo-gaode-map']='^${CORE_VERSION}';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');"
  
  if [ "$RELEASE_TAG" == "latest" ]; then
    pnpm publish --access public --no-git-checks
  else
    pnpm publish --access public --tag $RELEASE_TAG --no-git-checks
    echo -e "${YELLOW}⚠️  注意: 这是一个 ${RELEASE_TAG} 版本，用户需要显式安装${NC}"
    echo "   安装命令: npm install expo-gaode-map-search@${RELEASE_TAG}"
    echo "   或指定版本: npm install expo-gaode-map-search@${NEW_VERSION}"
  fi
  
  # 恢复 workspace:* 协议
  echo "恢复 workspace:* 协议..."
  mv package.json.backup package.json
  
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
  echo "  📦 expo-gaode-map-search: v${SEARCH_VERSION}"
  if [ "$RELEASE_TAG" == "latest" ]; then
    echo "     npm install expo-gaode-map-search"
    echo "     或: npm install expo-gaode-map-search@${SEARCH_VERSION}"
  else
    echo "     npm install expo-gaode-map-search@${RELEASE_TAG}"
    echo "     或: npm install expo-gaode-map-search@${SEARCH_VERSION}"
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