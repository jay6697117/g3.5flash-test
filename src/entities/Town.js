import * as THREE from 'three';
import { MATERIAL_TOKENS, STREET_FURNITURE } from '../content/townContent.js';
import { NPC_TRIGGERS } from '../content/dialogueContent.js';
import { AssetLoader } from '../render/loaders/AssetLoader.js';

export class Town {
    constructor(scene, physics) {
        this.scene = scene;
        this.physics = physics;
        
        // 存储路灯引用以进行昼夜状态更新
        this.streetLights = [];
        
        // 存储材质引用以切换发光
        this.windowMaterials = [];
        this.landmarkGroups = {};
        this.runtimeAssetGroups = [];
        this.loadedAssetCount = 0;
        this.failedAssetCount = 0;
        this.assetLoader = new AssetLoader();
        
        // 初始化材料库，采用暖色和柔和低饱和度的色彩，确保高级感
        this.materials = {
            ground: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.grass, roughness: 0.95, metalness: 0.02 }),
            grassDark: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.grassDark, roughness: 1.0 }),
            grassLight: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.grassLight, roughness: 1.0 }),
            road: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.road, roughness: 0.82 }),
            roadEdge: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.roadEdge, roughness: 0.85 }),
            sidewalk: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.sidewalk, roughness: 0.9 }),
            crosswalk: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.crosswalk, roughness: 0.8 }),
            roadMark: new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.8 }),
            houseWall: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.creamWall, roughness: 0.68 }),
            houseRoof: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.houseRoof, roughness: 0.58 }), // 红色屋顶
            supermarketWall: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.supermarketBlue, roughness: 0.55 }), // 深蓝
            supermarketGlass: new THREE.MeshStandardMaterial({ color: 0xa0e0ff, transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.9 }),
            marketTent1: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.marketGreen, roughness: 0.5 }), // 绿白相间遮阳棚
            marketTent2: new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.5 }),
            wood: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.wood, roughness: 0.9 }),
            darkWood: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.darkWood, roughness: 0.9 }),
            schoolBrick: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.schoolBrick, roughness: 0.72 }), // 红砖
            schoolPillar: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.stone, roughness: 0.55 }),
            trunk: new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }),
            foliage: new THREE.MeshStandardMaterial({ color: 0x4d8a55, roughness: 0.8 }),
            foliageYellow: new THREE.MeshStandardMaterial({ color: 0xdbb035, roughness: 0.8 }),
            farmSoil: new THREE.MeshStandardMaterial({ color: 0x5a3e2b, roughness: 1.0 }), // 土地
            fence: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.7 }),
            lampPole: new THREE.MeshStandardMaterial({ color: 0x777777, roughness: 0.5, metalness: 0.8 }),
            planterStone: new THREE.MeshStandardMaterial({ color: 0x9c9285, roughness: 0.85 }),
            flowerRed: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.accentRed, roughness: 0.65 }),
            flowerYellow: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.accentYellow, roughness: 0.65 }),
            signBoard: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.warmWhite, roughness: 0.6 }),
            accentYellow: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.accentYellow, roughness: 0.5 }),
            accentBlue: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.accentBlue, roughness: 0.55 }),
            water: new THREE.MeshStandardMaterial({ color: MATERIAL_TOKENS.water, roughness: 0.34, metalness: 0.08 }),
            lampOff: new THREE.MeshStandardMaterial({ color: 0xdddddd }),
            lampOn: new THREE.MeshBasicMaterial({ color: 0xffe677 }), // 晚上发光
            windowOff: new THREE.MeshStandardMaterial({ color: 0x334455, roughness: 0.3 }),
            windowOn: new THREE.MeshBasicMaterial({ color: 0xffdd66 }) // 晚上窗户亮灯
        };

        // 构建大世界
        this.buildGround();
        this.buildRoads();
        this.buildDistantLandscape();
        this.buildForest();
        this.buildPlayerHome();
        this.buildSupermarket();
        this.buildMarket();
        this.buildSchool();
        this.buildFarm();
        this.buildStreetLights();
        this.buildTownDetails();
        this.buildGltfScenePass();
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

    buildDistantLandscape() {
        const group = new THREE.Group();

        const lake = new THREE.Mesh(new THREE.PlaneGeometry(106, 18), this.materials.water);
        lake.rotation.x = -Math.PI / 2;
        lake.position.set(0, 0.025, -80);
        lake.receiveShadow = true;
        group.add(lake);

        const nearShore = new THREE.Mesh(new THREE.BoxGeometry(108, 0.08, 1.4), this.materials.sidewalk);
        nearShore.position.set(0, 0.08, -70.6);
        group.add(nearShore);

        const farShore = new THREE.Mesh(new THREE.BoxGeometry(108, 0.08, 1.8), this.materials.grassLight);
        farShore.position.set(0, 0.07, -89.4);
        group.add(farShore);

        this.scene.add(group);
    }

    addBox(group, width, height, depth, material, x, y, z) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
        mesh.position.set(x, y, z);
        mesh.castShadow = height > 0.2;
        mesh.receiveShadow = true;
        group.add(mesh);
        return mesh;
    }

    buildTownDetails() {
        this.buildSidewalks();
        this.buildLandmarkPads();
        this.buildStreetFurniture();
        this.buildDirectionalSigns();
    }

    buildSidewalks() {
        const group = new THREE.Group();

        this.addBox(group, 2.4, 0.08, 120, this.materials.sidewalk, -5.4, 0.08, 0);
        this.addBox(group, 2.4, 0.08, 120, this.materials.sidewalk, 5.4, 0.08, 0);
        this.addBox(group, 120, 0.08, 2.4, this.materials.sidewalk, 0, 0.09, -5.4);
        this.addBox(group, 120, 0.08, 2.4, this.materials.sidewalk, 0, 0.09, 5.4);

        this.addBox(group, 0.18, 0.22, 120, this.materials.roadEdge, -4.1, 0.18, 0);
        this.addBox(group, 0.18, 0.22, 120, this.materials.roadEdge, 4.1, 0.18, 0);
        this.addBox(group, 120, 0.22, 0.18, this.materials.roadEdge, 0, 0.19, -4.1);
        this.addBox(group, 120, 0.22, 0.18, this.materials.roadEdge, 0, 0.19, 4.1);

        for (let i = -3; i <= 3; i += 1.2) {
            this.addBox(group, 0.45, 0.04, 5.8, this.materials.crosswalk, i, 0.16, -8.2);
            this.addBox(group, 0.45, 0.04, 5.8, this.materials.crosswalk, i, 0.16, 8.2);
            this.addBox(group, 5.8, 0.04, 0.45, this.materials.crosswalk, -8.2, 0.17, i);
            this.addBox(group, 5.8, 0.04, 0.45, this.materials.crosswalk, 8.2, 0.17, i);
        }

        this.scene.add(group);
    }

    buildLandmarkPads() {
        const group = new THREE.Group();
        const pads = [
            [-25, -20, 8, 5],
            [25, -20, 14, 5],
            [-25, 19, 12, 6],
            [25, 18, 16, 6],
            [0, 10.2, 9, 4],
        ];

        pads.forEach(([x, z, width, depth]) => {
            this.addBox(group, width, 0.06, depth, this.materials.sidewalk, x, 0.13, z);
        });

        const gardenPatches = [
            [-31, -18, 4, 3], [-19, -18, 4, 3],
            [18, -18, 4, 3], [32, -18, 4, 3],
            [-32, 17, 4, 3], [-18, 17, 4, 3],
            [17, 17, 5, 3], [33, 17, 5, 3],
        ];

        gardenPatches.forEach(([x, z, width, depth], index) => {
            const material = index % 2 === 0 ? this.materials.grassLight : this.materials.grassDark;
            this.addBox(group, width, 0.05, depth, material, x, 0.14, z);
        });

        this.scene.add(group);
    }

    buildStreetFurniture() {
        const group = new THREE.Group();

        STREET_FURNITURE.benches.forEach(([x, z, rotation]) => {
            const bench = new THREE.Group();
            bench.position.set(x, 0, z);
            bench.rotation.y = rotation;
            this.addBox(bench, 2.2, 0.18, 0.45, this.materials.wood, 0, 0.65, 0);
            this.addBox(bench, 2.2, 0.18, 0.28, this.materials.darkWood, 0, 1.05, -0.34);
            this.addBox(bench, 0.18, 0.65, 0.18, this.materials.lampPole, -0.82, 0.35, 0.12);
            this.addBox(bench, 0.18, 0.65, 0.18, this.materials.lampPole, 0.82, 0.35, 0.12);
            group.add(bench);
        });

        STREET_FURNITURE.planters.forEach(([x, z], index) => {
            const planter = new THREE.Group();
            planter.position.set(x, 0, z);
            this.addBox(planter, 1.2, 0.55, 0.9, this.materials.planterStone, 0, 0.35, 0);
            this.addBox(planter, 0.9, 0.12, 0.62, this.materials.farmSoil, 0, 0.68, 0);

            for (let i = -1; i <= 1; i++) {
                const flower = new THREE.Mesh(
                    new THREE.SphereGeometry(0.13, 6, 6),
                    (index + i) % 2 === 0 ? this.materials.flowerYellow : this.materials.flowerRed
                );
                flower.position.set(i * 0.24, 0.88, Math.sin(i + index) * 0.18);
                flower.castShadow = true;
                planter.add(flower);
            }

            group.add(planter);
        });

        this.scene.add(group);
    }

    buildDirectionalSigns() {
        const group = new THREE.Group();

        STREET_FURNITURE.signPosts.forEach((config, index) => {
            const signGroup = new THREE.Group();
            signGroup.position.set(config.x, 0, config.z);
            signGroup.rotation.y = index % 2 === 0 ? Math.PI / 6 : -Math.PI / 6;

            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 2.2, 8), this.materials.wood);
            post.position.y = 1.1;
            post.castShadow = true;
            signGroup.add(post);

            const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.72, 0.16), this.materials.signBoard);
            board.position.y = 2.0;
            board.castShadow = true;
            signGroup.add(board);

            const accent = new THREE.Mesh(
                new THREE.BoxGeometry(1.52, 0.12, 0.18),
                new THREE.MeshStandardMaterial({ color: config.accent, roughness: 0.5 })
            );
            accent.position.set(0, 2.12, 0.02);
            signGroup.add(accent);

            const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.42, 3), this.materials.accentYellow);
            arrow.position.set(0.58, 1.86, 0.04);
            arrow.rotation.z = -Math.PI / 2;
            arrow.rotation.y = Math.PI / 2;
            signGroup.add(arrow);

            group.add(signGroup);
        });

        this.scene.add(group);
    }

    async buildGltfScenePass() {
        const mainModels = [
            ['cottageHouse', { position: [-25, 0, -25], scale: 1.05, rotationY: 0, fallbackKey: 'home' }],
            ['supermarketStore', { position: [25, 0, -25], scale: 1.05, rotationY: Math.PI, fallbackKey: 'supermarket' }],
            ['schoolClocktower', { position: [25, 0, 25], scale: 1.0, rotationY: Math.PI, fallbackKey: 'school' }],
            ['marketStall', { position: [-28, 0, 25], scale: 0.92, rotationY: Math.PI, fallbackKey: 'market' }],
            ['marketStall', { position: [-22, 0, 25], scale: 0.92, rotationY: Math.PI, fallbackKey: null }],
            ['farmBarn', { position: [13.5, 0, 12.5], scale: 0.88, rotationY: -Math.PI / 3, fallbackKey: null }],
            ['waterTower', { position: [-42, 0, -35], scale: 1.35, rotationY: Math.PI / 8, fallbackKey: null }],
            ['mountainLakeSlice', { position: [0, -0.45, -105], scale: 1.28, rotationY: 0, fallbackKey: null }],
            ['cottageHouse', { position: [-43, 0, -20], scale: 0.68, rotationY: Math.PI / 2, collider: [5.0, 4.2, '街区住宅'] }],
            ['cottageHouse', { position: [-42, 0, 12], scale: 0.62, rotationY: Math.PI / 2, collider: [4.8, 4.0, '街区住宅'] }],
            ['cottageHouse', { position: [42, 0, -18], scale: 0.64, rotationY: -Math.PI / 2, collider: [4.8, 4.0, '街区住宅'] }],
            ['cottageHouse', { position: [43, 0, 13], scale: 0.7, rotationY: -Math.PI / 2, collider: [5.0, 4.2, '街区住宅'] }],
            ['supermarketStore', { position: [44, 0, -43], scale: 0.56, rotationY: Math.PI / 2, collider: [5.8, 4.2, '街角商铺'] }],
            ['marketStall', { position: [-37, 0, 25], scale: 0.62, rotationY: Math.PI / 2, collider: [3.2, 2.2, '路边摊位'] }],
            ['marketStall', { position: [-14, 0, 25], scale: 0.62, rotationY: -Math.PI / 2, collider: [3.2, 2.2, '路边摊位'] }],
            ['marketStall', { position: [-12, 0, -12], scale: 0.54, rotationY: Math.PI, collider: [3.0, 2.0, '中心摊位'] }],
            ['marketStall', { position: [0, 0, -12], scale: 0.54, rotationY: Math.PI, collider: [3.0, 2.0, '中心摊位'] }],
            ['marketStall', { position: [12, 0, -12], scale: 0.54, rotationY: Math.PI, collider: [3.0, 2.0, '中心摊位'] }],
            ['cornerCafe', { position: [18, 0, -16], scale: 0.54, rotationY: Math.PI, collider: [4.8, 3.4, '街角咖啡店'] }],
            ['cornerCafe', { position: [-17, 0, -18], scale: 0.5, rotationY: Math.PI / 2, collider: [3.8, 4.6, '街角咖啡店'] }],
            ['cornerCafe', { position: [16, 0, 13], scale: 0.48, rotationY: -Math.PI / 2, collider: [3.8, 4.4, '街角咖啡店'] }],
        ];

        await Promise.all(mainModels.map(([key, config]) => this.placeModel(key, config)));
        this.populateGltfProps();
    }

    async placeModel(key, config) {
        try {
            const model = await this.assetLoader.clone(key);
            const [x, y, z] = config.position;
            model.position.set(x, y, z);
            if (Array.isArray(config.scale)) {
                model.scale.set(config.scale[0], config.scale[1], config.scale[2]);
            } else {
                model.scale.setScalar(config.scale ?? 1);
            }
            model.rotation.y = config.rotationY ?? 0;
            this.scene.add(model);
            this.runtimeAssetGroups.push(model);
            this.loadedAssetCount += 1;

            if (config.fallbackKey && this.landmarkGroups[config.fallbackKey]) {
                this.landmarkGroups[config.fallbackKey].visible = false;
            }

            if (config.collider) {
                const [width, depth, label] = config.collider;
                this.physics.addCollider({ x, z, width, depth, label });
            }

            return model;
        } catch (error) {
            this.failedAssetCount += 1;
            console.warn(`Failed to load model asset "${key}".`, error);
            return null;
        }
    }

    populateGltfProps() {
        const placements = [
            ['treeOak', [-31, 0, -34], 1.1, 0],
            ['treeOak', [-18, 0, -34], 0.9, Math.PI / 6],
            ['treePine', [33, 0, -34], 1.0, Math.PI / 8],
            ['treeOak', [18, 0, -34], 0.95, -Math.PI / 5],
            ['treePine', [-36, 0, 33], 1.05, Math.PI / 5],
            ['treeOak', [-14, 0, 34], 0.9, -Math.PI / 9],
            ['treeOak', [16, 0, 36], 1.0, Math.PI / 7],
            ['treePine', [37, 0, 32], 1.1, -Math.PI / 7],
            ['bench', [-17, 0, -7], 1.0, Math.PI / 2],
            ['bench', [17, 0, -7], 1.0, Math.PI / 2],
            ['bench', [-17, 0, 7], 1.0, Math.PI / 2],
            ['bench', [17, 0, 7], 1.0, Math.PI / 2],
            ['planter', [-12, 0, -4], 1.0, 0],
            ['planter', [12, 0, -4], 1.0, Math.PI / 5],
            ['planter', [-12, 0, 4], 1.0, -Math.PI / 5],
            ['planter', [12, 0, 4], 1.0, Math.PI / 9],
            ['planter', [-7, 0, -15], 0.86, Math.PI / 9],
            ['planter', [7, 0, -15], 0.86, -Math.PI / 9],
            ['bench', [-7, 0, -7], 0.9, Math.PI / 2],
            ['bench', [7, 0, -7], 0.9, Math.PI / 2],
            ['townsperson', [-8.5, 0, -9.5], 0.9, Math.PI / 5],
            ['townsperson', [-2.4, 0, -9.2], 0.86, -Math.PI / 9],
            ['townsperson', [5.8, 0, -10.2], 0.88, -Math.PI / 5],
            ['townsperson', [10.8, 0, -8.8], 0.84, Math.PI / 3],
            ['townsperson', [-20.5, 0, -11.5], 0.82, Math.PI / 2],
            ['townsperson', [17.5, 0, -7.8], 0.82, -Math.PI / 2],
            ['cloudPuff', [-26, 15, -42], 2.2, Math.PI / 10],
            ['cloudPuff', [18, 17, -48], 1.8, -Math.PI / 8],
            ['cloudPuff', [38, 14, 20], 1.5, Math.PI / 5],
        ];

        placements.forEach(([key, position, scale, rotationY]) => {
            this.placeModel(key, { position, scale, rotationY });
        });

        NPC_TRIGGERS.forEach((trigger) => {
            this.physics.addTrigger({
                ...trigger,
                type: 'npc',
            });
        });
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
        this.landmarkGroups.home = group;
        
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
        this.landmarkGroups.supermarket = group;
        
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
        this.landmarkGroups.market = group;
        
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
        this.landmarkGroups.school = group;
        
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
        const x = -42, z = 34;
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
