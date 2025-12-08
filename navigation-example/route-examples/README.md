# 高德地图路径规划示例

本文件夹包含了高德地图 Web API **新版 V5** 路径规划的完整示例代码。

## 📁 文件列表

### 1. DrivingRouteExample.tsx - 驾车路径规划
**功能演示：**
- ✅ 速度优先（策略32）
- ✅ 躲避拥堵（策略33）
- ✅ 高速优先（策略34）
- ✅ 不走高速（策略35）
- ✅ 少收费（策略36）
- ✅ 纯电动车路径规划
- ✅ show_fields 控制返回字段

**新版特性：**
- 策略编号从 32-45（旧版 0-9 已废弃）
- 支持车牌号避开限行
- 支持车辆类型（燃油/纯电/插混）
- 支持轮渡控制
- 支持 POI ID 提升准确性

---

### 2. WalkingRouteExample.tsx - 步行路径规划
**功能演示：**
- ✅ 单条路线
- ✅ 2条/3条备选路线
- ✅ 详细导航信息（含动作指令）
- ✅ 室内算路
- ✅ 长距离步行测试
- ✅ 道路类型识别（天桥、地下通道等）

**新版特性：**
- alternative_route: 1/2/3 返回不同条数
- show_fields=navi 返回详细导航
- isindoor=1 启用室内路径
- walk_type 标识道路类型
- 预估打车费用

---

### 3. TransitRouteExample.tsx - 公交路径规划
**功能演示：**
- ✅ 推荐模式（策略0）
- ✅ 最经济模式（策略1）
- ✅ 最少换乘模式（策略2）
- ✅ 最少步行模式（策略3）
- ✅ 不乘地铁模式（策略5）
- ✅ 地铁优先模式（策略7）
- ✅ 时间短模式（策略8）
- ✅ 多方案对比（1-10个方案）

**新版特性：**
- city1/city2 必填参数（使用 citycode）
- 新增策略 6/7/8（地铁图/地铁优先/时间短）
- AlternativeRoute 返回多个方案
- multiexport 控制地铁出入口
- 支持 date/time 参数

**重要提示：**
- 北京 citycode: 010
- 上海 citycode: 021
- 广州 citycode: 020

---

### 4. BicyclingRouteExample.tsx - 骑行 & 电动车路径规划
**功能演示：**
- ✅ 骑行单条/多条路线
- ✅ 电动车单条/多条路线
- ✅ 详细导航信息
- ✅ 骑行 vs 电动车对比
- ✅ 短途骑行测试

**新版特性：**
- alternative_route: 1/2/3
- show_fields 控制返回字段
- 骑行路线适合非机动车道
- 电动车路线可能选择主干道

---

## 🚀 使用方法

### 方式一：使用菜单入口（推荐）

1. **安装依赖**
```bash
cd navigation-example
npm install
# 或
pnpm install
```

2. **导入菜单组件**
在您的 App.tsx 或入口文件中：
```typescript
import RouteExamplesMenu from './route-examples/RouteExamplesMenu';

export default function App() {
  return <RouteExamplesMenu />;
}
```

3. **运行应用**
```bash
npx expo start
```

4. **使用示例**
- 启动后会看到一个菜单页面，列出所有示例
- 点击任意示例卡片进入对应的测试页面
- 输入 Web API Key 并初始化
- 开始测试各种功能

### 方式二：直接导入单个示例

```typescript
import DrivingRouteExample from './route-examples/DrivingRouteExample';

export default function App() {
  return <DrivingRouteExample />;
}
```

### 获取 API Key
1. 访问 [高德开放平台](https://lbs.amap.com/)
2. 注册/登录账号
3. 创建应用，选择 **Web 服务**
4. 复制 Web API Key

---

## 📊 API 配额说明

| 服务类型 | 个人开发者 | 认证企业 |
|---------|-----------|---------|
| 每日调用量 | 30万次/天 | 100万次/天 |
| QPS限制 | 100次/秒 | 200次/秒 |

---

## 🎯 使用场景

### 驾车路径规划
- 🚗 导航应用
- 🚕 网约车平台
- 🚛 物流配送
- 🔋 新能源车导航

### 步行路径规划
- 🚶 最后一公里导航
- 🏢 室内导航
- 🏞️ 景区导游
- 🚶‍♀️ 健身跑步路线

### 公交路径规划
- 🚌 公共交通查询
- 🚇 地铁换乘指南
- 🎒 旅游出行规划
- 💰 经济出行方案

### 骑行/电动车路径规划
- 🚴 共享单车导航
- 🛵 外卖配送
- 🌳 骑行旅游
- 🏃 运动健身

---

## ⚠️ 注意事项

1. **API Key 安全**
   - 不要在客户端暴露 API Key
   - 生产环境建议通过后端代理调用
   - 可以配置 IP 白名单

2. **坐标系统**
   - 高德地图使用 GCJ-02 坐标系
   - GPS 原始坐标需要先转换

3. **citycode 使用**
   - 公交规划必须使用 citycode（如：010）
   - 不能使用 adcode 或城市名称

4. **策略选择**
   - 驾车使用策略 32-45
   - 旧版策略 0-2 仍然支持但不推荐
   - 不同策略会影响路线和时间

5. **show_fields 参数**
   - 不设置时只返回基础信息
   - 按需设置可减少数据传输
   - 多个字段用逗号分隔

---

## 🔗 相关链接

- [高德开放平台](https://lbs.amap.com/)
- [Web API 文档](https://lbs.amap.com/api/webservice/summary)
- [路径规划 V5 API](https://lbs.amap.com/api/webservice/guide/api/newroute)
- [坐标拾取器](https://lbs.amap.com/tools/picker)

---

## 📝 更新日志

### v1.0.0 (2024-12)
- ✅ 完整的驾车路径规划示例
- ✅ 完整的步行路径规划示例
- ✅ 完整的公交路径规划示例
- ✅ 完整的骑行/电动车路径规划示例
- ✅ 所有类型定义与新版 V5 API 一致
- ✅ 支持所有新版参数和策略

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License