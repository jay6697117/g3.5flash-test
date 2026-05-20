import * as THREE from 'three';
import { AssetLoader } from '../render/loaders/AssetLoader.js';

export class Taxi {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // 状态定义：IDLE (巡逻中/等待), FETCHING (去接玩家), RIDING (玩家在车上，去目的地)
        this.state = 'IDLE'; 
        
        this.speed = 15.0; // 出租车速度较快
        this.path = [];     // 路径点数组 Vector3
        this.currentPathIndex = 0;
        
        this.passenger = null;  // 当前载着的玩家对象
        this.targetDest = null; // 目的地 ID
        this.assetLoader = new AssetLoader();
        
        // 各地标在马路上的上下车路点 (保证车停在马路中心，且靠近建筑)
        this.roadWaypoints = {
            home: new THREE.Vector3(-25, 0, 0),
            supermarket: new THREE.Vector3(25, 0, 0),
            market: new THREE.Vector3(-25, 0, 0),
            school: new THREE.Vector3(25, 0, 0),
            farm: new THREE.Vector3(-42, 0, 44)
        };
        
        // 1. 构建出租车 3D 造型
        this.buildMesh();
        this.loadDetailedMesh();
        
        // 2. 初始位置：放置在主干道上
        this.mesh.position.set(-1.5, 0.05, -18.2);
    }
    
    buildMesh() {
        this.mesh = new THREE.Group();
        
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffcc00, roughness: 0.4 }); // 经典出租车黄
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 }); // 轮胎黑
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x334455, transparent: true, opacity: 0.6 });
        this.signMatOn = new THREE.MeshBasicMaterial({ color: 0xffaa00 }); // 顶灯发光
        
        // A. 底盘及车身
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 3.2), bodyMat);
        base.position.y = 0.4;
        base.castShadow = true;
        base.receiveShadow = true;
        this.mesh.add(base);
        
        // B. 车顶舱 (Cab)
        const cab = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 1.8), bodyMat);
        cab.position.set(0, 0.95, -0.1);
        cab.castShadow = true;
        this.mesh.add(cab);
        
        // C. 车窗 (前、后、侧面)
        const frontGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.1), glassMat);
        frontGlass.position.set(0, 0.95, 0.81);
        this.mesh.add(frontGlass);
        
        const backGlass = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 0.1), glassMat);
        backGlass.position.set(0, 0.95, -1.01);
        this.mesh.add(backGlass);
        
        const sideGlassL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 1.4), glassMat);
        sideGlassL.position.set(-0.71, 0.95, -0.1);
        this.mesh.add(sideGlassL);
        
        const sideGlassR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.45, 1.4), glassMat);
        sideGlassR.position.set(0.71, 0.95, -0.1);
        this.mesh.add(sideGlassR);
        
        // D. 四个车轮 (Cylinder)
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 12);
        wheelGeo.rotateZ(Math.PI / 2); // 旋转圆柱体使之贴合轮轴
        
        this.wheels = [];
        const wPositions = [
            [-0.85, 0.35, 1.0],  // 前左
            [0.85, 0.35, 1.0],   // 前右
            [-0.85, 0.35, -1.0], // 后左
            [0.85, 0.35, -1.0]   // 后右
        ];
        
        wPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            this.mesh.add(wheel);
            this.wheels.push(wheel);
        });
        
        // E. TAXI 顶灯
        const signBase = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.1, 0.2), wheelMat);
        signBase.position.set(0, 1.35, -0.1);
        this.mesh.add(signBase);
        
        this.taxilamp = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.15), this.signMatOn);
        this.taxilamp.position.set(0, 1.5, -0.1);
        this.mesh.add(this.taxilamp);
        
        this.scene.add(this.mesh);
        this.primitiveParts = [...this.mesh.children];
    }

    async loadDetailedMesh() {
        try {
            const model = await this.assetLoader.clone('taxiCab');
            model.scale.setScalar(0.95);
            model.position.set(0, 0, 0);
            this.mesh.add(model);
            this.primitiveParts.forEach((part) => {
                part.visible = false;
            });
        } catch (error) {
            console.warn('Failed to load detailed taxi model.', error);
        }
    }
    
    /**
     * 玩家呼叫打车
     * @param {string} fromNode 当前起始点 (对应 roadWaypoints 的 key，或根据玩家坐标就近计算)
     * @param {string} toNode 目的地 (home, supermarket, market, school, farm)
     * @param {object} player 玩家实例
     */
    call(fromNode, toNode, player) {
        this.passenger = player;
        this.targetDest = toNode;
        this.state = 'FETCHING';
        
        const startPoint = this.mesh.position.clone();
        const fetchPoint = this.roadWaypoints[fromNode].clone();
        
        // 生成“接人”路径
        this.path = this.calculateRoute(startPoint, fetchPoint);
        this.currentPathIndex = 0;
        
        // 开启顶灯闪烁指示
        this.taxilamp.material = this.signMatOn;
    }
    
    /**
     * 在十字路网（X=0, Z=0）上计算两点间的直角路线
     */
    calculateRoute(start, end) {
        const route = [];
        
        // 如果起点与终点非常接近，直接一步到位
        if (start.distanceTo(end) < 0.5) {
            route.push(end.clone());
            return route;
        }
        
        // 如果两者不都在同一条轴上，需要经过中心十字路口 (0,0) 进行转接
        // 情况 A: 起点在 Z=0 (东西路)，终点在 X=0 (南北路)
        // 情况 B: 起点在 X=0，终点在 Z=0
        // 如果起点或终点非 0，则我们需要通过十字路口 (0, 0, height) 导航
        
        // 简化寻路：
        // 1. 如果起点不在中心线，先移动到交叉口 (0, 0)
        // 2. 然后移动到终点
        // 注意：我们的 waypoint 已经在 X=0 或 Z=0 上
        
        const intersection = new THREE.Vector3(0, 0.05, 0);
        
        // 检查起点和终点是否在同一条马路上
        const onSameX = Math.abs(start.x - end.x) < 0.5;
        const onSameZ = Math.abs(start.z - end.z) < 0.5;
        
        if (onSameX || onSameZ) {
            // 直行即可
            route.push(end.clone());
        } else {
            // 先去十字中心，再折向终点
            // 为了让折角动作更好看，把十字路口加入路径
            route.push(new THREE.Vector3(0, 0.05, start.z)); // 拐角点
            route.push(intersection.clone());
            route.push(new THREE.Vector3(end.x, 0.05, 0));   // 拐角点2
            route.push(end.clone());
        }
        
        return route;
    }
    
    /**
     * 每帧驱动出租车移动与状态切换
     */
    update(deltaTime) {
        // 闪烁顶灯 (如果是接客或载客状态)
        if (this.state === 'FETCHING' || this.state === 'RIDING') {
            const flash = Math.floor(Date.now() / 200) % 2 === 0;
            this.taxilamp.visible = flash;
        } else {
            this.taxilamp.visible = true;
        }
        
        // 如果处于等待状态 (IDLE)，它可以在街上做随机巡逻，或者静止
        if (this.state === 'IDLE') {
            if (this.path.length === 0) {
                // 偶尔进行随机巡逻
                if (Math.random() < 0.005) {
                    const keys = Object.keys(this.roadWaypoints);
                    const randomDest = keys[Math.floor(Math.random() * keys.length)];
                    const startPoint = this.mesh.position.clone();
                    const endPoint = this.roadWaypoints[randomDest].clone();
                    this.path = this.calculateRoute(startPoint, endPoint);
                    this.currentPathIndex = 0;
                }
            }
        }
        
        // 如果有路径要走
        if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
            const target = this.path[this.currentPathIndex];
            const pos = this.mesh.position;
            
            // 算方向向量 (在 X-Z 平面上)
            const dirX = target.x - pos.x;
            const dirZ = target.z - pos.z;
            const dist = Math.sqrt(dirX * dirX + dirZ * dirZ);
            
            if (dist > 0.2) {
                // 转向目标点
                const targetRotation = Math.atan2(dirX, dirZ);
                
                // 平滑旋转
                let diff = targetRotation - this.mesh.rotation.y;
                diff = Math.atan2(Math.sin(diff), Math.cos(diff));
                this.mesh.rotation.y += diff * 0.2;
                
                // 前进
                const step = this.speed * deltaTime;
                const ratio = Math.min(1.0, step / dist);
                this.mesh.position.x += dirX * ratio;
                this.mesh.position.z += dirZ * ratio;
                
                // 车轮转动动画
                this.wheels.forEach((w, idx) => {
                    // 左右轮子旋转方向一致
                    w.rotation.x += this.speed * deltaTime * 2.0;
                });
            } else {
                // 到达当前路点，走向下一个
                this.currentPathIndex++;
            }
        } else if (this.path.length > 0) {
            // 路径走完了！
            this.path = [];
            this.currentPathIndex = 0;
            
            this.onReachDestination();
        }
    }
    
    /**
     * 到达一段路线的终点
     */
    onReachDestination() {
        if (this.state === 'FETCHING') {
            // 成功接到玩家！
            this.state = 'WAITING_FOR_PASSENGER';
            // 触发事件通知 UI
            const event = new CustomEvent('taxi-arrived');
            window.dispatchEvent(event);
        } else if (this.state === 'RIDING') {
            // 成功把玩家送达目的地！
            this.state = 'IDLE';
            
            // 扣除车费，并让玩家在目的地旁边的路段“下车”
            const event = new CustomEvent('taxi-ride-complete', {
                detail: {
                    destination: this.targetDest
                }
            });
            window.dispatchEvent(event);
            
            this.passenger = null;
            this.targetDest = null;
        }
    }
    
    /**
     * 玩家上车，开启载客阶段
     */
    startRide() {
        if (this.state !== 'WAITING_FOR_PASSENGER') return;
        
        this.state = 'RIDING';
        
        const startPoint = this.mesh.position.clone();
        const destPoint = this.roadWaypoints[this.targetDest].clone();
        
        // 生成“送客”路径
        this.path = this.calculateRoute(startPoint, destPoint);
        this.currentPathIndex = 0;
    }
}
