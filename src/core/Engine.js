import * as THREE from 'three';

export class Engine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        
        // 1. 初始化场景
        this.scene = new THREE.Scene();
        
        // 2. 初始化相机 (75度视野, 视角比, 近截面0.1, 远截面1000)
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            500
        );
        // 相机初始高度与偏移
        this.camera.position.set(0, 15, 20);
        
        // 3. 初始化渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true, // 开启抗锯齿
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        // 开启阴影贴图支持，提升 3D 立体感
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // 4. 添加雾气效果，增加空气感与景深
        this.fogColor = new THREE.Color('#a0c0e0');
        this.scene.fog = new THREE.FogExp2(this.fogColor, 0.015);
        this.renderer.setClearColor(this.fogColor);
        
        // 5. 初始化光照
        this.setupLights();
        
        // 6. 窗口自适应监听
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLights() {
        // 半球光：模拟天空和地面反射，提供均匀的底色
        this.hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.hemiLight.position.set(0, 50, 0);
        this.scene.add(this.hemiLight);
        
        // 主光源：太阳光/月光
        this.dirLight = new THREE.DirectionalLight(0xfffaed, 0.8);
        this.dirLight.position.set(30, 40, 20);
        this.dirLight.castShadow = true;
        
        // 阴影参数调优，确保低多边形阴影清晰且不崩坏
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 0.5;
        this.dirLight.shadow.camera.far = 150;
        
        const d = 60; // 阴影相机可视范围
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.bias = -0.0005; // 解决阴影失真问题
        
        this.scene.add(this.dirLight);
        
        // 辅助光：为暗部提供少量细节补偿
        this.backLight = new THREE.DirectionalLight(0xa0b0ff, 0.2);
        this.backLight.position.set(-30, 20, -20);
        this.scene.add(this.backLight);
    }
    
    /**
     * 根据当前时间更新天空盒、雾气以及阳光
     * @param {number} hour 游戏内小时数 (0.0 - 24.0)
     */
    updateDayNightCycle(hour) {
        let skyColor, fogColor, sunIntensity, hemiIntensity;
        let sunColor = 0xffffff;
        
        // 计算太阳的高度角度 (在 x-y 平面做圆周运动)
        const angle = ((hour - 6) / 24) * Math.PI * 2;
        const sunY = Math.sin(angle);
        const sunX = Math.cos(angle);
        
        // 调整阳光方向
        this.dirLight.position.set(sunX * 60, Math.max(0.1, sunY) * 50, sunX * 30);
        
        // 昼夜四阶段插值计算
        if (hour >= 6 && hour < 11) {
            // 清晨 (6:00 - 11:00)
            const t = (hour - 6) / 5;
            skyColor = new THREE.Color('#ffc896').lerp(new THREE.Color('#a0c0e0'), t);
            fogColor = skyColor;
            sunIntensity = 0.2 + t * 0.8;
            hemiIntensity = 0.4 + t * 0.4;
            sunColor = 0xffe5cc;
        } else if (hour >= 11 && hour < 17) {
            // 白天 (11:00 - 17:00)
            skyColor = new THREE.Color('#a0c0e0');
            fogColor = skyColor;
            sunIntensity = 1.0;
            hemiIntensity = 0.8;
            sunColor = 0xffffff;
        } else if (hour >= 17 && hour < 19.5) {
            // 黄昏 (17:00 - 19:30)
            const t = (hour - 17) / 2.5;
            skyColor = new THREE.Color('#a0c0e0').lerp(new THREE.Color('#e65c00'), t);
            fogColor = skyColor.clone().lerp(new THREE.Color('#201030'), t * 0.5);
            sunIntensity = 1.0 - t * 0.8;
            hemiIntensity = 0.8 - t * 0.5;
            sunColor = 0xffb366;
        } else {
            // 黑夜 (19:30 - 次日 6:00)
            let t = 0;
            if (hour >= 19.5) {
                t = Math.min(1, (hour - 19.5) / 2);
            } else {
                t = Math.min(1, (6 - hour) / 2);
            }
            skyColor = new THREE.Color('#050510');
            fogColor = new THREE.Color('#030308');
            sunIntensity = 0.05; // 月光微弱
            hemiIntensity = 0.15;
            sunColor = 0xa0b0ff; // 偏冷色调月光
        }
        
        // 应用平滑过渡
        this.renderer.setClearColor(skyColor);
        this.scene.fog.color.copy(fogColor);
        
        this.dirLight.intensity = sunIntensity;
        this.dirLight.color.setHex(sunColor);
        this.hemiLight.intensity = hemiIntensity;
        
        // 黑夜降临时，广播路灯点亮信号（由外部 Town 响应材质切换）
        this.isNight = (hour >= 19 || hour < 6);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
}
