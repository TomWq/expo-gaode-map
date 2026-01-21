# Expo Gaode Map Agent Skills

一套为 AI 编程助手（如 Cursor, Trae, Claude Code）优化的结构化指令库，专注于 `expo-gaode-map` 的开发、优化与维护。

## 核心技能

| 技能 | 描述 |
| --- | --- |
| [expo-gaode-map](./skills/expo-gaode-map/) | 核心高德地图功能指南，包含基础地图、标记聚合、几何运算、导航搜索等。 |

## 快速开始

### 在 Cursor 中使用

1. **自动上下文**：Cursor 会自动索引 `.cursor/skills` 目录下的内容。
2. **显式引用**：在聊天框中使用 `@` 提及相关的技能文件，例如：
   - `@SKILL.md` (主入口)
   - `@map-view-core.md` (地图核心控制)
   - `@geometry-utils.md` (几何计算工具)

### 在 Trae 中使用

1. **Agent 模式**：Trae Agent 会自动读取项目中的技能配置。
2. **上下文关联**：在对话中通过提及具体的技能文件名来引导 Agent。

## 目录结构

- `skills/expo-gaode-map/SKILL.md`: 技能主入口与优先级指南。
- `skills/expo-gaode-map/USAGE.md`: 面向开发者的详细使用指南。
- `skills/expo-gaode-map/references/`: 细分功能模块的详细参考文档。

## 许可证

本项目采用 MIT 许可证。
