import * as THREE from 'three';

export class Player {
    constructor(scene, physics, camera, canvas) {
        this.scene = scene;
        this.physics = physics;
        this.camera = camera;
        this.canvas = canvas;
        
        this.radius = 0.6; // 碰撞半径
        this.speed = 8.0;   // 基础移动速度 (每秒单位)
        
        // 动画变量
        this.walkCycle = 0;
        this.isMoving = false;
        
        // 相机控制状态
        this.cameraYaw = -0.72;
        this.cameraPitch = 0.34;
        this.cameraRadius = 16.4;
        this.desktopLookAtHeight = 1.2;
        this.mobileCameraPitch = 1.08;
        this.mobileCameraRadius = 23.0;
        this.mobileLookAtHeight = 0.65;
        this.activeCameraMode = 'desktop-third-person';
        this.activeCameraPitch = this.cameraPitch;
        this.activeCameraRadius = this.cameraRadius;
        this.activeLookAtHeight = this.desktopLookAtHeight;
        this.isMouseDown = false;
        this.prevMousePosition = { x: 0, y: 0 };
        
        // 1. 构建玩家 3D 造型
        this.buildMesh();
        
        // 2. 绑定鼠标相机控制事件
        this.setupCameraControls();
        this.updateCamera(true);
    }
    
    buildMesh() {
        this.mesh = new THREE.Group();
        this.mesh.position.set(-7.4, 0, -11.8);
        
        // 材质库
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3d7cc9, roughness: 0.5 }); // 蓝色夹克
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.7 }); // 肤色
        const capMat = new THREE.MeshStandardMaterial({ color: 0xd85b5b, roughness: 0.5 });  // 红色帽子
        const limbMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 }); // 灰色手脚
        
        // A. 身体 (Box)
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.4), bodyMat);
        body.position.y = 0.95; // 腿高 0.5 + 身体半高 0.45
        body.castShadow = true;
        body.receiveShadow = true;
        this.mesh.add(body);
        
        // B. 头部 (Box)
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), headMat);
        head.position.y = 1.65; // 身体顶 1.4 + 头部半高 0.25
        head.castShadow = true;
        this.mesh.add(head);
        
        // 眼睛 (2个黑色小方块)
        const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
        eyeL.position.set(-0.15, 1.7, 0.26);
        this.mesh.add(eyeL);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
        eyeR.position.set(0.15, 1.7, 0.26);
        this.mesh.add(eyeR);
        
        // C. 帽子 (红顶)
        const cap = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), capMat);
        cap.position.y = 1.95;
        this.mesh.add(cap);
        const capBrim = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.04, 0.75), capMat); // 帽檐朝前
        capBrim.position.set(0, 1.91, 0.08);
        this.mesh.add(capBrim);
        
        // D. 双腿 (左/右，有独立 Group 方便绕关节旋转)
        this.leftLeg = new THREE.Group();
        this.leftLeg.position.set(-0.2, 0.5, 0); // 关节高度 0.5
        const lLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), limbMat);
        lLegMesh.position.y = -0.25; // 偏移使得中心在顶端
        lLegMesh.castShadow = true;
        this.leftLeg.add(lLegMesh);
        this.mesh.add(this.leftLeg);
        
        this.rightLeg = new THREE.Group();
        this.rightLeg.position.set(0.2, 0.5, 0);
        const rLegMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.16), limbMat);
        rLegMesh.position.y = -0.25;
        rLegMesh.castShadow = true;
        this.rightLeg.add(rLegMesh);
        this.mesh.add(this.rightLeg);
        
        // E. 双臂 (左/右)
        this.leftArm = new THREE.Group();
        this.leftArm.position.set(-0.45, 1.3, 0);
        const lArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), limbMat);
        lArmMesh.position.y = -0.25;
        lArmMesh.castShadow = true;
        this.leftArm.add(lArmMesh);
        this.mesh.add(this.leftArm);
        
        this.rightArm = new THREE.Group();
        this.rightArm.position.set(0.45, 1.3, 0);
        const rArmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.5, 0.14), limbMat);
        rArmMesh.position.y = -0.25;
        rArmMesh.castShadow = true;
        this.rightArm.add(rArmMesh);
        this.mesh.add(this.rightArm);
        
        this.scene.add(this.mesh);
    }
    
    setupCameraControls() {
        // 鼠标右键旋转视角
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 2) { // 右键
                this.isMouseDown = true;
                this.prevMousePosition.x = e.clientX;
                this.prevMousePosition.y = e.clientY;
            }
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;
            
            const dx = e.clientX - this.prevMousePosition.x;
            const dy = e.clientY - this.prevMousePosition.y;
            
            this.cameraYaw -= dx * 0.005;
            this.cameraPitch = Math.max(0.1, Math.min(Math.PI / 2.2, this.cameraPitch + dy * 0.005)); // 限制俯仰角度
            
            this.prevMousePosition.x = e.clientX;
            this.prevMousePosition.y = e.clientY;
        });
        
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                this.isMouseDown = false;
            }
        });
        
        // 阻止右键菜单弹出
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // 滚轮缩放距离
        window.addEventListener('wheel', (e) => {
            this.cameraRadius = Math.max(7.0, Math.min(30.0, this.cameraRadius + e.deltaY * 0.01));
        }, { passive: true });
    }
    
    /**
     * 每帧更新物理移动、动画与第三人称相机跟随
     * @param {number} deltaTime 帧间隔时间 (秒)
     * @param {object} input 键盘输入
     * @param {number} speedMultiplier 速度乘数 (如饱食度低时为 0.5)
     */
    update(deltaTime, input, speedMultiplier = 1.0) {
        let moveX = 0;
        let moveZ = 0;
        const keyboardActive = input.keys.forward || input.keys.backward || input.keys.left || input.keys.right;
        const joystickActive = input.joystick?.active && input.joystick.intensity > 0.02;

        // 1. 根据相机朝向计算移动轴向
        // 相机的水平朝向向量
        const camDirX = Math.sin(this.cameraYaw);
        const camDirZ = Math.cos(this.cameraYaw);

        if (input.keys.forward) {
            moveX -= camDirX;
            moveZ -= camDirZ;
        }
        if (input.keys.backward) {
            moveX += camDirX;
            moveZ += camDirZ;
        }
        if (input.keys.left) {
            moveX -= camDirZ; // 向相机的左侧移动 (垂直正交)
            moveZ += camDirX;
        }
        if (input.keys.right) {
            moveX += camDirZ;
            moveZ -= camDirX;
        }
        if (joystickActive) {
            moveX += input.joystick.y * camDirX + input.joystick.x * camDirZ;
            moveZ += input.joystick.y * camDirZ - input.joystick.x * camDirX;
        }

        // 2. 归一化移动向量，防止对角线移速过快
        const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
        const inputStrength = keyboardActive ? 1 : Math.min(1, length);
        if (length > 0.01) {
            moveX /= length;
            moveZ /= length;

            this.isMoving = true;

            // 计算目标旋转角（面向行进方向），平滑转向
            const targetRotation = Math.atan2(moveX, moveZ);

            // 处理旋转角平滑过渡 (Slerp-like for 1D angle)
            let diff = targetRotation - this.mesh.rotation.y;
            // 规范化差值在 [-PI, PI] 之间
            diff = Math.atan2(Math.sin(diff), Math.cos(diff));
            this.mesh.rotation.y += diff * 0.15;
        } else {
            this.isMoving = false;
        }

        // 3. 执行物理碰撞检测并移动 (X 和 Z 轴分别检测，实现贴墙平滑滑动)
        if (this.isMoving) {
            const currentSpeed = this.speed * speedMultiplier * inputStrength * deltaTime;
            const stepX = moveX * currentSpeed;
            const stepZ = moveZ * currentSpeed;
            
            const nextX = this.mesh.position.x + stepX;
            const nextZ = this.mesh.position.z + stepZ;
            
            // 检测 X 轴移动
            if (!this.physics.checkCollision(nextX, this.mesh.position.z, this.radius)) {
                this.mesh.position.x = nextX;
            }
            // 检测 Z 轴移动
            if (!this.physics.checkCollision(this.mesh.position.x, nextZ, this.radius)) {
                this.mesh.position.z = nextZ;
            }
            
            // 行走周期递增
            this.walkCycle += deltaTime * 12.0;
        } else {
            // 停止时，四肢平滑归位
            this.walkCycle += (0 - this.walkCycle) * 0.1;
        }
        
        // 4. 更新肢体摇摆动画
        const swing = Math.sin(this.walkCycle);
        this.leftLeg.rotation.x = swing * 0.6;
        this.rightLeg.rotation.x = -swing * 0.6;
        this.leftArm.rotation.x = -swing * 0.4;
        this.rightArm.rotation.x = swing * 0.4;
        
        // 身体随走动微弱上下颠簸
        this.mesh.children[0].position.y = 0.95 + Math.abs(swing) * 0.05;
        
        // 5. 第三人称平滑跟随相机
        this.updateCamera();
    }
    
    isMobileCameraViewport() {
        return window.matchMedia('(max-width: 768px), (pointer: coarse)').matches;
    }

    getCameraProfile() {
        if (this.isMobileCameraViewport()) {
            return {
                mode: 'mobile-overhead-follow',
                pitch: this.mobileCameraPitch,
                radius: this.mobileCameraRadius,
                lookAtHeight: this.mobileLookAtHeight,
                lerp: 0.16,
            };
        }

        return {
            mode: 'desktop-third-person',
            pitch: this.cameraPitch,
            radius: this.cameraRadius,
            lookAtHeight: this.desktopLookAtHeight,
            lerp: 0.1,
        };
    }

    updateCamera(snap = false) {
        const cameraProfile = this.getCameraProfile();
        this.activeCameraMode = cameraProfile.mode;
        this.activeCameraPitch = cameraProfile.pitch;
        this.activeCameraRadius = cameraProfile.radius;
        this.activeLookAtHeight = cameraProfile.lookAtHeight;

        const offsetX = cameraProfile.radius * Math.sin(this.cameraYaw) * Math.cos(cameraProfile.pitch);
        const offsetY = cameraProfile.radius * Math.sin(cameraProfile.pitch);
        const offsetZ = cameraProfile.radius * Math.cos(this.cameraYaw) * Math.cos(cameraProfile.pitch);

        const targetCamX = this.mesh.position.x + offsetX;
        const targetCamY = this.mesh.position.y + offsetY;
        const targetCamZ = this.mesh.position.z + offsetZ;

        if (snap) {
            this.camera.position.set(targetCamX, targetCamY, targetCamZ);
        } else {
            this.camera.position.x += (targetCamX - this.camera.position.x) * cameraProfile.lerp;
            this.camera.position.y += (targetCamY - this.camera.position.y) * cameraProfile.lerp;
            this.camera.position.z += (targetCamZ - this.camera.position.z) * cameraProfile.lerp;
        }

        this.camera.lookAt(
            this.mesh.position.x,
            this.mesh.position.y + cameraProfile.lookAtHeight,
            this.mesh.position.z
        );
    }
}
