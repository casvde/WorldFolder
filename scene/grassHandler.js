import * as THREE from 'three';
import { paTextureLoader } from './textureLoader.js';

export function createFoliageInstances({
  textureURL,
  camera,
  instanceCount = 60,
  tileSize = 3,
  atlasWidth = 15,
  atlasHeight = 3,
  areaWidth = 100,
  areaDepth = 100,
  waveStrength = 0.09,
  instanceScale = 0.2,
  center = new THREE.Vector3(0, 0, 0),
  cullDistance = 50,
}) {
  const textureLoader = new paTextureLoader();
  const texture = textureLoader.load(textureURL);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;

  const geometry = new THREE.PlaneGeometry(1, 1);
  geometry.translate(0, 0.65, 0);

  const uvOffsets = new Float32Array(instanceCount * 4);
  const offsets = new Float32Array(instanceCount * 3);
  const scales = new Float32Array(instanceCount);

  const tilesX = atlasWidth / tileSize;
  const tilesY = atlasHeight / tileSize;

  for (let i = 0; i < instanceCount; i++) {
    const tileX = Math.floor(Math.random() * tilesX);
    const tileY = Math.floor(Math.random() * tilesY);

    const offsetX = tileX * tileSize / atlasWidth;
    const offsetY = tileY * tileSize / atlasHeight;
    const scaleX = tileSize / atlasWidth;
    const scaleY = tileSize / atlasHeight;

    uvOffsets.set([offsetX, offsetY, scaleX, scaleY], i * 4);

    offsets.set([
      center.x + (Math.random() - 0.5) * areaWidth,
      center.y,
      center.z + (Math.random() - 0.5) * areaDepth,
    ], i * 3);

    scales[i] = instanceScale; 
  }

  geometry.setAttribute('uvTransform', new THREE.InstancedBufferAttribute(uvOffsets, 4));
  geometry.setAttribute('instanceOffset', new THREE.InstancedBufferAttribute(offsets, 3));
  geometry.setAttribute('instanceScale', new THREE.InstancedBufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    uniforms: {
      map: { value: texture },
      time: { value: 0 },
      waveStrength: { value: waveStrength },
      cameraPositionXZ: { value: new THREE.Vector2() },
      maxDistance: { value: cullDistance }
    },
    vertexShader: `
      attribute vec4 uvTransform;
      attribute vec3 instanceOffset;
      attribute float instanceScale;

      uniform float time;
      uniform float waveStrength;
      uniform vec2 cameraPositionXZ;
      uniform float maxDistance;

      varying vec2 vUv;
      varying vec2 vWorldXZ;

      float simpleNoise(vec2 p) {
        return sin(p.x * 0.5 + time) * cos(p.y * 0.5 + time);
      }

      void main() {
        vUv = uv * uvTransform.zw + uvTransform.xy;

        vec3 pos = position * instanceScale;

        float wave = simpleNoise(instanceOffset.xz);
        pos.x += wave * waveStrength;

        vec3 billboardRight = vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]);
        vec3 billboardUp = vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]);

        vec3 worldPosition = instanceOffset + pos.x * billboardRight + pos.y * billboardUp;

        vWorldXZ = worldPosition.xz;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(worldPosition, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec2 cameraPositionXZ;
      uniform float maxDistance;

      varying vec2 vUv;
      varying vec2 vWorldXZ;

      void main() {
        float dist = distance(vWorldXZ, cameraPositionXZ);
        if (dist > maxDistance) discard;

        vec4 color = texture2D(map, vUv);
        if (color.a < 0.5) discard;

        gl_FragColor = color;
      }
    `,
    transparent: true,
    depthWrite: true,
  });

  const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

  
  instancedMesh.frustumCulled = false;

  instancedMesh.onBeforeRender = (_, __, ___, ____, material) => {
    material.uniforms.time.value = performance.now() * 0.001;
    material.uniforms.cameraPositionXZ.value.set(camera.position.x, camera.position.z);
  };

  return instancedMesh;
}
