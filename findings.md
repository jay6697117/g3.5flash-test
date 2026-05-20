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
