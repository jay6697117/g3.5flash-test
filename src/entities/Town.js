import * as THREE from 'three';

export class Town {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // 存储路灯引用以进行昼夜状态更新
        this.streetLights = [];
        
        // 存储材质引用以切换发光
        this.windowMaterials = [];
        
        // 初始化材料库，采用暖色和柔和低饱和度的色彩，确保高级感
        this.materials = {
            ground: new THREE.MeshStandardMaterial({ color: 0x8ebe70, roughness: 0.9, metalness: 0.1 }),
            road: new THREE.MeshStandardMaterial({ color: 0x4f5258, roughness: 0.8 }),
            roadMark: new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 }),
            houseWall: new THREE.MeshStandardMaterial({ color: 0xfdfdfd, roughness: 0.6 }),
            houseRoof: new THREE.MeshStandardMaterial({ color: 0xd85b5b, roughness: 0.5 }), // 红色屋顶
            supermarketWall: new THREE.MeshStandardMaterial({ color: 0x3d6cb9, roughness: 0.5 }), // 深蓝
            supermarketGlass: new THREE.MeshStandardMaterial({ color: 0xa0e0ff, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.9 }),
            marketTent1: new THREE.MeshStandardMaterial({ color: 0x5ebd90, roughness: 0.5 }), // 绿白相间遮阳棚
            marketTent2: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 }),
            wood: new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.9 }),
            schoolBrick: new THREE.MeshStandardMaterial({ color: 0xb14d34, roughness: 0.7 }), // 红砖
            schoolPillar: new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.5 }),
            trunk: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }),
            foliage: new THREE.MeshStandardMaterial({ color: 0x4d8a55, roughness: 0.8 }),
            foliageYellow: new THREE.MeshStandardMaterial({ color: 0xdbb035, roughness: 0.8 }),
            farmSoil: new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 1.0 }), // 土地
            fence: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 }),
            lampPole: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.8 }),
            lampOff: new THREE.MeshStandardMaterial({ color: 0xdddddd }),
            lampOn: new THREE.MeshBasicMaterial({ color: 0xffe677 }), // 晚上发光
            windowOff: new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.3 }),
            windowOn: new THREE.MeshBasicMaterial({ color: 0xffdd66 }) // 晚上窗户亮灯
        };

        // 构建大世界
        this.buildGround();
        this.buildRoads();
        this.buildForest();
        this.buildPlayerHome();
        this.buildSupermarket();
        this.buildMarket();
        this.buildSchool();
        this.buildFarm();
        this.buildStreetLights();
    }
    
    // 1. 构建小镇地基
    buildGround() {
        const groundGeo = new THREE.BoxGeometry(120, 2, 120);
        const ground = new THREE.Mesh(groundGeo, this.materials.ground);
        ground.position.y = -1; // 让表面刚好处于 y=0
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    // 2. 铺设马路 (十字路口 + 环路)
    buildRoads() {
        // 主干道南北向 (宽 8，长 120)
        const roadNSGeo = new THREE.PlaneGeometry(8, 120);
        const roadNS = new THREE.Mesh(roadNSGeo, this.materials.road);
        roadNS.rotation.x = -Math.PI / 2;
        roadNS.position.set(0, 0.01, 0); // 稍微抬高避免闪烁 (Z-fighting)
        roadNS.receiveShadow = true;
        this.scene.add(roadNS);
        
        // 主干道东西向 (宽 120，长 8)
        const roadEWGeo = new THREE.PlaneGeometry(120, 8);
        const roadEW = new THREE.Mesh(roadEWGeo, this.materials.road);
        roadEW.rotation.x = -Math.PI / 2;
        roadEW.position.set(0, 0.01, 0);
        roadEW.receiveShadow = true;
        this.scene.add(roadEW);
        
        // 马路中间的虚线黄线/白线 (做一些路段装饰)
        const lineGeo = new THREE.PlaneGeometry(0.3, 4);
        for (let i = -55; i <= 55; i += 12) {
            if (Math.abs(i) < 8) continue; // 避开中心十字路口
            
            // 南北向虚线
            const markNS = new THREE.Mesh(lineGeo, this.materials.roadMark);
            markNS.rotation.x = -Math.PI / 2;
            markNS.position.set(0, 0.02, i);
            this.scene.add(markNS);
            
            // 东西向虚线
            const markEW = new THREE.Mesh(lineGeo, this.materials.roadMark);
            markEW.rotation.x = -Math.PI / 2;
            markEW.rotation.z = Math.PI / 2;
            markEW.position.set(i, 0.02, 0);
            this.scene.add(markEW);
        }
    }
    
    // 3. 构建玩家住宅 (坐标: -25, -25)
    buildPlayerHome() {
        const x = -25, z = -25;
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        
        // 房屋主体
        const wall = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 6), this.materials.houseWall);
        wall.position.y = 2;
        wall.castShadow = true;
        wall.receiveShadow = true;
        group.add(wall);
        
        // 屋顶 (四棱锥)
        const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 3, 4), this.materials.houseRoof);
        roof.position.y = 5.5;
        roof.rotation.y = Math.PI / 4; // 旋转 45 度对齐屋檐
        roof.castShadow = true;
        group.add(roof);
        
        // 大门
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.2, 0.2), this.materials.wood);
        door.position.set(0, 1.1, 3.01);
        group.add(door);
        
        // 窗户 (左右各一个)
        const winGeo = new THREE.BoxGeometry(1, 1, 0.1);
        const winMat = this.materials.windowOff.clone();
        this.windowMaterials.push(winMat);
        
        const winL = new THREE.Mesh(winGeo, winMat);
        winL.position.set(-1.8, 2.2, 3.01);
        group.add(winL);
        
        const winR = new THREE.Mesh(winGeo, winMat);
        winR.position.set(1.8, 2.2, 3.01);
        group.add(winR);
        
        // 烟囱
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2, 0.8), this.materials.schoolBrick);
        chimney.position.set(1.8, 4.5, -1.8);
        chimney.castShadow = true;
        group.add(chimney);
        
        this.scene.add(group);
        
        // 物理碰撞与交互触发
        this.physics.addCollider({ x, z, width: 7.2, depth: 7.2, label: '玩家住宅' });
        this.physics.addTrigger({
            id: 'home',
            x: x,
            z: z + 4.5,
            radius: 2.5,
            label: '我的家',
            type: 'home'
        });
    }
    
    // 4. 构建罗森超市 (坐标: 25, -25)
    buildSupermarket() {
        const x = 25, z = -25;
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        
        // 建筑主楼
        const main = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 8), this.materials.supermarketWall);
        main.position.y = 3;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        // 玻璃门面 (前方玻璃)
        const glass = new THREE.Mesh(new THREE.BoxGeometry(10, 4.5, 0.2), this.materials.supermarketGlass);
        glass.position.set(0, 2.25, 4.01);
        group.add(glass);
        
        // 门柱和侧框
        const frameL = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 0.5), this.materials.lampPole);
        frameL.position.set(-5.5, 3, 4.1);
        group.add(frameL);
        const frameR = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 0.5), this.materials.lampPole);
        frameR.position.set(5.5, 3, 4.1);
        group.add(frameR);
        
        // 超市招牌 (黄绿色长条)
        const signMat = new THREE.MeshStandardMaterial({ color: 0x3ac5a0, roughness: 0.5 });
        const sign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 0.4), signMat);
        sign.position.set(0, 5.2, 4.1);
        group.add(sign);
        
        // 窗户自发光效果
        const winMat = this.materials.windowOff.clone();
        this.windowMaterials.push(winMat);
        // 超市背面窗户
        const backWin = new THREE.Mesh(new THREE.BoxGeometry(4, 2, 0.2), winMat);
        backWin.position.set(0, 3, -4.01);
        group.add(backWin);
        
        this.scene.add(group);
        
        // 物理碰撞与交互触发
        this.physics.addCollider({ x, z, width: 13, depth: 9, label: '罗森超市' });
        this.physics.addTrigger({
            id: 'supermarket',
            x: x,
            z: z + 5.5,
            radius: 3.0,
            label: '罗森超市',
            type: 'supermarket'
        });
    }
    
    // 5. 构建菜市场 (坐标: -25, 25)
    buildMarket() {
        const x = -25, z = 25;
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        
        // 四根石木柱子
        const pillarGeo = new THREE.CylinderGeometry(0.25, 0.25, 4.5);
        const pillars = [];
        const coords = [
            [-4.5, -3.5], [4.5, -3.5], [-4.5, 3.5], [4.5, 3.5]
        ];
        coords.forEach(coord => {
            const pillar = new THREE.Mesh(pillarGeo, this.materials.wood);
            pillar.position.set(coord[0], 2.25, coord[1]);
            pillar.castShadow = true;
            group.add(pillar);
        });
        
        // 摊位桌子 (2个)
        const tableGeo = new THREE.BoxGeometry(3.5, 1.5, 2.5);
        const tableL = new THREE.Mesh(tableGeo, this.materials.wood);
        tableL.position.set(-2, 0.75, 0);
        tableL.castShadow = true;
        group.add(tableL);
        
        const tableR = new THREE.Mesh(tableGeo, this.materials.wood);
        tableR.position.set(2, 0.75, 0);
        tableR.castShadow = true;
        group.add(tableR);
        
        // 遮阳顶棚 (绿白相间瓦楞纸感，用多个板组合模拟)
        const roofGroup = new THREE.Group();
        roofGroup.position.y = 4.5;
        
        for (let i = -5.5; i <= 5.5; i += 1.1) {
            const mat = (Math.round(i * 10) % 2 === 0) ? this.materials.marketTent1 : this.materials.marketTent2;
            const plank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.3, 8), mat);
            plank.position.x = i;
            plank.castShadow = true;
            roofGroup.add(plank);
        }
        group.add(roofGroup);
        
        this.scene.add(group);
        
        // 物理碰撞与交互触发
        this.physics.addCollider({ x, z, width: 10, depth: 8, label: '菜市场' });
        this.physics.addTrigger({
            id: 'market',
            x: x,
            z: z - 5.5, // 门面向南侧/北侧
            radius: 3.5,
            label: '菜市场回收站',
            type: 'market'
        });
    }
    
    // 6. 构建阳光学院 (坐标: 25, 25)
    buildSchool() {
        const x = 25, z = 25;
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        
        // 主教学楼 (红砖)
        const main = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 10), this.materials.schoolBrick);
        main.position.y = 3.5;
        main.castShadow = true;
        main.receiveShadow = true;
        group.add(main);
        
        // 钟楼 (位于主楼上方正中)
        const tower = new THREE.Mesh(new THREE.BoxGeometry(4, 6, 4), this.materials.schoolBrick);
        tower.position.set(0, 9, 2);
        tower.castShadow = true;
        group.add(tower);
        
        // 钟楼尖顶 (灰色圆锥)
        const towerRoof = new THREE.Mesh(new THREE.ConeGeometry(2.8, 4, 4), this.materials.lampPole);
        towerRoof.position.set(0, 14, 2);
        towerRoof.rotation.y = Math.PI / 4;
        towerRoof.castShadow = true;
        group.add(towerRoof);
        
        // 大钟表盘 (白色圆柱)
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 16), this.materials.fence);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(0, 9.5, 4.05);
        group.add(clock);
        
        // 正门石柱 (罗马柱风格)
        const pillarGeo = new THREE.CylinderGeometry(0.35, 0.4, 6);
        const pL = new THREE.Mesh(pillarGeo, this.materials.schoolPillar);
        pL.position.set(-3.5, 3, 5.2);
        pL.castShadow = true;
        group.add(pL);
        
        const pR = new THREE.Mesh(pillarGeo, this.materials.schoolPillar);
        pR.position.set(3.5, 3, 5.2);
        pR.castShadow = true;
        group.add(pR);
        
        // 正门门廊顶板
        const porch = new THREE.Mesh(new THREE.BoxGeometry(9, 0.8, 2.5), this.materials.schoolPillar);
        porch.position.set(0, 6.2, 4.8);
        porch.castShadow = true;
        group.add(porch);
        
        // 窗户自发光效果
        const winMat = this.materials.windowOff.clone();
        this.windowMaterials.push(winMat);
        
        // 添加正面 4 扇大窗户
        const winGeo = new THREE.BoxGeometry(1.5, 2, 0.2);
        const wCoords = [
            [-5, 4.5], [5, 4.5], [-5, 1.5], [5, 1.5]
        ];
        wCoords.forEach(coord => {
            const w = new THREE.Mesh(winGeo, winMat);
            w.position.set(coord[0], coord[1], 5.01);
            group.add(w);
        });
        
        this.scene.add(group);
        
        // 物理碰撞与交互触发
        this.physics.addCollider({ x, z, width: 15, depth: 11, label: '阳光学院' });
        this.physics.addTrigger({
            id: 'school',
            x: x,
            z: z + 6.5,
            radius: 3.5,
            label: '学校前门',
            type: 'school'
        });
    }
    
    // 7. 构建绿色农田 (坐标: 0, 0)
    buildFarm() {
        const x = 0, z = 0;
        const group = new THREE.Group();
        group.position.set(x, 0, z);
        
        // 1. 农田大底座 (浅黄色泥土底座)
        const soilBase = new THREE.Mesh(new THREE.BoxGeometry(18, 0.2, 18), this.materials.farmSoil);
        soilBase.position.y = 0.05;
        soilBase.receiveShadow = true;
        group.add(soilBase);
        
        // 2. 四块用于播种的深色土沟块
        const plotGeo = new THREE.BoxGeometry(6, 0.15, 6);
        const plotCoords = [
            [-4.5, -4.5], [4.5, -4.5], [-4.5, 4.5], [4.5, 4.5]
        ];
        
        this.plotMeshes = [];
        plotCoords.forEach((coord, idx) => {
            const plot = new THREE.Mesh(plotGeo, new THREE.MeshStandardMaterial({ color: 0x48301d, roughness: 1.0 }));
            plot.position.set(coord[0], 0.16, coord[1]);
            plot.receiveShadow = true;
            group.add(plot);
            
            // 记录每一块农地中心的世界坐标，供种植系统定位蔬菜模型
            this.plotMeshes.push({
                index: idx,
                worldX: x + coord[0],
                worldZ: z + coord[1],
                mesh: plot
            });
            
            // 为每一块土地添加独立的 Trigger，检测范围为 2.8 即可
            this.physics.addTrigger({
                id: `farm_plot_${idx}`,
                plotIndex: idx,
                x: x + coord[0],
                z: z + coord[1],
                radius: 2.8,
                label: `农田块 #${idx + 1}`,
                type: 'farm_plot'
            });
        });
        
        // 3. 周围的围栏 (Low-poly 围栏)
        this.buildFence(group, 18, 18);
        
        // 4. 水井 (用来打水，放在农田边上，坐标: 0, 7.5)
        const wellGroup = new THREE.Group();
        wellGroup.position.set(0, 0, 7.5);
        
        // 井口 (石圈)
        const wellBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.8, 8), this.materials.schoolPillar);
        wellBase.position.y = 0.4;
        wellBase.castShadow = true;
        wellGroup.add(wellBase);
        
        // 井水 (蓝色面)
        const water = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0x2288ff, roughness: 0.1, metalness: 0.9 }));
        water.position.y = 0.75;
        wellGroup.add(water);
        
        // 井架 (两根木柱+顶盖)
        const postL = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2), this.materials.wood);
        postL.position.set(-0.9, 1.5, 0);
        postL.castShadow = true;
        wellGroup.add(postL);
        
        const postR = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.2), this.materials.wood);
        postR.position.set(0.9, 1.5, 0);
        postR.castShadow = true;
        wellGroup.add(postR);
        
        const wellRoof = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.8), this.materials.houseRoof);
        wellRoof.position.set(0, 2.6, 0);
        wellRoof.rotation.z = 0.1; // 微斜
        wellRoof.castShadow = true;
        wellGroup.add(wellRoof);
        
        group.add(wellGroup);
        
        // 水井碰撞体与 Trigger
        this.physics.addCollider({ x: x, z: z + 7.5, width: 2.5, depth: 2.5, label: '水井' });
        
        this.scene.add(group);
        
        // 农田阻挡包围盒 (我们只阻挡围栏外侧，让内侧可通行)
        // 使用 4 个侧面细长长方体做碰撞盒
        this.physics.addCollider({ x: x - 9.1, z: z, width: 0.2, depth: 18.2, label: '农田围栏左' });
        this.physics.addCollider({ x: x + 9.1, z: z, width: 0.2, depth: 18.2, label: '农田围栏右' });
        this.physics.addCollider({ x: x, z: z - 9.1, width: 18.2, depth: 0.2, label: '农田围栏北' });
        // 南侧留下一个 4 宽的缺口不设物理阻挡，方便玩家进出
        this.physics.addCollider({ x: x - 6.5, z: z + 9.1, width: 5, depth: 0.2, label: '农田围栏南左' });
        this.physics.addCollider({ x: x + 6.5, z: z + 9.1, width: 5, depth: 0.2, label: '农田围栏南右' });
    }
    
    buildFence(group, width, depth) {
        const halfW = width / 2;
        const halfD = depth / 2;
        const postGeo = new THREE.BoxGeometry(0.2, 1.2, 0.2);
        const railGeo = new THREE.BoxGeometry(2, 0.1, 0.15);
        
        // 沿四周画栅栏，间隔 2
        const drawEdge = (start, end, axis, constVal, isSouth = false) => {
            for (let val = start; val <= end; val += 2.0) {
                if (isSouth && Math.abs(val) < 3.5) continue; // 南边缺口留给大门
                
                // 柱子
                const post = new THREE.Mesh(postGeo, this.materials.fence);
                if (axis === 'x') {
                    post.position.set(val, 0.6, constVal);
                } else {
                    post.position.set(constVal, 0.6, val);
                }
                post.castShadow = true;
                group.add(post);
                
                // 横栏
                if (val < end) {
                    const rail1 = new THREE.Mesh(railGeo, this.materials.fence);
                    const rail2 = new THREE.Mesh(railGeo, this.materials.fence);
                    
                    if (axis === 'x') {
                        rail1.position.set(val + 1, 0.9, constVal);
                        rail2.position.set(val + 1, 0.4, constVal);
                    } else {
                        rail1.position.set(constVal, 0.9, val + 1);
                        rail1.rotation.y = Math.PI / 2;
                        rail2.position.set(constVal, 0.4, val + 1);
                        rail2.rotation.y = Math.PI / 2;
                    }
                    rail1.castShadow = true;
                    group.add(rail1);
                    group.add(rail2);
                }
            }
        };
        
        drawEdge(-halfW, halfW, 'x', -halfD); // 北
        drawEdge(-halfW, halfW, 'x', halfD, true); // 南 (带缺口)
        drawEdge(-halfD, halfD, 'z', -halfW); // 左
        drawEdge(-halfD, halfD, 'z', halfW);  // 右
    }
    
    // 8. 环城林区与行道树
    buildForest() {
        // 在小镇的空地随机种一些 Low-poly 树木，避开马路和建筑
        // 马路位于 x= -4 到 4, z= -4 到 4.
        // 建筑分别在 (25, 25), (-25, 25), (25, -25), (-25, -25) 附近
        
        const treePositions = [
            // 农地与建筑之间的绿地
            [-12, -12], [-14, -8], [-8, -15],
            [12, -12], [15, -9], [9, -15],
            [-12, 12], [-15, 8], [-8, 14],
            [12, 12], [14, 8], [9, 15],
            
            // 四个角落更深处 (林区)
            [-45, -45], [-48, -35], [-35, -48], [-40, -42],
            [45, -45], [48, -35], [35, -48], [42, -40],
            [-45, 45], [-48, 35], [-35, 48], [-40, 42],
            [45, 45], [48, 35], [35, 48], [42, 40],
            
            // 边缘绿化带
            [-52, -15], [-50, 15], [52, -18], [51, 20]
        ];
        
        const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.5, 5);
        // Low-poly 树冠：十二面体
        const foliageGeo1 = new THREE.DodecahedronGeometry(1.3, 1);
        // 另一种高耸树冠：圆锥叠合
        const coneGeo = new THREE.ConeGeometry(1.2, 2.0, 5);
        
        treePositions.forEach((pos, idx) => {
            const group = new THREE.Group();
            group.position.set(pos[0], 0, pos[1]);
            
            const trunk = new THREE.Mesh(trunkGeo, this.materials.trunk);
            trunk.position.y = 1.25;
            trunk.castShadow = true;
            group.add(trunk);
            
            // 黄色/绿色树木交错
            const isYellow = idx % 5 === 0;
            const foliageMat = isYellow ? this.materials.foliageYellow : this.materials.foliage;
            
            if (idx % 2 === 0) {
                // 圆球状树冠
                const f = new THREE.Mesh(foliageGeo1, foliageMat);
                f.position.y = 3.0;
                f.castShadow = true;
                group.add(f);
            } else {
                // 塔状松树
                const f1 = new THREE.Mesh(coneGeo, foliageMat);
                f1.position.y = 2.5;
                f1.castShadow = true;
                group.add(f1);
                
                const f2 = new THREE.Mesh(coneGeo, foliageMat);
                f2.position.y = 3.5;
                f2.scale.set(0.75, 0.75, 0.75);
                f2.castShadow = true;
                group.add(f2);
            }
            
            this.scene.add(group);
            
            // 为大树木添加碰撞体，防止玩家穿透
            this.physics.addCollider({ x: pos[0], z: pos[1], width: 1.0, depth: 1.0, label: '大树' });
        });
    }
    
    // 9. 路灯系统 (4个核心十字街区拐角 + 4个主干道边缘)
    buildStreetLights() {
        const lightPositions = [
            [-6, 6], [6, 6], [-6, -6], [6, -6],
            [-20, 6], [20, 6], [-6, 20], [6, -20]
        ];
        
        lightPositions.forEach((pos, idx) => {
            const group = new THREE.Group();
            group.position.set(pos[0], 0, pos[1]);
            
            // 铁杆
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.0), this.materials.lampPole);
            pole.position.y = 2.0;
            pole.castShadow = true;
            group.add(pole);
            
            // 伸出小短臂
            const arm = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.08), this.materials.lampPole);
            // 调整朝向以面向马路
            const toCenterDir = -Math.sign(pos[0]); // 朝着 x=0 方向延伸
            arm.position.set(toCenterDir * 0.25, 3.9, 0);
            group.add(arm);
            
            // 灯泡 (发光体网格)
            const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), this.materials.lampOff);
            bulb.position.set(toCenterDir * 0.5, 3.75, 0);
            group.add(bulb);
            
            // 3D 局部光源：点光源 (默认关闭，夜间才开启，投射阴影)
            const light = new THREE.PointLight(0xffe28f, 0, 15, 1.2);
            light.position.set(toCenterDir * 0.5, 3.6, 0);
            light.castShadow = true;
            light.shadow.bias = -0.002;
            group.add(light);
            
            this.scene.add(group);
            
            // 收集引用
            this.streetLights.push({
                bulbMesh: bulb,
                lightSource: light,
                x: pos[0],
                z: pos[1]
            });
            
            // 路灯基座极其细小，设置 0.4 的小碰撞盒
            this.physics.addCollider({ x: pos[0], z: pos[1], width: 0.4, depth: 0.4, label: '路灯杆' });
        });
    }
    
    /**
     * 更新街灯和窗户的发光状态 (昼夜状态改变时由 main.js 调用)
     * @param {boolean} isNight 是否为夜晚
     */
    updateLights(isNight) {
        // 更新路灯
        this.streetLights.forEach(item => {
            if (isNight) {
                item.bulbMesh.material = this.materials.lampOn;
                item.lightSource.intensity = 1.8; // 亮起
            } else {
                item.bulbMesh.material = this.materials.lampOff;
                item.lightSource.intensity = 0;   // 熄灭
            }
        });
        
        // 更新所有建筑窗户
        this.windowMaterials.forEach(mat => {
            if (isNight) {
                mat.copy(this.materials.windowOn);
            } else {
                mat.copy(this.materials.windowOff);
            }
        });
    }
}
