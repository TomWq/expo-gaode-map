# 如何在 AI 助手中使用技能库

本指南介绍了如何将此技能库与各种 AI 编程助手集成，以实现最佳的开发体验。

## Cursor

### 方法 1：自动索引 (推荐)
Cursor 会自动读取 `.cursor/skills` 目录。你只需在聊天或 Composer 中直接描述你的需求，AI 会自动寻找匹配的技能。

### 方法 2：手动引用
在对话框中使用 `@` 提及特定的技能文件：
- `@SKILL.md`: 获取地图功能的全局概览。
- `@marker-and-clustering.md`: 涉及点聚合开发时引用。
- `@navigation.md`: 涉及路径规划或导航视图时引用。

## Trae

### 方法 1：Agent 模式
Trae 的 Agent 模式具有强大的上下文感知能力。你可以直接说：
> "请根据项目中的地图开发规范，帮我实现一个周边搜索功能。"

Agent 会自动分析 `skills/expo-gaode-map/` 下的相关文件。

## Claude Code (CLI)

### 插件模式
如果你在本地运行 Claude Code，可以将其指向技能目录：
```bash
claude --plugin-dir .cursor/skills/agent-skills
```

## 技能组织结构说明

为了获得最佳结果，请了解技能文件的组织方式：

1. **[SKILL.md](./skills/expo-gaode-map/SKILL.md)**: 顶级入口，定义了 API 的优先级和基本配置。
2. **[USAGE.md](./skills/expo-gaode-map/USAGE.md)**: 用户指南，解释了如何有效地向 AI 提问。
3. **[references/](./skills/expo-gaode-map/references/)**: 原子化的参考文档，每个文件负责一个具体的功能领域（如定位、几何运算等）。

## 最佳提问实践

当请求 AI 帮助时，提供具体的技能上下文可以显著提高代码质量：

**推荐做法：**
- "参考 `@geometry-utils.md`，帮我写一个判断点是否在多边形内的逻辑。"
- "基于 `@navigation.md` 的 `DriveStrategy` 枚举，实现一个路径规划选择器。"

**避免做法：**
- 使用过时的 API 知识，或让 AI 自行猜测 API 签名。
