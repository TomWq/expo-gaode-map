# AI 提效助手 (AI Skills)

为了让您在开发高德地图功能时拥有“开挂”般的体验，我们专门为 **Cursor / Trae** 等 AI 编程助手准备了一套深度集成的**技能知识库 (Skills)**。

这些知识库经过精心调优，包含了 `expo-gaode-map` 的所有 API 规范、原生配置陷阱以及高性能开发最佳实践。

## 📦 下载与安装

您可以直接下载并在您的项目中使用这些 AI 技能文件：

<div style="margin: 20px 0;">
  <a href="../expo-gaode-map-skills.zip" download style="display: inline-block; background: #3eaf7c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    🚀 下载 Cursor/Trae 技能包 (.zip)
  </a>
</div>

**安装步骤：**
1. 下载上面的压缩包并解压。
2. 您会看到一个 `expo-gaode-map-skills` 文件夹，打开它。
3. 将其中的 `.cursor` 目录直接复制到您的项目根目录下。
   - *提示：`.cursor` 在某些系统下可能是隐藏状态，请确保已开启“显示隐藏文件”或直接通过终端/拖拽操作。*
4. 如果您的项目已经有 `.cursor` 目录，请将解压后 `skills` 文件夹合并到您项目原有的 `.cursor/skills` 中。

---

## 🌟 为什么使用 AI Skills？

在使用 AI 助手（如 Cursor 的 Composer 或 Trae 的 Agent）编写代码时，加载这些技能文件可以确保：

- **API 零差错**：AI 将精准调用本库的 API，彻底杜绝“凭空捏造”方法名的情况。
- **性能方案最优**：AI 会自动建议您使用 C++ 聚合引擎或轨迹抽稀工具，而不是低效的 JS 方案。
- **平台差异自动处理**：AI 清楚 Android 和 iOS 在定位权限、前台服务上的不同配置要求。

---

## 🛠️ 如何在开发中使用？

如果您正在使用 Cursor 或 Trae，可以通过以下方式让 AI 更好地辅助您：

### 1. 任务式引导 (Mention Skills)
在对话框中输入 `@` 并搜索对应的技能文件名，让 AI 针对特定任务“加载知识”：
- **需要高性能 Marker？** -> 输入 `@marker-and-clustering.md`
- **需要做地理围栏判断？** -> 输入 `@geometry-utils.md`
- **需要配置后台定位？** -> 输入 `@location-and-tracking.md`

### 2. 全局提效 (Composer / Agent)
在进行复杂功能开发（如：实现一个打车软件的地图交互）时，直接告诉 AI：
> “参考 @SKILL.md 中的规范，帮我实现一个带路径规划和实时定位平滑移动的地图页面。”

---

## 📚 技能模块速查

| 模块名称 | 适用场景 |
| :--- | :--- |
| **map-view-core.md** | 基础地图显示、相机控制（缩放、旋转、移动）。 |
| **marker-and-clustering.md** | 海量点聚合、自定义标记点、点击交互。 |
| **geometry-utils.md** | **(推荐)** 坐标转换、距离/面积计算、轨迹抽稀、空间关系判断。 |
| **location-and-tracking.md** | 定位蓝点、权限请求、Android 前台服务配置。 |
| **navigation.md** | 驾车/步行/骑行路径规划、原生导航视图。 |
| **search.md** | POI 搜索、逆地理编码（坐标转地址）。 |
| **web-api.md** | 纯数据层面的高德 Web 服务集成。 |

---

## 💡 开发者贴士
虽然这些文件主要是给 AI 看的，但如果您需要快速查看某个 API 的正确参数格式，直接打开对应的 `.md` 文件通常比翻阅 TypeScript 类型定义更直观。
