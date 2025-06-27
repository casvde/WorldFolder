import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { createScene } from './sceneSetup.js';
import { paTextureLoader } from './textureLoader.js';
import { createTileMap } from './tileMap.js';
import {
    generateBlobIsland,
    createPadding,
    createIndexedPadding,
    printGrid
} from './islandGenerator.js';

import { setupPostprocessing } from './postProcessManager.js';


import { Player } from './tempPlayer.js';

const { scene, camera, renderer, controls } = createScene('MAIN-CANVAS');
const { composer, triggerShake, update } = setupPostprocessing(renderer, scene, camera);





//width, height, margin, maxIterations , smoothingIterations , tileVariants
let tileMapBase = generateBlobIsland(14, 12, 2, 180, 3, 6);

const loader = new paTextureLoader();

const player = new Player(scene, loader, triggerShake);

const globalLight = new THREE.AmbientLight(0x404040, 30);
scene.add(globalLight);

loader.load('textures/stone-tiles.png', function(texture) {

  const tileMap = tileMapBase;
  
  createTileMap({
    texture,
    tileMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: 0, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
    scene: scene,
  });
});


loader.load('/textures/dirt-tiles.png', function(texture) {

  const tileMap = createPadding(tileMapBase , 3);
  createTileMap({
    texture,
    tileMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: -0.01, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
    scene: scene,
  });
});


loader.load('/textures/wall-tiles.png', function(texture) {

  const tileMap =  createIndexedPadding(createPadding(tileMapBase));
  createTileMap({
    texture,
    tileMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: -0.01, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
    scene: scene,
  });
});


















function animate() {
  controls.update();

  composer.render()

  update();
  requestAnimationFrame(animate);
}

animate();