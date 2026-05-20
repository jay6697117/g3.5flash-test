export class Input {
    constructor() {
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            interact: false
        };
        this.joystick = {
            active: false,
            pointerId: null,
            originX: 0,
            originY: 0,
            x: 0,
            y: 0,
            intensity: 0,
            maxRadius: 54
        };
        this.joystickElement = document.getElementById('movement-joystick');
        this.joystickKnob = document.getElementById('movement-joystick-knob');

        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.setupMobileJoystick();
    }

    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = true;
                break;
            case 'KeyE':
                this.keys.interact = true;
                break;
        }
    }

    handleKeyUp(e) {
        switch (e.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.keys.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.keys.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.keys.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.keys.right = false;
                break;
            case 'KeyE':
                this.keys.interact = false;
                break;
        }
    }

    setupMobileJoystick() {
        if (!this.joystickElement || !this.joystickKnob || !window.PointerEvent) return;

        window.addEventListener('pointerdown', (e) => this.handleJoystickStart(e), { passive: false });
        window.addEventListener('pointermove', (e) => this.handleJoystickMove(e), { passive: false });
        window.addEventListener('pointerup', (e) => this.handleJoystickEnd(e), { passive: false });
        window.addEventListener('pointercancel', (e) => this.handleJoystickEnd(e), { passive: false });
        window.addEventListener('blur', () => this.resetJoystick());
    }

    handleJoystickStart(e) {
        if (!this.canStartJoystick(e)) return;

        this.joystick.active = true;
        this.joystick.pointerId = e.pointerId;
        this.joystick.originX = e.clientX;
        this.joystick.originY = e.clientY;
        this.joystickElement.style.left = `${e.clientX}px`;
        this.joystickElement.style.top = `${e.clientY}px`;
        this.joystickElement.classList.add('active');
        this.joystickElement.setAttribute('aria-hidden', 'false');
        this.updateJoystickVector(e);
        e.preventDefault();
    }

    canStartJoystick(e) {
        if (this.joystick.active || !e.isPrimary) return false;
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return false;
        if (e.clientX > window.innerWidth * 0.58) return false;
        if (this.isGameUiBlockingMovement(e.target)) return false;
        return true;
    }

    isGameUiBlockingMovement(target) {
        const welcome = document.getElementById('welcome-screen');
        const modal = document.getElementById('modal-container');
        const taxiOverlay = document.getElementById('taxi-ride-overlay');
        if (welcome && !welcome.classList.contains('hidden')) return true;
        if (modal && !modal.classList.contains('hidden')) return true;
        if (taxiOverlay && taxiOverlay.classList.contains('visible')) return true;
        if (document.body.classList.contains('dialogue-open')) return true;
        if (!(target instanceof Element)) return false;
        return Boolean(target.closest('button, a, input, textarea, select, [role="button"], #inventory-hud, .hud-header, .task-hud, .resident-card, .npc-dialogue-panel, #btn-call-taxi'));
    }

    handleJoystickMove(e) {
        if (!this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
        this.updateJoystickVector(e);
        e.preventDefault();
    }

    updateJoystickVector(e) {
        const dx = e.clientX - this.joystick.originX;
        const dy = e.clientY - this.joystick.originY;
        const distance = Math.min(this.joystick.maxRadius, Math.hypot(dx, dy));
        const angle = Math.atan2(dy, dx);
        const knobX = Math.cos(angle) * distance;
        const knobY = Math.sin(angle) * distance;

        this.joystick.x = knobX / this.joystick.maxRadius;
        this.joystick.y = knobY / this.joystick.maxRadius;
        this.joystick.intensity = distance / this.joystick.maxRadius;
        this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    }

    handleJoystickEnd(e) {
        if (!this.joystick.active || e.pointerId !== this.joystick.pointerId) return;
        this.resetJoystick();
        e.preventDefault();
    }

    resetJoystick() {
        this.joystick.active = false;
        this.joystick.pointerId = null;
        this.joystick.x = 0;
        this.joystick.y = 0;
        this.joystick.intensity = 0;
        if (this.joystickElement) {
            this.joystickElement.classList.remove('active');
            this.joystickElement.setAttribute('aria-hidden', 'true');
        }
        if (this.joystickKnob) {
            this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
    }

    resetInteract() {
        this.keys.interact = false;
    }
}
