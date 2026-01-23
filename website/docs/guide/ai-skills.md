# AI 提效助手 (AI Skills)

为了让您在开发高德地图功能时拥有“开挂”般的体验，我们专门为 **TRAE** AI 编程助手准备了一套深度集成的**技能知识库 (Skills)**。

这些知识库经过精心调优，包含了 `expo-gaode-map` 的所有 API 规范、原生配置陷阱以及高性能开发最佳实践。

## 📦 下载与安装

您可以直接下载并在您的项目中使用这些 AI 技能文件：

<div style="margin: 20px 0;">
  <a href="../expo-gaode-map-skills.zip" download style="display: inline-block; background: #3eaf7c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    🚀 下载 TRAE 技能包 (.zip)
  </a>
</div>

**安装步骤：**
1. 下载上面的压缩包并解压。
2. 您会看到一个 `expo-gaode-map-skills` 文件夹。
3. 打开 **TRAE**，进入 **设置 > 规则和技能**。
4. 在 **技能** 部分，点击 **创建** 按钮。
5. 在 **新建** 窗口中，直接上传解压后的文件夹中的 `.zip` 文件或单个 `SKILL.md`。
6. TRAE 会自动分析并导入技能。

---

## 🌟 为什么使用 AI Skills？

在使用 TRAE Agent 编写代码时，加载这些技能文件可以确保：

- **按需自动加载**：TRAE 会根据您的任务描述，自动判断并加载所需的技能，无需手动 `@` 引用文件。
- **API 零差错**：AI 将精准调用本库的 API，彻底杜绝“凭空捏造”方法名的情况。
- **性能方案最优**：AI 会自动建议您使用 C++ 聚合引擎或轨迹抽稀工具，而不是低效的 JS 方案。
- **平台差异自动处理**：AI 清楚 Android 和 iOS 在定位权限、前台服务上的不同配置要求。

---

## 🛠️ 如何在开发中使用？

### 1. 自动触发 (Auto-Trigger)
TRAE 的技能机制是**隐式触发**的。您只需要用自然语言描述您的需求，如果需求与某个技能匹配，Agent 会自动加载该技能。

**示例指令：**
> “帮我实现一个带路径规划和实时定位平滑移动的地图页面。”

此时，TRAE 会自动检测到这涉及到 `navigation` 和 `location` 技能，并自动加载相关文档来指导代码生成。

### 2. 手动引导 (如有必要)
虽然 TRAE 支持自动加载，但您也可以在提示词中显式提及技能名称来增强上下文：

> “使用 **expo-gaode-map-navigation** 技能，帮我规划一条从北京到上海的驾车路线。”

---

## 📚 技能模块速查

我们提供了以下核心技能模块，覆盖了地图开发的方方面面：

| 技能名称 (Skill Name) | 描述与适用场景 |
| :--- | :--- |
| **expo-gaode-map** | **核心地图能力**。包括地图显示、覆盖物绘制（Marker/Polyline/Polygon）、点聚合 (Cluster)、定位服务及离线地图管理。 |
| **expo-gaode-map-navigation** | **导航与路径规划**。提供驾车/步行/骑行/货车/摩托车路径规划，以及嵌入式导航 UI (`NaviView`)。 |
| **expo-gaode-map-search** | **原生搜索服务**。提供 POI 搜索、周边搜索、沿途搜索、输入提示及逆地理编码。 |
| **expo-gaode-map-web-api** | **Web 服务集成**。纯数据层面的高德 Web 服务接口封装（支持 V5 版路径规划）。 |

---

## 💡 开发者贴士
虽然这些文件主要是给 AI 看的，但如果您需要快速查看某个 API 的正确参数格式，直接查看技能包中的 `references/*.md` 文件也是一种非常高效的学习方式。
