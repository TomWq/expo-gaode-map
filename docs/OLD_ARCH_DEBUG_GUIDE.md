# iOS 旧架构调试指南

## 问题描述

在 iOS 旧架构下运行时遇到崩溃：
```
Assertion failed: (!currentInstance_ && "Only one instance allowed"), 
function registerInstance, file HostTarget.cpp, line 186.
```

## 问题原因

这是 React Native 旧架构 + Hermes + Chrome 调试器的已知冲突。当启用 Chrome DevTools 调试时，调试器会尝试注册多个实例，导致断言失败。

## 解决方案

### 1. 修复网络配置（必需）

已修改 `example/ios/expogaodemapexample/Info.plist`：
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>  <!-- 允许 HTTP 连接到 Metro -->
    <key>NSAllowsLocalNetworking</key>
    <true/>
</dict>
```

### 2. 确保配置一致（必需）

- `app.json`: `"newArchEnabled": false`
- `Podfile.properties.json`: `"newArchEnabled": "false"`
- `Info.plist`: `<key>RCTNewArchEnabled</key><false/>`

### 3. 清理并重建（必需）

运行清理脚本：
```bash
cd example/ios
./rebuild.sh
```

或手动执行：
```bash
# 清理 DerivedData
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 清理 Pods
cd example/ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install

# 在 Xcode 中
# Product -> Clean Build Folder (⇧⌘K)
```

### 4. 禁用 Chrome 调试器（关键）

旧架构下有两种调试方式：

#### 方式 A：使用 React Native DevTools（推荐）
```bash
# 启动 React Native DevTools
npx react-native start

# 在应用中打开开发者菜单（摇晃设备或 ⌘D）
# 选择 "Open React DevTools"
```

#### 方式 B：完全禁用调试
在应用运行时：
1. 打开开发者菜单（⌘D）
2. 确保 "Debug" 选项是关闭的
3. 不要点击 "Debug with Chrome"

### 5. Xcode 调试设置

在 Xcode 的 Scheme 设置中：
```
Edit Scheme -> Run -> Info
Build Configuration: Debug

Edit Scheme -> Run -> Options
☐ Debug Executable (如果不需要原生调试可以关闭)
```

## 调试最佳实践

### 推荐的调试工具（旧架构）

1. **React Native DevTools**
   - 组件树查看
   - Props/State 检查
   - 不会触发 "Only one instance" 错误

2. **Xcode Console**
   - 查看原生日志
   - 使用 `console.log()` 会输出到这里

3. **Metro Bundler 日志**
   - JavaScript 错误
   - 网络请求

### 避免使用

❌ Chrome DevTools (会触发崩溃)
❌ Safari 调试器 (旧架构下不稳定)

## 常见问题

### Q: 为什么新架构不会有这个问题？
A: 新架构使用了不同的调试机制，不依赖 Chrome DevTools 的实例注册。

### Q: 能否在旧架构下使用断点调试？
A: 可以使用 Xcode 的断点调试原生代码，JavaScript 代码建议使用 `console.log()` 或 React Native DevTools。

### Q: Metro 提示 "No script URL provided"
A: 这是网络配置问题，确保：
1. `NSAllowsArbitraryLoads` 设置为 `true`
2. 设备/模拟器能访问 Metro 服务器
3. 防火墙没有阻止连接

## 验证步骤

1. 运行清理脚本：
   ```bash
   cd example/ios && ./rebuild.sh
   ```

2. 在 Xcode 中打开项目并运行

3. 不要启用 Chrome 调试器

4. 应用应该正常启动，在 Xcode Console 查看日志

5. 如果需要调试 JS 代码，使用 React Native DevTools：
   ```bash
   npx react-native start
   # 在应用中 ⌘D -> Open React DevTools
   ```

## 相关资源

- [React Native 调试文档](https://reactnative.dev/docs/debugging)
- [Expo 调试指南](https://docs.expo.dev/debugging/runtime-issues/)
- [React Native DevTools](https://github.com/facebook/react-native/tree/main/packages/dev-middleware)