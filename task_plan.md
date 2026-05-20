# 3D Town Visual And UI Optimization Plan

## Goal
在当前 `three + vite + vanilla JS` 项目基础上，渐进优化 3D 模拟小镇的美术资产、场景表现、游戏 UI 和自动化验证闭环。

Original prompt: 我想写一个3D模拟小镇，模拟真实世界的小镇，可以购物打车消费上学去超市种菜去菜市场买菜等，先深度思考深入调研，先计划好了再执行。在当前项目基础上进行优化重构。

## Decisions
- 技术栈保持 `Three.js + Vite + ES Modules`，本轮不迁移 TypeScript、React、Rapier 或完整 GLB 资产系统。
- 美术方向为温暖低模写实，优先用程序化几何和局部生成图参考提升当前 MVP。
- UI 改为低干扰 HUD：桌面紧凑化，移动端默认避免顶部溢出和底部控件互相遮挡。
- 自动化验证必须包含 `window.render_game_to_text()` 和 `window.advanceTime(ms)`。

## Phases
| Phase | Status | Notes |
| --- | --- | --- |
| 1. Planning files and baseline evidence | complete | 已确认构建可通过，桌面 WebGL 非空，移动 HUD 溢出。 |
| 2. Runtime hooks and loop boundaries | complete | 已抽出 `stepGame`、`renderFrame`，暴露 `render_game_to_text` 和 `advanceTime`。 |
| 3. Scene art pass | complete | 已补人行道、路缘、过街线、地标铺装、长椅、花箱、指示牌。 |
| 4. Low-chrome responsive UI | complete | 已重写 HUD 响应式布局，移动端背包默认折叠。 |
| 5. Safer DOM rendering | complete | 已移除动态 `innerHTML` 使用，改用 DOM API 和 `textContent`。 |
| 6. Concept assets | complete | 已生成 `assets/concepts/town-art-direction.png` 与 `ui-style-board.png`。 |
| 7. Verification | complete | 构建、桌面 Playwright、移动截图、关键玩法回归均已完成。 |

## Completion Criteria
- `npm run build` 通过。
- Playwright 桌面截图非空，无 console/page errors。
- 390x844 移动截图中顶部状态条不横向溢出，任务、背包、交互提示和打车按钮不重叠。
- `render_game_to_text` 输出可解析 JSON，并包含玩家、相机、触发器、状态、出租车和农田摘要。
- 概念图保存到 `assets/concepts/`。
