# Findings

## Baseline
- 当前项目是 `Three.js ^0.160.0 + Vite ^5.0.0 + vanilla ES Modules`。
- 现有功能已覆盖住宅、超市、菜市场、学校、农田、出租车、昼夜循环和简单碰撞。
- `npm run build` 可通过，当前单个 JS chunk 约 501 kB，后续引入 loader 或资产时需要控制首包。

## Visual Evidence
- 桌面截图显示 WebGL 非空，但场景仍偏程序化原型：大面积平地、建筑细节少、地标识别主要依赖 UI 文案。
- 移动端 390x844 截图显示顶部 HUD 横向溢出，任务卡、交互提示、背包和打车按钮同时占用大量视野。

## Architecture
- 当前主循环在 `src/main.js` 内直接执行所有状态更新、交互检测和渲染，不利于测试复用。
- 当前没有 `window.render_game_to_text`，Playwright 只能依赖截图，无法稳定断言玩法状态。
- 当前没有项目自身的 `window.advanceTime`，skill 脚本可注入 shim，但无法保证与真实游戏循环一致。

## UI And Safety
- `src/ui/UIManager.js` 多处使用 `innerHTML` 动态插入商品、背包、种子和提示内容。
- 这些数据当前大多来自本地常量，短期风险可控，但后续接入外部内容或存档时会扩大 XSS 面。
- 已实现后，`rg innerHTML src index.html` 无匹配，动态 UI 改为 DOM API 构建。

## Implementation Evidence
- `npm run build` 通过；构建后 JS chunk 约 507 kB，gzip 约 132 kB，仍有 Vite 500 kB chunk warning。
- 新增 `src/content/townContent.js` 保存材质 token、地标和街道家具数据。
- `src/main.js` 已暴露 `window.render_game_to_text()` 与 `window.advanceTime(ms)`。
- 最终 `npm run build` 通过；JS chunk 约 507.86 kB，gzip 约 132.45 kB，仍保留 Vite 500 kB chunk warning。
- 桌面 Playwright 验证生成 `output/verification-desktop/state-*.json`，未产生 `errors-*.json`。
- 移动 390x844 验证生成 `output/verification-mobile-fixed.png`，盒模型检查无横向溢出、无可见控件重叠。
- 玩法回归生成 `output/verification-regression.json`，覆盖住宅、超市购买、菜市场弹窗、学校答题入口、农田生命周期和出租车呼叫，errors 为空。
- GLB 扩展阶段新增 `scripts/generate_town_glb_assets.py`，使用本机 Blender 导出 15 个 `assets/models/*.glb`，包括住宅、超市、学校、市集、街角咖啡店、镇民、出租车、树木、街具、云、水塔和远景山水。
- Runtime GLB 接入集中在 `src/content/assetManifest.js` 与 `src/render/loaders/AssetLoader.js`，场景代码通过 key 克隆模型，不直接散落 hashed build 文件名。
- `render_game_to_text()` 已包含 `visualAssets.loaded/failed/runtimeGroups`，最终预览状态为 `loaded=50`、`failed=0`、`runtimeGroups=50`。
- 最终 `npm run build` 通过；构建输出包含 15 个 GLB 资产、懒加载 `GLTFLoader` chunk 和主应用 chunk，仍有 Vite 500 kB chunk warning。
- 最终桌面视觉验收：`output/final-visual-check-pass3/desktop.png` 与对应 JSON 显示 WebGL 非空、`loaded=50`、`failed=0`、console errors `0`、request failures `0`、overflow `0`、overlaps `0`。
- 最终移动视觉验收：`output/final-visual-check-pass3/mobile-390x844.png` 与对应 JSON 显示 390x844 下 HUD、任务、背包和出租车按钮无溢出、无重叠。
- 最终玩法回归：`output/verification-glb-preview-regression-final.json`，`pass=true`，14 项断言覆盖住宅休息、超市购买、菜市场弹窗、学校测验入口、农田播种/浇水/成熟/收割、出租车农场订单。
- 最终概念图对照结论：当前画面已从空旷低模路口推进为有街角咖啡店、市集摊位、镇民、出租车、花箱、长椅、远景湖面和深绿/金色 HUD 的 3D 小镇 MVP；与概念图相比仍属于低模 MVP，而不是照片级/高密度成品资产。

## External Guidance Applied
- Game Studio 方向：3D 项目继续走 vanilla Three.js，DOM 负责 HUD 和菜单，场景保持低干扰 UI。
- Three.js 方向：显式处理 renderer 色彩、tone mapping、resize，后续 GLB 资产应通过 manifest 和 loader 边界接入。
- 3D 资产方向：本轮预留 GLB/glTF 规范，不把 raw DCC export 或未优化资产直接作为运行时契约。

## Current Concept Gap
- `assets/concepts/ui-style-board.png` 的核心界面不是简单状态条，而是左侧大头像状态板、左侧任务/菜单板、底部大背包板、中心人物交互提示和醒目的出租车按钮共同构成的游戏 HUD。
- 当前实现已有左侧居民卡、任务卡、背包和出租车按钮，但缺少 NPC 交谈、中心人物提示、对话选择面板；背包在桌面端仍偏小，视觉权重低于概念图。
- `assets/concepts/town-art-direction.png` 强调街道、市集、镇民和可互动小镇生活；当前已有镇民 GLB，但镇民只是装饰，尚未形成“可交谈居民”玩法。
- 因此本轮最高收益不是新增更多建筑 GLB，而是把已有镇民资产转化为可交互 NPC，并把 HUD 改成更接近概念图的游戏 UI 层级。

## Extension 2 Implementation Evidence
- NPC 对话系统已落地在 `src/content/dialogueContent.js`、`src/entities/Town.js`、`src/ui/UIManager.js`、`src/main.js`：镇民 GLB 不再只是装饰，玩家靠近后可通过 `npc` trigger 打开对话。
- UI 已新增中心交谈气泡、对话面板、右上菜单按钮、桌面大背包板、左侧任务板下移、统一金色按钮焦点态，以及轻量暖色镜头氛围。
- `render_game_to_text()` 已包含 `activeTrigger.npcId` 与 `dialogue`，最终验证能稳定断言 NPC 可发现、可打开、话题选择能更新任务。
- `output/concept-ui-dialogue-pass3/report.json` 为全量回归证据：26 项检查通过，桌面/移动 `visualAssets.loaded=50`、`failed=0`，console errors `0`，page/request failures `0`。
- `output/concept-ui-dialogue-final/report.json` 为最后视觉微调后的 smoke 证据：15 项检查通过，桌面/移动默认与对话态都无溢出、无可见 HUD 重叠。
- 概念图对照结论：UI 层级已明显接近 `ui-style-board.png`，具备左侧居民板、任务板、底部背包板、右上资源/菜单、中心 NPC 交互和出租车按钮；3D 场景仍是低模 MVP，不是 `town-art-direction.png` 那种高密度成品级建模与材质。

## Extension 3 Implementation Evidence
- Blender 管线已从 15 个 GLB 扩展到 19 个 GLB，新增咖啡露台、市场装饰、水岸亭子和住宅庭院；`file` 检查均为 glTF binary model version 2。
- 新增资产已通过 `src/content/assetManifest.js` 统一接入，`Town.buildGltfScenePass()` 将它们布置在默认镜头可见的街角、市场、住宅和湖岸位置。
- 默认相机从更陡的俯视调整为更低的斜俯视，提升建筑立面、水岸亭和远景层次的可见性。
- `output/asset-density-regression/report.json` 证明新增资产后核心玩法仍通过：NPC 对话、住宅、超市、菜市场、学校、农田生命周期、出租车、桌面/移动布局均通过。
- 最新 runtime 视觉资产摘要为 `loaded=58`、`failed=0`、`runtimeGroups=58`；相比上一轮 `loaded=50`，实际运行时资产密度提升 8 个 placement。

## Extension 3 Mobile Control Findings
- 移动端无法走动的根因是输入层只有键盘状态：`src/core/Input.js` 只监听 WASD/方向键，`src/entities/Player.js` 只消费这些布尔值。
- 最小风险方案是给 `Input` 增加 pointer-based 浮动摇杆状态，再让 `Player.update()` 把摇杆向量叠加到现有相机相对移动向量。
- HUD 容器 `#game-hud` 本身是 `pointer-events: none`，但内部按钮/面板是 `pointer-events: auto`；摇杆触发必须过滤按钮、背包、顶部栏、任务板、对话面板、弹窗和出租车过渡遮罩。
- 390x844 验证显示摇杆在左半屏空白区域出现并移动角色，释放后 `input.joystick.active=false`；背包和出租车按钮保持可点击且无布局重叠。

## Extension 4 Performance Audit Initial Findings
- 当前已知最大性能信号：Vite 构建一直存在主 JS chunk 超过 500 kB 的 warning；这是 Deno Deploy 后首屏解析/编译成本和弱网下载成本的主要候选风险。
- 当前已知正面信号：GLTFLoader 已经是单独懒加载 chunk，运行时 GLB 资产曾验证 `visualAssets.loaded=50`、`failed=0`，说明资产管线功能正确。
- 本轮需要同时看本地代码结构、dist 产物、线上 URL 网络请求/控制台、移动端运行表现、Deno Deploy 静态缓存策略，最后输出不牺牲画面和交互体验的优化路线。
- `package.json` 只有 `three` 运行依赖和 `vite` 开发依赖，脚本为 `dev/build/preview`；仓库中未发现 `vite.config.*`、`deno.json` 或 `deno.jsonc`，说明当前主要依赖 Vite 默认构建和 Deno Deploy 默认静态交付行为。
- 当前 `dist/assets/index-C_4w7fNW.js` 约 565KB，`GLTFLoader` 独立 chunk 约 44KB，CSS 约 19KB；模型源文件和构建后 GLB 单个最大约 190KB，整体不是超大资产，但请求数量较多。
- `src/main.js` 的 `animate()` 无条件 `requestAnimationFrame`，每帧执行 `stepGame()` 和 `engine.render()`；`stepGame()` 已把 delta 限制在 50ms，能降低后台恢复后的物理跳变，但仍会在静止状态持续消耗 CPU/GPU。
- `src/core/Engine.js` 使用 `antialias: true`、`setPixelRatio(Math.min(devicePixelRatio, 2))`、`PCFSoftShadowMap`；画质较好，但移动端高 DPR 和软阴影是潜在掉帧风险。
- `src/render/loaders/AssetLoader.js` 已缓存每个 key 的 GLB Promise 并 clone 场景，避免重复下载；但 clone 后遍历所有 mesh 并默认开启 cast/receive shadow，会放大渲染成本。
- `src/entities/Town.js` 的 `buildGltfScenePass()` 对主要模型使用 `Promise.all` 并行加载，随后 `populateGltfProps()` 继续放置树、长椅、花箱、镇民和云；体验上能尽快补齐画面，但 Deno Deploy 首屏会同时触发多 GLB 请求。
- `src/content/assetManifest.js` 共声明 19 个 GLB 模型 key；运行时通过复用/clone 扩展到约 50 个可见资产。最大单体模型约 190KB，优化重点不是删除画面资产，而是缓存、压缩、预加载优先级和阴影/像素比自适应。
- 线上根 HTML 当前引用 `/assets/index-BCJRmduO.js` 与 `/assets/index-pAsdCGmH.css`，而本地 `dist` 已生成新的 `/assets/index-C_4w7fNW.js` 与 `/assets/index-Bfa6Z-6P.css`；说明线上部署仍是上一版或边缘缓存尚未刷新。
- 线上 GET 复查：根 HTML、JS、CSS 均返回 200，`server: deno/deployd`，`cache-control: s-maxage=31536000`，`age≈1387s`；HEAD 对 asset 返回 405，不能用 HEAD 单独判断资源失败。
- 当前线上 HTML 长缓存是部署更新体验风险：如果 index 和 hashed assets 缓存策略不区分，用户可能在更新窗口拿到旧入口或跨版本资源，导致“别人看到旧版本/资源加载异常”的问题。
- Context7 查询 Deno Deploy 当前文档：静态应用可在 `deno.jsonc` 配置 `deploy.runtime.type="static"`、`cwd="./dist"`、`spa=true`；内容 hash 的稳定资产适合 `Cache-Control: public, s-maxage=31536000, immutable`，并可配合 `Deno-Cache-Id` 做内容寻址缓存。
- agent-browser 桌面线上探测：`?autostart=1` 可进入游戏，`render_game_to_text()` 存在，`visualAssets.loaded=58`、`failed=0`；导航完成约 1881ms，资源数 22，主 JS decoded 约 575KB/encoded 约 139KB，是首屏最大单体成本。
- agent-browser 移动 390x844、DPR 3 探测：页面可用，5 秒 rAF 粗测平均帧间隔约 18.21ms，约 55 FPS，P95 约 25ms，长帧 2 次，HUD overflow 为空；说明线上不是必然卡死，但移动端高 DPR + 阴影仍有掉帧余量不足风险。
- DevTools 线上网络面板：23 个请求全部 200，无 console messages；请求链为 HTML → 主 JS → GLTFLoader → 19 个 GLB，网络依赖洞察给出的最大关键路径约 2043ms。
- DevTools trace：LCP 约 790ms，TTFB 约 226ms，元素渲染延迟约 563ms，CLS 0.01；首屏 Web 指标良好，但 LCP 元素只是 DOM 文本，不代表 WebGL 场景完全加载完成。
- DevTools cache 洞察认为 JS/CSS 浏览器 TTL 为 0，因为线上响应只有 `s-maxage=31536000`，没有浏览器端 `max-age`/`immutable`；这会影响普通浏览器重复访问缓存收益。
- 本地最新 `dist/assets`：22 个文件合计约 1.64MB；JS 2 个原始约 624KB、gzip 估算约 164KB；CSS 原始约 19.5KB；19 个 GLB 原始约 998KB、gzip 估算约 82KB。GLB 由 Blender 低模几何生成，文本/JSON式内容可高度压缩。
- 线上压缩响应头抽样显示 JS、GLB 都有 `content-encoding: br`，GLB MIME 为 `model/gltf-binary`；压缩和 MIME 本身没有明显错误。

## Extension 5 Visual And Runtime Findings
- 本轮 Blender 管线已从 19 个 GLB 扩展到 22 个 GLB，新增 `main-street-row.glb`、`street-detail-kit.glb`、`foreground-garden.glb`，`file` 校验均为 glTF binary model version 2。
- `src/content/assetManifest.js` 已集中接入三个新 key；`Town.buildGltfScenePass()` 增加 6 个 runtime placement，默认运行态从 `loaded=58` 提升到 `loaded=64`，`failed=0`。
- `output/street-facade-pass5/desktop-default.png` 与 `mobile-default.png` 证明新增街道细节已可见：更多花箱、路灯、摊位、人物和街角构件进入默认画面。
- `output/street-facade-regression/report.json` 为玩法回归证据：21 项检查通过，覆盖 NPC 对话、住宅休息、超市购买、菜市场弹窗、学校测验入口、农田播种/浇水/成熟/收割、出租车订单。
- 概念图对照结论：UI 与 `ui-style-board.png` 的色彩、面板层级和移动端低干扰布局已接近；3D 与 `town-art-direction.png` 的差距继续集中在默认镜头偏高、近景建筑立面不够占画面、出租车/人物/商铺的中心叙事焦点仍不够强。

## Extension 6 Focus Findings
- 本轮按用户要求只处理两个范围：`advanceTime()` 推进到夜间触发的 `Town.updateLights()` 崩溃，以及默认画面继续贴近 `assets/concepts/town-art-direction.png`。
- 夜间崩溃根因集中在 `src/entities/Town.js:992-997`：`windowMaterials` 中保存的是 `MeshStandardMaterial` clone，但夜间调用 `mat.copy(this.materials.windowOn)`，而 `windowOn` 当前是 `MeshBasicMaterial`。不同材质类之间 copy 会留下不兼容字段，后续 Three.js 渲染读颜色/emissive 通道时可能出现 `Cannot read properties of undefined (reading 'r')`。
- 当前 `output/opening-composition-pass6/desktop-default.png` 已有街具和人物，但与概念图相比仍偏高俯视和路面/空地占比过大；默认第一视觉锚点应更靠近前景房屋立面、商铺、市集、人物和出租车。

## Extension 6 Street Cleanup Findings
- 当前项目是原生 `Three.js + Vite`，本轮应按 `game-studio:three-webgl-game` 处理；没有 React app shell，不应迁移到 React Three Fiber。
- 主路规则来自 `Town.buildRoads()`：南北主路占 `x=-4..4`，东西主路占 `z=-4..4`；人行道在主路外侧约 `4.2..6.6`。
- `Town.buildGltfScenePass()` 中 `marketStall` at `[0,-12]`、`streetDetailKit` at `[-2.4,-8.2]`、`townsperson` at `[-6.7,-14.2]` 附近形成开场道路视觉杂乱；其中前两者直接落在南北主路区域。
- `getGltfPropPlacements()` 中大量 `bench`、`planter`、`townsperson` 只有视觉 placement，没有统一阻挡碰撞；程序化 `buildStreetFurniture()` 也没有给 benches、planters、signposts 注册碰撞盒。
- 最小风险方案是保留现有 Three.js 资产管线，在 placement config 上集中补 `collider`，同时新增道路占用调试摘要，而不是引入 Rapier 或重写场景系统。
- 修复后 `render_game_to_text()` 增加 `collision` 摘要；`output/street-cleanup-collision-pass/report.json` 显示桌面运行态 `loaded=70`、`failed=0`、`colliders=130`、`roadOccupancyIssues=[]`。
- 夜间推进验证覆盖 `window.advanceTime(150000)`，游戏时间到 `22.15`，`Town.updateLights()` 没有复现材质崩溃，道路占用仍为 `[]`。
- 移动端 390x844 验证 `output/street-cleanup-collision-pass/mobile-report.json` 显示 `pass=true`、`scrollWidth=390`、`overflow=[]`。

## Extension 7 Mobile Talk Findings
- 用户截图指出移动端红框里的“靠近 NPC，按 E 交谈”不适合触屏玩家；本轮目标是同一 NPC trigger 下桌面保留键盘 E，移动端改用可触摸按钮。
- 既有项目已实现移动摇杆和 NPC 对话状态，因此最小风险方向应复用现有 activeTrigger/dialogue 打开链路，不新建一套 NPC 交互系统。
- 代码定位结果：`src/main.js` 渲染 `#action-prompt` 并监听 `input.keys.interact`，`src/ui/UIManager.js` 的 `triggerInteraction()`/`openNpcDialogue()` 是交谈入口，`src/style.css` 的移动端 media query 控制提示位置。
- 实现后桌面仍显示“靠近 [... ]，按 E 交谈”；移动端 390x844 显示“靠近 [...]”和可点击按钮“点击交谈”，按钮 `aria-label` 为“与 Maya 菜市场摊主 交谈”。
- 验证结果：`npm run build` 通过；桌面按 `KeyE` 可打开 Maya 对话；移动端点击 `.mobile-interact-button` 后 `dialogue.isOpen=true`、`npcId=mayaVendor`，并且 `documentElement.scrollWidth=390` 无横向溢出。

## Extension 8 Mobile Follow Camera Findings
- 用户反馈移动端行走时角色经常被高大建筑挡住；本轮目标是移动端更高俯拍的跟随相机，优先解决可见性，不改变桌面端视觉构图。
- 预计最小风险方案是在现有 `Player.updateCamera()` 参数层做移动端特化，而不是引入第二套相机控制器。
- 相机定位结果：`src/entities/Player.js` 构造函数中当前参数是 `cameraYaw=-0.72`、`cameraPitch=0.34`、`cameraRadius=16.4`；`updateCamera()` 每帧用这些参数算相机偏移并 `lookAt` 玩家头顶。移动端可在这里选择更高 pitch、更大 radius、稍高 lookAt。
- 移动端检测已有先例：`src/core/Engine.js` 使用 `matchMedia('(max-width: 768px), (pointer: coarse)')` 调整 DPR/阴影。相机也应使用同一类 viewport/coarse pointer 判断，保持桌面端不变。
