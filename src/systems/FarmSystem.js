import * as THREE from 'three';

export class FarmSystem {
    constructor(scene, gameState, town) {
        this.scene = scene;
        this.gameState = gameState;
        this.town = town; // 获取土地的坐标
        
        // 4块地的数据状态
        this.plots = Array(4).fill(null).map((_, idx) => ({
            index: idx,
            state: 'EMPTY', // EMPTY, PLANTED (已播种未浇水), GROWING (已浇水成长中), MATURE (已成熟)
            seedType: null,
            growTime: 0,
            totalGrowTime: 0,
            mesh: null,     // 3D 植株模型
            watered: false
        }));
        
        // 作物配置表：生长时间与产出
        this.cropConfig = {
            carrot_seed: { name: '胡萝卜', product: 'carrot', time: 15, color: 0xff7a00 },
            cabbage_seed: { name: '卷心菜', product: 'cabbage', time: 25, color: 0x5ebf75 },
            pumpkin_seed: { name: '南瓜', product: 'pumpkin', time: 35, color: 0xff9900 }
        };
        
        // 粒子系统数组
        this.particles = [];
    }
    
    /**
     * 播种操作
     * @param {number} plotIndex 土地索引 (0-3)
     * @param {string} seedType 种子ID
     */
    plant(plotIndex, seedType) {
        const plot = this.plots[plotIndex];
        if (plot.state !== 'EMPTY') return false;
        
        // 扣除背包中的种子
        if (!this.gameState.removeItem(seedType, 1)) return false;
        
        const config = this.cropConfig[seedType];
        plot.state = 'PLANTED';
        plot.seedType = seedType;
        plot.growTime = config.time;
        plot.totalGrowTime = config.time;
        plot.watered = false;
        
        // 1. 生成幼苗模型 (两片绿叶)
        const sprout = this.createSproutMesh();
        const plotInfo = this.town.plotMeshes[plotIndex];
        sprout.position.set(plotInfo.worldX, 0.2, plotInfo.worldZ);
        sprout.scale.set(0.2, 0.2, 0.2); // 初始极小
        
        this.scene.add(sprout);
        plot.mesh = sprout;
        
        this.gameState.setTask('🌱 种子已播下！快走到地块旁点击“浇水”来催化它成长。');
        return true;
    }
    
    /**
     * 浇水操作 (启动生长，播放粒子)
     * @param {number} plotIndex 土地索引 (0-3)
     */
    water(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.state !== 'PLANTED') return false;
        
        plot.state = 'GROWING';
        plot.watered = true;
        
        // 播放 3D 喷水粒子特效
        const plotInfo = this.town.plotMeshes[plotIndex];
        this.spawnWaterParticles(plotInfo.worldX, plotInfo.worldZ);
        
        this.gameState.setTask('💧 已经成功浇水！作物正在蓬勃生长中，请耐心等候。');
        return true;
    }
    
    /**
     * 收割操作
     * @param {number} plotIndex 土地索引 (0-3)
     */
    harvest(plotIndex) {
        const plot = this.plots[plotIndex];
        if (plot.state !== 'MATURE') return false;
        
        const config = this.cropConfig[plot.seedType];
        
        // 销毁 3D 植株模型
        if (plot.mesh) {
            this.scene.remove(plot.mesh);
            plot.mesh = null;
        }
        
        // 收获成果放入背包
        this.gameState.addItem(config.product, 1);
        
        // 状态清空
        plot.state = 'EMPTY';
        plot.seedType = null;
        plot.watered = false;
        
        this.gameState.setTask(`🧺 成功收获了 1 个美味的[${config.name}]！可以去菜市场卖掉换取金币。`);
        return true;
    }
    
    /**
     * 程序化生成幼苗 3D 模型
     */
    createSproutMesh() {
        const group = new THREE.Group();
        
        // 绿茎
        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.04, 0.04, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x7cfc00, roughness: 0.9 })
        );
        stem.position.y = 0.2;
        stem.castShadow = true;
        group.add(stem);
        
        // 两片小叶子 (微斜的扁盒子)
        const leafMat = new THREE.MeshStandardMaterial({ color: 0x4d8a55, roughness: 0.9 });
        const leafGeo = new THREE.BoxGeometry(0.15, 0.02, 0.25);
        
        const leafL = new THREE.Mesh(leafGeo, leafMat);
        leafL.position.set(-0.08, 0.35, 0);
        leafL.rotation.z = -0.4;
        group.add(leafL);
        
        const leafR = new THREE.Mesh(leafGeo, leafMat);
        leafR.position.set(0.08, 0.35, 0);
        leafR.rotation.z = 0.4;
        group.add(leafR);
        
        return group;
    }
    
    /**
     * 程序化生成成熟作物 3D 模型
     */
    createMatureMesh(seedType) {
        const group = new THREE.Group();
        
        if (seedType === 'carrot_seed') {
            // 胡萝卜 (地里露出半截圆锥)
            const root = new THREE.Mesh(
                new THREE.ConeGeometry(0.3, 1.0, 6),
                new THREE.MeshStandardMaterial({ color: 0xff7a00, roughness: 0.6 })
            );
            root.rotation.x = Math.PI; // 倒扣
            root.position.y = 0.2;     // 露出一半
            root.castShadow = true;
            group.add(root);
            
            // 顶上的胡萝卜叶子
            const leafGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.5);
            const leafMat = new THREE.MeshStandardMaterial({ color: 0x3cb371 });
            for (let i = 0; i < 3; i++) {
                const leaf = new THREE.Mesh(leafGeo, leafMat);
                leaf.position.set(0, 0.7, 0);
                leaf.rotation.z = 0.2 * (i - 1);
                leaf.rotation.x = 0.2 * Math.sin(i);
                group.add(leaf);
            }
        } 
        else if (seedType === 'cabbage_seed') {
            // 卷心菜 (圆滚滚的多面球体)
            const cabbage = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.5, 1),
                new THREE.MeshStandardMaterial({ color: 0x7ccd7c, roughness: 0.8 })
            );
            cabbage.position.y = 0.4;
            cabbage.castShadow = true;
            group.add(cabbage);
            
            // 围在四周的几片大菜叶子 (扁球体截面)
            const outerGeo = new THREE.BoxGeometry(0.8, 0.1, 0.8);
            const outerMat = new THREE.MeshStandardMaterial({ color: 0x458b00, roughness: 0.9 });
            const outer = new THREE.Mesh(outerGeo, outerMat);
            outer.position.y = 0.15;
            outer.rotation.y = 0.5;
            group.add(outer);
        } 
        else if (seedType === 'pumpkin_seed') {
            // 南瓜 (橙色大扁球)
            const pumpkin = new THREE.Mesh(
                new THREE.CylinderGeometry(0.8, 0.8, 0.8, 8),
                new THREE.MeshStandardMaterial({ color: 0xff8c00, roughness: 0.5 })
            );
            pumpkin.scale.set(1.0, 0.7, 1.0); // 压扁
            pumpkin.position.y = 0.35;
            pumpkin.castShadow = true;
            group.add(pumpkin);
            
            // 顶部的一根弯绿柄
            const stem = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.4),
                new THREE.MeshStandardMaterial({ color: 0x8b8b00, roughness: 0.9 })
            );
            stem.position.set(0.1, 0.75, 0);
            stem.rotation.z = 0.3;
            group.add(stem);
        }
        
        return group;
    }
    
    /**
     * 喷洒蓝色水滴粒子
     */
    spawnWaterParticles(x, z) {
        const particleCount = 25;
        const geom = new THREE.BoxGeometry(0.08, 0.08, 0.08);
        const mat = new THREE.MeshBasicMaterial({ color: 0x3399ff, transparent: true, opacity: 0.8 });
        
        for (let i = 0; i < particleCount; i++) {
            const mesh = new THREE.Mesh(geom, mat);
            // 农地中心上方抛洒
            mesh.position.set(
                x + (Math.random() - 0.5) * 1.5,
                1.5 + Math.random() * 0.5,
                z + (Math.random() - 0.5) * 1.5
            );
            
            this.scene.add(mesh);
            
            this.particles.push({
                mesh: mesh,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    -1.0 - Math.random() * 2.0, // 向下坠落速度
                    (Math.random() - 0.5) * 0.8
                ),
                life: 0.6 + Math.random() * 0.4 // 存活时间 (秒)
            });
        }
    }
    
    /**
     * 每帧更新生长倒计时、缩放动画和粒子运动
     * @param {number} deltaTime 帧间隔 (秒)
     */
    update(deltaTime) {
        // 1. 作物生长逻辑
        this.plots.forEach(plot => {
            if (plot.state === 'GROWING') {
                plot.growTime -= deltaTime;
                
                // 生长阶段的缩放：从 0.2 平滑膨胀到 1.0
                const progress = (plot.totalGrowTime - plot.growTime) / plot.totalGrowTime;
                const currentScale = 0.2 + progress * 0.8;
                
                if (plot.mesh) {
                    plot.mesh.scale.set(currentScale, currentScale, currentScale);
                    // 随着成长，稍微增加植物旋转，产生自然有机感
                    plot.mesh.rotation.y += deltaTime * 0.5;
                }
                
                // 成熟状态切换
                if (plot.growTime <= 0) {
                    plot.state = 'MATURE';
                    
                    // 移除幼苗，替换为成熟的 3D 模型
                    if (plot.mesh) {
                        this.scene.remove(plot.mesh);
                    }
                    const matureMesh = this.createMatureMesh(plot.seedType);
                    const plotInfo = this.town.plotMeshes[plot.index];
                    matureMesh.position.set(plotInfo.worldX, 0.18, plotInfo.worldZ);
                    
                    this.scene.add(matureMesh);
                    plot.mesh = matureMesh;
                    
                    this.gameState.setTask(`🎉 农田块 #${plot.index + 1} 的作物已成熟！快过去收割吧！`);
                }
            }
        });
        
        // 2. 粒子物理运算与清理
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= deltaTime;
            
            if (p.life <= 0 || p.mesh.position.y < 0.1) {
                // 寿命到期或落到地面，进行销毁
                this.scene.remove(p.mesh);
                p.mesh.geometry.dispose();
                this.particles.splice(i, 1);
            } else {
                // 加上重力加速度
                p.velocity.y -= deltaTime * 4.0;
                
                // 物理位移
                p.mesh.position.addScaledVector(p.velocity, deltaTime);
            }
        }
    }
}
