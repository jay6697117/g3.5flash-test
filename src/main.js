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
let currentActiveTrigger = null;

function formatFarmTriggerLabel(trigger) {
    const plot = farmSystem.plots[trigger.plotIndex];
    const labelPrefix = `农田地块 #${trigger.plotIndex + 1}`;
    if (plot.state === 'EMPTY') return `${labelPrefix} (闲置，按 E 播种)`;
    if (plot.state === 'PLANTED') return `${labelPrefix} (已播种，按 E 浇水)`;
    if (plot.state === 'GROWING') return `${labelPrefix} (生长中)`;
    if (plot.state === 'MATURE') return `${labelPrefix} (已成熟，按 E 收割)`;
    return labelPrefix;
}

function getInteractionVerb(activeTrigger) {
    if (activeTrigger?.type === 'npc') return '交谈';
    return '互动';
}

function renderActionPrompt(prompt, labelName, verb) {
    prompt.replaceChildren();

    const prefix = document.createElement('span');
    prefix.textContent = `靠近 [${labelName}]，按 `;

    const key = document.createElement('kbd');
    key.textContent = 'E';

    const suffix = document.createElement('span');
    suffix.textContent = ` ${verb}`;

    prompt.append(prefix, key, suffix);
}

function getActiveTriggerLabel(activeTrigger) {
    if (!activeTrigger) return '';
    if (activeTrigger.type === 'farm_plot') {
        return formatFarmTriggerLabel(activeTrigger);
    }
    return activeTrigger.label;
}

function stepGame(deltaTime) {
    const cappedDeltaTime = Math.min(0.05, Math.max(0, deltaTime));

    // Advance simulation state.
    gameState.tick(cappedDeltaTime);
    
    // Sync world lighting with the game clock.
    engine.updateDayNightCycle(gameState.hour);
    
    const isNight = engine.isNight;
    if (isNight !== prevIsNight) {
        prevIsNight = isNight;
        town.updateLights(isNight);
    }
    
    taxi.update(cappedDeltaTime);
    
    farmSystem.update(cappedDeltaTime);
    
    if (taxi.state === 'RIDING') {
        player.mesh.position.copy(taxi.mesh.position);
        player.updateCamera();
    } else {
        const speedMultiplier = (gameState.satiety > 0) ? 1.0 : 0.5;
        player.update(cappedDeltaTime, input, speedMultiplier);
    }
    
    const px = player.mesh.position.x;
    const pz = player.mesh.position.z;
    const activeTrigger = physics.checkTriggers(px, pz);
    currentActiveTrigger = activeTrigger;
    
    const prompt = document.getElementById('action-prompt');
    
    if (activeTrigger) {
        prompt.classList.remove('hidden');
        renderActionPrompt(prompt, getActiveTriggerLabel(activeTrigger), getInteractionVerb(activeTrigger));
        uiManager.setActiveWorldCue(activeTrigger);
        
        if (input.keys.interact && !wasInteractPressed) {
            uiManager.triggerInteraction(activeTrigger);
            input.resetInteract();
        }
    } else {
        prompt.classList.add('hidden');
        uiManager.setActiveWorldCue(null);
        uiManager.activeTrigger = null;
    }
    
    wasInteractPressed = input.keys.interact;
}

function renderFrame() {
    engine.render();
}

function animate() {
    requestAnimationFrame(animate);
    stepGame(clock.getDelta());
    renderFrame();
}

function round(value) {
    return Number(value.toFixed(2));
}

function renderGameToText() {
    const payload = {
        mode: document.getElementById('welcome-screen').classList.contains('hidden') ? 'playing' : 'welcome',
        coordinateSystem: 'Three.js world coordinates, X east-west, Z north-south, Y up.',
        player: {
            x: round(player.mesh.position.x),
            y: round(player.mesh.position.y),
            z: round(player.mesh.position.z),
            visible: player.mesh.visible,
        },
        camera: {
            x: round(engine.camera.position.x),
            y: round(engine.camera.position.y),
            z: round(engine.camera.position.z),
            radius: round(player.cameraRadius),
        },
        activeTrigger: currentActiveTrigger ? {
            id: currentActiveTrigger.id,
            type: currentActiveTrigger.type,
            label: getActiveTriggerLabel(currentActiveTrigger),
            npcId: currentActiveTrigger.npcId ?? null,
        } : null,
        input: {
            joystick: {
                active: input.joystick.active,
                x: round(input.joystick.x),
                y: round(input.joystick.y),
                intensity: round(input.joystick.intensity),
            },
        },
        dialogue: uiManager.getDialogueState(),
        visualAssets: {
            loaded: town.loadedAssetCount,
            failed: town.failedAssetCount,
            runtimeGroups: town.runtimeAssetGroups.length,
        },
        state: {
            day: gameState.day,
            hour: round(gameState.hour),
            coins: gameState.coins,
            satiety: gameState.satiety,
            knowledge: gameState.knowledge,
            activeTask: gameState.activeTask,
        },
        taxi: {
            state: taxi.state,
            destination: taxi.targetDest,
            x: round(taxi.mesh.position.x),
            z: round(taxi.mesh.position.z),
        },
        farm: farmSystem.plots.map((plot) => ({
            index: plot.index,
            state: plot.state,
            seedType: plot.seedType,
            growTime: round(Math.max(0, plot.growTime)),
        })),
        inventory: { ...gameState.inventory },
    };
    return JSON.stringify(payload);
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms) => {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)));
    for (let i = 0; i < steps; i++) {
        stepGame(1 / 60);
    }
    renderFrame();
    return renderGameToText();
};
window.__townGame = {
    stepGame,
    renderFrame,
    renderGameToText,
    setPlayerPosition(x, z) {
        player.mesh.position.set(x, 0, z);
        stepGame(1 / 60);
        renderFrame();
        return renderGameToText();
    },
};

animate();
