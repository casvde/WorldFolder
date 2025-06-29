import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import { WebGPURenderer } from 'three/webgpu';

export function createScene(containerId) {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38201e);

    const camera = new THREE.PerspectiveCamera(12, window.innerWidth / window.innerHeight, 0.1, 1000);

    camera.position.z = 32;
    camera.position.y = 45;
    camera.position.x = 0;

    

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    const container = document.getElementById(containerId);
    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        console.error(`Element with ID "${containerId}" not found.`);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    return { scene, camera, renderer, controls };
}
