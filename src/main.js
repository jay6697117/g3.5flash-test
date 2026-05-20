import * as THREE from 'three';
import { Engine } from './core/Engine.js';
import { Input } from './core/Input.js';
import { Physics } from './core/Physics.js';
import { Town } from './entities/Town.js';
import { Player } from './entities/Player.js';
import { Taxi } from './entities/Taxi.js';
import { GameState } from './systems/GameState.js';
import { FarmSystem } from './systems/FarmSystem.js';
import { UIManager } from './ui/UIManager.js';

// 1. 初始化核心管理器
const engine = new Engine('game-canvas');
const physics = new Physics();
const input = new Input();
const gameState = new GameState();

// 2. 初始化世界与实体
const town = new Town(engine.scene, physics);
const player = new Player(engine.scene, physics, engine.camera, engine.canvas);
const taxi = new Taxi(engine.scene, physics);
const farmSystem = new FarmSystem(engine.scene, gameState, town);

// 3. 初始化 UI 控制器
const uiManager = new UIManager(gameState, farmSystem, player, taxi);

// 4. 时钟与昼夜缓冲变量
const clock = new THREE.Clock();
let prevIsNight = null;

// 交互按键去抖触发记录
let wasInteractPressed = false;

// 5. 游戏主循环 (Game Loop)
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = Math.min(0.05, clock.getDelta()); // 限制最大增量，防止切屏时物理穿透
    
    // A. 游戏时间与饱食度推进
    gameState.tick(deltaTime);
    
    // B. 更新昼夜交替与雾气颜色
    engine.updateDayNightCycle(gameState.hour);
    
    // 天黑天亮时触发路灯和窗户发光状态改变
    const isNight = engine.isNight;
    if (isNight !== prevIsNight) {
        prevIsNight = isNight;
        town.updateLights(isNight);
    }
    
    // C. 驱动出租车 NPC 移动与路线运行
    taxi.update(deltaTime);
    
    // D. 驱动农田生长计时与水滴粒子效果
    farmSystem.update(deltaTime);
    
    // E. 玩家移动控制与坐车逻辑
    if (taxi.state === 'RIDING') {
        // 如果正在坐车，让玩家角色贴合出租车位置，并隐身
        player.mesh.position.copy(taxi.mesh.position);
        player.updateCamera(); // 仍然让相机平滑跟随玩家 (即跟随车子移动)
    } else {
        // 正常人行逻辑
        // 根据饱食度状态折算速度 (饱食度为 0 时速度减半)
        const speedMultiplier = (gameState.satiety > 0) ? 1.0 : 0.5;
        player.update(deltaTime, input, speedMultiplier);
    }
    
    // F. 交互范围检测 (触发器)
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const activeTrigger = physics.checkTriggers(px, pz);
    
    const prompt = document.getElementById('action-prompt');
    
    if (activeTrigger) {
        // 进入了可互动的范围
        prompt.classList.remove('hidden');
        
        let labelName = activeTrigger.label;
        // 如果是特定地块，显示地块名字
        if (activeTrigger.type === 'farm_plot') {
            const plot = farmSystem.plots[activeTrigger.plotIndex];
            if (plot.state === 'EMPTY') {
                labelName = `农田地块 #${activeTrigger.plotIndex + 1} (闲置，按 E 播种)`;
            } else if (plot.state === 'PLANTED') {
                labelName = `农田地块 #${activeTrigger.plotIndex + 1} (已播种，按 E 浇水)`;
            } else if (plot.state === 'GROWING') {
                labelName = `农田地块 #${activeTrigger.plotIndex + 1} (生长中)`;
            } else if (plot.state === 'MATURE') {
                labelName = `农田地块 #${activeTrigger.plotIndex + 1} (已成熟，按 E 收割)`;
            }
        }
        
        prompt.innerHTML = `靠近 [${labelName}]，按 <kbd>E</kbd> 互动`;
        
        // 键盘 E 键触发交互 (检测上升沿，防止一直按住)
        if (input.keys.interact && !wasInteractPressed) {
            uiManager.triggerInteraction(activeTrigger);
            input.resetInteract();
        }
    } else {
        // 没靠近任何交互点，隐藏提示
        prompt.classList.add('hidden');
        uiManager.activeTrigger = null;
    }
    
    // 记录按键历史
    wasInteractPressed = input.keys.interact;
    
    // G. 渲染 3D 帧
    engine.render();
}

// 6. 启动游戏主循环
animate();
