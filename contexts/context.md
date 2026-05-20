# 项目上下文 (Context)

## 项目简介
本项目是一个基于 WebGL/Three.js 实现的 3D 网页模拟小镇。玩家可以控制角色在小镇中进行各种真实的日常活动，如打车、种菜、买菜、上学和超市消费。

## 技术栈 (Technology Stack)
- **3D 渲染**：Three.js (`^0.160.0`)
- **构建工具**：Vite (`^5.0.0`)
- **开发语言**：HTML5, CSS3, ES6+ JavaScript (ES Modules)
- **UI 设计**：毛玻璃风格 (Glassmorphism)，无外部 UI 库，使用 Vanilla CSS 配合 HTML 实现

## 目录结构 (Directory Structure)
- `src/core/`：核心引擎，包括 Three.js 场景渲染 (`Engine.js`)、输入控制 (`Input.js`) 和物理碰撞检测 (`Physics.js`)。
- `src/entities/`：3D 实体，包括玩家角色 (`Player.js`)、出租车 NPC (`Taxi.js`) 和小镇建筑 (`Town.js`)。
- `src/systems/`：系统逻辑，包括全局状态 (`GameState.js`) 和农地种植系统 (`FarmSystem.js`)。
- `src/ui/`：交互界面，包括 DOM 事件管理 (`UIManager.js`) 和样式定义 (`style.css`)。
- `src/main.js`：游戏主循环及整体组装。
- `index.html`：入口网页。

## 开发与注释规范
- 代码中的注释**必须使用中文**。
- UI 界面的交互提示和对话内容**必须使用中文**。
- Git 提交日志应为中文，格式为：`<类型>: <描述>`，如 `feat: 添加打车寻路逻辑`。
