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
| 8. Blender GLB asset generation | complete | 已生成并校验 15 个 `assets/models/*.glb`。 |
| 9. Runtime asset loader integration | complete | 已新增 manifest/loader，GLTFLoader 懒加载并克隆 GLB。 |
| 10. Concept scene composition pass | complete | 已加入关键地标 GLB、街角咖啡店、镇民、背景住宅、远景山水、水塔、云、树木和街具。 |
| 11. Concept UI pass | complete | 已改为深绿/金色 HUD、资源条、背包抽屉和出租车按钮视觉。 |
| 12. Final verification loop | complete | `npm run build`、桌面/移动截图、布局检查和玩法回归均已通过。 |

## Final Evidence
- Blender 生成的 15 个 GLB 已保存到 `assets/models/`，并通过 `src/content/assetManifest.js` 接入运行时。
- 最终构建通过，输出包含 GLB 资产和懒加载 `GLTFLoader` chunk；仍保留 Vite 500 kB chunk warning。
- 最终视觉截图：
  - `output/final-visual-check-pass3/desktop.png`
  - `output/final-visual-check-pass3/mobile-390x844.png`
- 最终截图状态：桌面和 390x844 移动端均为 `visualAssets.loaded=50`、`failed=0`、console errors `0`、request failures `0`、overflow `0`、overlaps `0`。
- 最终玩法回归：`output/verification-glb-preview-regression-final.json`，覆盖住宅、超市购买、菜市场、学校测验入口、农田播种/浇水/成熟/收割、出租车前往农场订单，结果 `pass=true`。

## Current Goal Extension 2
继续把项目从“可玩的低模 demo”推进到更接近两张概念图的 3D 小镇 MVP。本轮重点不是继续堆静态 GLB，而是补齐概念图里明显存在、当前缺失的“人物交互与游戏 UI 层次”：
- 增加 NPC 对话触发器，复用现有镇民 GLB，让玩家靠近镇民后可按 `E` 交谈。
- 新增概念图式中心交互提示和对话面板，包含头像、姓名、身份、对白、选项与关闭流程。
- 调整桌面 HUD，使左侧居民面板、任务板、背包板更接近 `ui-style-board.png` 的层级和尺寸；移动端仍保持不遮挡、不溢出。
- `render_game_to_text()` 继续作为验证接口，新增 NPC/对话状态摘要。
- 每轮改完后继续对照 `assets/concepts/town-art-direction.png`、`assets/concepts/ui-style-board.png` 和最新截图，记录差距。

## Extension Phases 2
| Phase | Status | Notes |
| --- | --- | --- |
| 13. NPC dialogue content and triggers | complete | 已定义 4 个 NPC 对话资料，并把现有镇民 GLB 位置注册为可交谈触发器。 |
| 14. Concept interaction UI pass | complete | 已新增中心对话气泡、NPC 对话面板、右上菜单、桌面大型背包板和暖色镜头氛围。 |
| 15. Text-state and regression coverage | complete | `render_game_to_text` 已增加 dialogue/NPC 摘要，Playwright 全量回归通过。 |
| 16. Concept comparison verification | complete | 构建、桌面/移动截图、玩法回归、概念图复看均完成。 |

## Extension 2 Evidence
- 新增 `src/content/dialogueContent.js`，包含 `mayaVendor`、`theoStudent`、`chenDriver`、`linaNeighbor` 四个 NPC 的姓名、身份、对白、话题和任务引导。
- `Town.populateGltfProps()` 现在把现有镇民 GLB 转化为 `npc` trigger；玩家靠近后中心出现交谈提示，按 `E` 可打开对话面板。
- `render_game_to_text()` 已输出 `activeTrigger.npcId` 和 `dialogue` 状态，便于 Playwright 验证 NPC 交互。
- 最终截图：
  - `output/concept-ui-dialogue-final/desktop-default.png`
  - `output/concept-ui-dialogue-final/desktop-dialogue.png`
  - `output/concept-ui-dialogue-final/mobile-default.png`
  - `output/concept-ui-dialogue-final/mobile-dialogue.png`
- 全量玩法回归：`output/concept-ui-dialogue-pass3/report.json`，`pass=true`，26 项检查通过，覆盖 NPC 对话、住宅、超市、菜市场、学校、农田、出租车、桌面/移动布局。
- 最终视觉 smoke：`output/concept-ui-dialogue-final/report.json`，`pass=true`，15 项检查通过，console errors `0`，request/page failures `0`；4 条 console warning 均为 Playwright 截图触发的 WebGL `ReadPixels` 性能提示。
