import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import { createScene } from './sceneSetup.js';
import { paTextureLoader } from './textureLoader.js';
import { createTileMap } from './tileMap.js';

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



function loadLevel(){

  //width, height, margin, maxIterations , smoothingIterations , tileVariants
  let tileMapBase = generateBlobIsland(14, 12, 2, 180, 3, 6);
  let backgroundTiles = generateBackgroundTiles(25, 16, 3, 0.02);

  loader.load('textures/stone-tiles.png', function(texture) {

    const tileMap = tileMapBase;
    printGridDom(tileMap , "tilemap");
    
    const tileGroupSet = createTileMap({
      texture,
      tileMap,
      tileSize: 1,
      tileWidth: 16,
      tileHeight: 16,
      offset: { x: -8, y: 0, z: -6 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
      scene: scene,
    });
    
    levelChunk.push(tileGroupSet);
  });


  loader.load('/textures/dirt-tiles.png', function(texture) {

    const tileMap = createPadding(tileMapBase , 3);
    printGridDom(tileMap , "padding");

    const tileGroupSet = createTileMap({
      texture,
      tileMap,
      tileSize: 1,
      tileWidth: 16,
      tileHeight: 16,
      offset: { x: -8, y: -0.01, z: -6 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
      scene: scene,
    });

    levelChunk.push(tileGroupSet);
  });


  loader.load('/textures/wall-tiles.png', function(texture) {

    const tileMap =  createIndexedPadding(createPadding(tileMapBase));
    printGridDom(tileMap , "walls");

    const tileGroupSet = createTileMap({
      texture,
      tileMap,
      tileSize: 1,
      tileWidth: 16,
      tileHeight: 16,
      offset: { x: -8, y: -0.01, z: -6 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
      scene: scene,
    });
    
    levelChunk.push(tileGroupSet);
  });



  loader.load('/textures/background-tiles.png', function(texture) {

    const tileMap = backgroundTiles;
    printGridDom(tileMap , "backgroundTiles");

    const tileGroupSet = createTileMap({
      texture,
      tileMap,
      tileSize: 1,
      tileWidth: 16,
      tileHeight: 16,
      offset: { x: -12, y: -0.03, z: -8 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }, 
      scene: scene,
    });
    
    levelChunk.push(tileGroupSet);
  });


  tileMap =  createIndexedPadding(createPadding(tileMapBase));
  wallColliders = createColliders(tileMap, 1, { x: -8.5, y: -0.01, z: -6.5 });  

  return { tileMap, wallColliders };
}



function reloadLevel() {
  for (const mesh of levelChunk) {
    scene.remove(mesh);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(m => m.dispose());
      } else {
        mesh.material.dispose();
      }
    }
  }
  levelChunk.length = 0;
  loadLevel();
  visualizeColliders(wallColliders, scene);
  player.wallColliders = wallColliders;
}

document.getElementById("reloadButton").addEventListener("click", reloadLevel);

loadLevel();

const player = new Player(scene, loader, triggerShake, wallColliders);








const globalLight = new THREE.AmbientLight(0x404040, 35);
scene.add(globalLight);

function animate() {
  controls.update();

  composer.render()
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



