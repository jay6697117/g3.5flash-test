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

## Current Goal Extension 3
继续缩小 3D 场景与 `town-art-direction.png` 的差距。本轮重点是默认镜头可见区域的资产密度、近景生活小品和远景水岸层次：
- 使用 Blender 继续生成可复用 GLB，不把新资产写成运行时程序化几何。
- 补充咖啡露台、市场货架/旗帜、住宅庭院、水岸亭子，让默认视角更接近概念图里的“街区生活”密度。
- 把新增 GLB 通过 `assetManifest` 接入，并布置在默认镜头能看到的位置。
- 适度调低默认相机俯视角，露出更多建筑立面与湖岸远景。
- 继续保持玩法回归和移动端布局不破坏。

## Extension Phases 3
| Phase | Status | Notes |
| --- | --- | --- |
| 17. Additional Blender GLB density assets | complete | 已新增 `cafe-terrace`、`market-decor`、`lakeside-gazebo`、`cottage-yard`，总 GLB 源文件从 15 个增至 19 个。 |
| 18. Runtime placement and camera composition | complete | 已接入 manifest，运行时 placement 从 50 增至 58，并微调默认相机为更低的斜俯视。 |
| 19. Density pass verification | complete | 构建、桌面/移动截图、核心玩法回归和概念图复看均完成。 |

## Extension 3 Evidence
- 新增 GLB：
  - `assets/models/cafe-terrace.glb`
  - `assets/models/market-decor.glb`
  - `assets/models/lakeside-gazebo.glb`
  - `assets/models/cottage-yard.glb`
- 最终构建通过，dist 产物包含 19 个 GLB；仍保留 Vite 500 kB 主 chunk warning。
- 最新视觉截图：
  - `output/asset-density-regression/desktop-default.png`
  - `output/asset-density-regression/mobile-default.png`
  - `output/asset-density-camera-pass/desktop-default.png`
- 最新玩法回归：`output/asset-density-regression/report.json`，`pass=true`，17 项检查通过，桌面/移动均为 `visualAssets.loaded=58`、`failed=0`，console errors `0`，request/page failures `0`。
- 概念图对照结论：默认视角比上一轮更接近 `town-art-direction.png` 的生活密度和水岸远景，但整体仍是低模 MVP，未达到概念图级别的高密度建筑材质、真实车辆细节和手工场景布光。

## Current Goal Extension 3
为移动端补齐角色移动能力，同时保留桌面端 WASD/方向键控制：
- 使用左半屏空白区域触发的浮动虚拟摇杆，不固定占用左下角，避免遮挡背包和出租车按钮。
- 摇杆输入接入现有 `Input` 和 `Player.update()` 移动链路，不另写一套移动系统。
- 弹窗、欢迎页、出租车过渡和 NPC 对话打开时禁止摇杆触发，避免误操作。
- `render_game_to_text()` 输出摇杆状态，方便浏览器自动化验证。

## Extension Phases 3
| Phase | Status | Notes |
| --- | --- | --- |
| 17. Input and HUD structure review | complete | WASD/方向键在 `src/core/Input.js`，移动由 `src/entities/Player.js` 消费；HUD 位于 `index.html` 和 `src/style.css`。 |
| 18. Floating mobile joystick implementation | complete | 已新增移动端 pointer 摇杆状态、视觉层和欢迎页说明，并映射到玩家相机相对移动。 |
| 19. Desktop and mobile verification | complete | `npm run build` 通过；桌面 KeyW 模拟移动约 6.11 单位；390x844 触摸摇杆移动约 4.02 单位。 |

## Extension 3 Evidence
- `npm run build` 通过；仍只有既有 Vite 500 kB chunk warning。
- 生产预览 `http://127.0.0.1:4173/?autostart=1` 浏览器验证通过。
- 移动端 390x844 布局检查：水平滚动宽度等于视口宽度，HUD overflow `0`，可见控件 overlaps `0`。
- 弹窗打开时模拟左半屏触摸，`input.joystick.active=false`，说明摇杆不会穿透弹窗误触发。
- 摇杆按住状态截图保存于 `output/mobile-joystick/screenshot-1779263421544.png`。

## Current Goal Extension 4
使用 agent team 全面分析当前项目性能优化点，重点评估部署到 Deno Deploy 后是否会出现卡顿、延迟、首屏慢、资源加载慢或移动端掉帧，并给出不降低用户体验的优化方案。

## Extension Phases 4
| Phase | Status | Notes |
| --- | --- | --- |
| 20. Planning recovery and audit scope | complete | 已恢复现有规划文件；第一次 catchup 因环境变量为空失败，已用 skill 绝对路径重试成功。 |
| 21. Code and asset performance review | complete | 已分析 Vite/Three.js/GLB/主循环/UI 输入层的首包、运行时和内存风险。 |
| 22. Deployed Deno performance probe | complete | 线上可启动；DevTools 无 console error，23 个请求全 200，桌面 LCP 约 790ms，移动 390x844 粗测约 55 FPS。 |
| 23. Deno Deploy delivery and caching review | complete | 发现 HTML 与 assets 当前均为 `s-maxage=31536000`；hashed assets 可长缓存，但 index.html 不应同等长缓存。 |
| 24. Optimization roadmap | complete | 已形成按优先级排序、保持用户体验的性能优化方案。 |

## Extension 4 Evidence
- 线上桌面 `?autostart=1` 可进入游戏，`visualAssets.loaded=58`、`failed=0`。
- Chrome DevTools trace：LCP 约 790ms、TTFB 约 226ms、CLS 0.01、无 console messages、23 个网络请求全 200。
- 网络依赖关键链：HTML → 主 JS → GLTFLoader → 19 个 GLB；最大关键路径约 2043ms。
- 移动 390x844 DPR 3 粗测 5 秒 rAF：约 55 FPS，P95 帧间隔约 25ms，长帧 2 次，无 HUD overflow。
- 当前线上响应已 Brotli 压缩，GLB MIME 为 `model/gltf-binary`；但 browser cache TTL 被 DevTools 识别为 0，因为只有 `s-maxage`，缺少面向浏览器的 `max-age`/`immutable`。
- 本地最新 dist 约 1.64MB：JS 原始约 624KB/gzip 估算约 164KB，19 个 GLB 原始约 998KB/gzip 估算约 82KB。

## Current Goal Extension 5
继续对照 `assets/concepts/town-art-direction.png` 与 `assets/concepts/ui-style-board.png` 缩小 3D 默认观感差距。本轮重点从“资产数量”推进到“开场构图”：
- 新增连续主街店铺立面、路边细节套件和前景花园 GLB，让默认视角更像概念图中的完整街区。
- 保持 GLB 统一由 Blender 脚本生成，运行时仍通过 `assetManifest` 和 `AssetLoader` 接入。
- 验证新增资产不会破坏 NPC 对话、住宅、超市、菜市场、学校、农田和出租车。
- 下一步把默认出生点和相机从高俯视沙盘进一步调整到低一些、近一些的街道视角，让玩家一进游戏就能看到人物交互焦点和近景店铺。

## Extension Phases 5
| Phase | Status | Notes |
| --- | --- | --- |
| 25. Main-street GLB facade assets | complete | 已新增 `main-street-row`、`street-detail-kit`、`foreground-garden`，总 GLB 源文件增至 22 个。 |
| 26. Runtime placement and layout verification | complete | 已接入 manifest 并布置 6 个新增 placement；桌面/移动均加载 `64` 个 runtime groups，`failed=0`。 |
| 27. Gameplay regression after facade pass | complete | 21 项回归通过，覆盖 NPC、住宅、超市、菜市场、学校、农田和出租车。 |
| 28. Opening composition pass | in_progress | 视觉复核显示默认镜头仍偏高俯视，需要继续调整开场玩家位置、相机距离和近景店铺可见性。 |

## Extension 4 Errors Encountered
| Error | Attempt | Resolution |
| --- | --- | --- |
| `CLAUDE_PLUGIN_ROOT` 为空导致 session-catchup.py 路径解析成 `/scripts/session-catchup.py` | 1 | 改用 `/Users/zhangjinhui/.claude/skills/planning-with-files/scripts/session-catchup.py` 绝对路径，恢复检查成功无输出。 |
