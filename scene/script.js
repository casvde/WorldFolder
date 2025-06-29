import * as THREE from 'three';

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import { createScene } from './sceneSetup.js';
import { paTextureLoader } from './textureLoader.js';
import { createTileMap } from './tileMap.js';
import { createFoliageInstances } from './grassHandler.js';

import {
    generateBlobIsland,
    createPadding,
    createIndexedPadding,
    printGrid,
    createColliders,
    generateBackgroundTiles
} from './islandGenerator.js';

import { setupPostprocessing } from './postProcessManager.js';
import { Player } from './tempPlayer.js';

import { 
        visualizeColliders,
        printGridDom
} from './debug.js';



const loader = new paTextureLoader();



const { scene, camera, renderer, controls } = createScene('MAIN-CANVAS');
const { composer, triggerShake, update } = setupPostprocessing(renderer, scene, camera);


let tileMap;
let wallColliders;
const levelChunk = [];
const textureCache = new Map();

let accumulator = 0;
const clock = new THREE.Clock();

let grass;




function disposeHierarchy(node) {
  node.traverse(child => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach(mat => mat.dispose());
      } else {
        child.material.dispose();
      }
    }
  });
  scene.remove(node);
}

function loadTexture(path) {
  if (textureCache.has(path)) {
    return Promise.resolve(textureCache.get(path));
  }

  return new Promise((resolve, reject) => {
    loader.load(path, tex => {
      textureCache.set(path, tex);
      resolve(tex);
    }, undefined, reject);
  });
}

async function loadLevel() {
  const tileMapBase = generateBlobIsland(14, 12, 2, 180, 3, 6);
  const backgroundTiles = generateBackgroundTiles(25, 16, 3, 0.02);

  const [stoneTex, dirtTex, wallTex, bgTex] = await Promise.all([
    loadTexture('textures/stone-tiles.png'),
    loadTexture('textures/dirt-tiles.png'),
    loadTexture('textures/wall-tiles.png'),
    loadTexture('textures/background-tiles.png'),
  ]);


  const stoneMap = tileMapBase;
  const dirtMap = createPadding(tileMapBase, 3);
  const wallMap = createIndexedPadding(createPadding(tileMapBase));
  const bgMap = backgroundTiles;

  const stoneTiles = createTileMap({
    texture: stoneTex,
    tileMap: stoneMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: 0, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    scene,
  });
  levelChunk.push(stoneTiles);

  const dirtTiles = createTileMap({
    texture: dirtTex,
    tileMap: dirtMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: -0.01, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    scene,
  });
  levelChunk.push(dirtTiles);

  const wallTiles = createTileMap({
    texture: wallTex,
    tileMap: wallMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -8, y: -0.01, z: -6 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    scene,
  });
  levelChunk.push(wallTiles);

  const background = createTileMap({
    texture: bgTex,
    tileMap: bgMap,
    tileSize: 1,
    tileWidth: 16,
    tileHeight: 16,
    offset: { x: -12, y: -0.03, z: -8 },
    rotation: { x: -Math.PI / 2, y: 0, z: 0 },
    scene,
  });
  levelChunk.push(background);

  tileMap = wallMap;
  wallColliders = createColliders(tileMap, 1, { x: -8.5, y: -0.01, z: -6.5 });



  grass = createFoliageInstances({
    textureURL: 'textures/grass-atlas.png',
    camera: camera,
    renderRadius : 300,
    instanceCount: 20,
    areaWidth: 2.2,
    areaDepth: 2.2,
    waveStrength: 0.03,
    center:new THREE.Vector3(0, 0, 0 ),
  });
  

  scene.add(grass);
  levelChunk.push(grass);


  player.wallColliders = wallColliders;
}

async function reloadLevel() {
  for (const mesh of levelChunk) {
    disposeHierarchy(mesh);
  }
  levelChunk.length = 0;

  await loadLevel();
}

function clearTextureCache() {
  for (const tex of textureCache.values()) {
    tex.dispose();
  }
  textureCache.clear();
}






document.getElementById("reloadButton").addEventListener("click", async () => {
  await reloadLevel();
});

loadLevel();  

const player = new Player(scene, loader, triggerShake, wallColliders);








const globalLight = new THREE.AmbientLight(0x404040, 35);
scene.add(globalLight);


function animate() {

  const delta = clock.getDelta();
  accumulator += delta;



  controls.update();
  composer.render();
  update();




  requestAnimationFrame(animate);
}

animate();





















async function createTextSprite(text, fontSize = 32, color = '#ffffff', alignment = 'center', scale = 1) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    await document.fonts.load(`${fontSize}px HopeGold`);
    await document.fonts.ready;

    context.font = `${fontSize}px HopeGold`;

    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2;
    const padding = fontSize * 0.5;

    const textWidths = lines.map(line => context.measureText(line).width);
    const maxWidth = Math.max(...textWidths);

    canvas.width = Math.ceil(maxWidth + padding * 2);
    canvas.height = Math.ceil(lineHeight * lines.length + padding * 2);

    context.font = `${fontSize}px HopeGold`;
    context.fillStyle = color;
    context.textBaseline = 'top';

    context.textAlign = alignment;

    let x;
    if (alignment === 'left') {
        x = padding;
    } else if (alignment === 'right') {
        x = canvas.width - padding;
    } else {
        x = canvas.width / 2;
    }

    lines.forEach((line, index) => {
        context.fillText(line, x, padding + index * lineHeight);
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;

    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    if (alignment === 'left') {
        sprite.center.set(0, 0.5);
    } else if (alignment === 'right') {
        sprite.center.set(1, 0.5);
    } else {
        sprite.center.set(0.5, 0.5);
    }

    const aspect = canvas.width / canvas.height;
    sprite.scale.set(scale * aspect, scale, 1);

    return sprite;
}




//const textSprite = await createTextSprite("Text renderer", 64, '#ffffff', 'left', 1);
//textSprite.position.set(-12, 2.5, -5.0);
//scene.add(textSprite);



