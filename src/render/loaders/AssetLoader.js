import { MODEL_ASSETS } from '../../content/assetManifest.js';

export class AssetLoader {
    constructor() {
        this.loaderPromise = null;
        this.cache = new Map();
    }

    getLoader() {
        if (!this.loaderPromise) {
            this.loaderPromise = import('three/examples/jsm/loaders/GLTFLoader.js')
                .then(({ GLTFLoader }) => new GLTFLoader());
        }

        return this.loaderPromise;
    }

    load(key) {
        if (!MODEL_ASSETS[key]) {
            return Promise.reject(new Error(`Unknown model asset: ${key}`));
        }

        if (!this.cache.has(key)) {
            const promise = this.getLoader()
                .then((loader) => loader.loadAsync(MODEL_ASSETS[key]));
            this.cache.set(key, promise);
        }

        return this.cache.get(key);
    }

    async clone(key, options = {}) {
        const gltf = await this.load(key);
        const model = gltf.scene.clone(true);
        const castShadow = options.castShadow ?? true;
        const receiveShadow = options.receiveShadow ?? true;

        model.traverse((object) => {
            if (!object.isMesh) return;
            object.castShadow = castShadow;
            object.receiveShadow = receiveShadow;
        });

        return model;
    }
}
