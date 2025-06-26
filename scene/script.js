import * as THREE from 'three';
import { createScene } from './sceneSetup.js';
import { paTextureLoader } from './textureLoader.js';
import { createTileMap } from './tileMap.js';
import {
    generateBlobIsland,
    createPadding,
    createIndexedPadding,
    printGrid
} from './islandGenerator.js';

import { Player } from './tempPlayer.js';

const { scene, camera, renderer, controls } = createScene('MAIN-CANVAS');




//width, height, margin, maxIterations , smoothingIterations , tileVariants
let tileMapBase = generateBlobIsland(14, 12, 2, 180, 3, 6);

const loader = new paTextureLoader();
const player = new Player(scene, loader);

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
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();