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
town.emitAssetLoadingProgress?.();

// 4. 时钟与昼夜缓冲变量
const clock = new THREE.Clock();
let prevIsNight = null;
let dayNightUpdateElapsed = 0;
let hudTimeUpdateElapsed = 0;
const DAY_NIGHT_UPDATE_INTERVAL = 0.2;
const HUD_TIME_UPDATE_INTERVAL = 0.25;

// 交互按键去抖触发记录
let wasInteractPressed = false;
let currentActiveTrigger = null;
const actionPrompt = document.getElementById('action-prompt');
const promptCache = {
    visible: false,
    id: null,
    label: '',
    verb: '',
};

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

function triggerActiveInteraction(activeTrigger) {
    if (!activeTrigger) return;

    uiManager.triggerInteraction(activeTrigger);
    input.resetInteract();
}

function renderActionPrompt(prompt, labelName, verb, activeTrigger) {
    prompt.replaceChildren();

    const desktopInstruction = document.createElement('span');
    desktopInstruction.className = 'action-prompt-desktop';

    const prefix = document.createElement('span');
    prefix.textContent = `靠近 [${labelName}]，按 `;

    const key = document.createElement('kbd');
    key.textContent = 'E';

    const suffix = document.createElement('span');
    suffix.textContent = ` ${verb}`;

    desktopInstruction.append(prefix, key, suffix);

    const mobileInstruction = document.createElement('span');
    mobileInstruction.className = 'action-prompt-mobile';

    const mobileLabel = document.createElement('span');
    mobileLabel.className = 'mobile-interact-label';
    mobileLabel.textContent = `靠近 [${labelName}]`;

    const mobileButton = document.createElement('button');
    mobileButton.type = 'button';
    mobileButton.className = 'mobile-interact-button';
    mobileButton.textContent = `点击${verb}`;
    mobileButton.setAttribute('aria-label', `与 ${labelName} ${verb}`);
    mobileButton.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        triggerActiveInteraction(activeTrigger);
    });

    mobileInstruction.append(mobileLabel, mobileButton);
    prompt.append(desktopInstruction, mobileInstruction);
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

    hudTimeUpdateElapsed += cappedDeltaTime;
    if (hudTimeUpdateElapsed >= HUD_TIME_UPDATE_INTERVAL) {
        hudTimeUpdateElapsed = 0;
        uiManager.renderHUD('time', gameState);
    }

    dayNightUpdateElapsed += cappedDeltaTime;
    const nextIsNight = gameState.hour >= 19 || gameState.hour < 6;
    if (prevIsNight === null || nextIsNight !== prevIsNight || dayNightUpdateElapsed >= DAY_NIGHT_UPDATE_INTERVAL) {
        dayNightUpdateElapsed = 0;
        engine.updateDayNightCycle(gameState.hour);
        if (nextIsNight !== prevIsNight) {
            prevIsNight = nextIsNight;
            town.updateLights(nextIsNight);
        }
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
    
    if (activeTrigger) {
        const label = getActiveTriggerLabel(activeTrigger);
        const verb = getInteractionVerb(activeTrigger);
        const promptId = activeTrigger.id ?? `${activeTrigger.type}:${label}`;
        const promptChanged = !promptCache.visible
            || promptCache.id !== promptId
            || promptCache.label !== label
            || promptCache.verb !== verb;

        if (promptChanged) {
            actionPrompt.classList.remove('hidden');
            renderActionPrompt(actionPrompt, label, verb, activeTrigger);
            uiManager.setActiveWorldCue(activeTrigger);
            promptCache.visible = true;
            promptCache.id = promptId;
            promptCache.label = label;
            promptCache.verb = verb;
        }

        if (input.keys.interact && !wasInteractPressed) {
            triggerActiveInteraction(activeTrigger);
        }
    } else if (promptCache.visible) {
        actionPrompt.classList.add('hidden');
        uiManager.setActiveWorldCue(null);
        uiManager.activeTrigger = null;
        promptCache.visible = false;
        promptCache.id = null;
        promptCache.label = '';
        promptCache.verb = '';
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
            mode: player.activeCameraMode,
            radius: round(player.activeCameraRadius),
            pitch: round(player.activeCameraPitch),
            lookAtHeight: round(player.activeLookAtHeight),
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
            total: town.totalAssetCount,
            runtimeGroups: town.runtimeAssetGroups.length,
        },
        collision: town.getCollisionDiagnostics(),
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
    getCollisionDiagnostics() {
        return town.getCollisionDiagnostics();
    },
    checkCollision(x, z, radius = player.radius) {
        return physics.checkCollision(x, z, radius);
    },
};

animate();
