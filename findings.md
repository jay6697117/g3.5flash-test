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

## External Guidance Applied
- Game Studio 方向：3D 项目继续走 vanilla Three.js，DOM 负责 HUD 和菜单，场景保持低干扰 UI。
- Three.js 方向：显式处理 renderer 色彩、tone mapping、resize，后续 GLB 资产应通过 manifest 和 loader 边界接入。
- 3D 资产方向：本轮预留 GLB/glTF 规范，不把 raw DCC export 或未优化资产直接作为运行时契约。
