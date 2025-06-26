import * as THREE from 'three';

class paTextureLoader extends THREE.TextureLoader {
    load(url, onLoad, onProgress, onError) {
        const texture = super.load(url, (tex) => {
            tex.minFilter = THREE.NearestFilter;
            tex.magFilter = THREE.NearestFilter;
            tex.colorSpace = THREE.SRGBColorSpace;

            if (onLoad) onLoad(tex);
        }, onProgress, onError);

    return texture;
    
    }
}

export { paTextureLoader };