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

## Current Goal Extension
把当前低模 demo 继续推进到接近 `assets/concepts` 两张概念图的 MVP 观感：
- 使用本机 Blender 批量生成 runtime GLB 资产，保存到 `assets/models/`。
- 通过 manifest 和 GLTFLoader 接入，不把文件名散落在场景代码里。
- 用 GLB 替换或覆盖关键地标：住宅、超市、学校、菜市场摊位、出租车、背景水塔/山体/云、树木与街道家具。
- 保留当前碰撞、触发器、状态系统和 DOM UI，不重写玩法系统。
- 验证仍以 `npm run build`、Playwright 截图、`render_game_to_text` 和关键玩法回归为准。
- 每轮美术资产或 GLB 效果改动后，必须查看 `assets/concepts/town-art-direction.png`、`assets/concepts/ui-style-board.png` 与最新游戏截图，并记录差距后继续优化。

## Extension Phases
| Phase | Status | Notes |
| --- | --- | --- |
| 8. Blender GLB asset generation | complete | 已生成并校验 13 个 `assets/models/*.glb`。 |
| 9. Runtime asset loader integration | complete | 已新增 manifest/loader，GLTFLoader 懒加载并克隆 GLB。 |
| 10. Concept scene composition pass | complete | 已加入关键地标 GLB、背景住宅、街角商铺、远景山水、水塔、云、树木和街具。 |
| 11. Concept UI pass | complete | 已改为深绿/金色 HUD、资源条、背包抽屉和出租车按钮视觉。 |
| 12. Final verification loop | in_progress | 构建已通过；待桌面、移动、玩法回归和截图验收。 |
