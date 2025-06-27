import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

export function setupPostprocessing(renderer, scene, camera, pixelSize = 1) {
  const renderPass = new RenderPass(scene, camera);

  // ---- Bayer Shader ----
  const bayerShader = {
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      pixelSize: { value: pixelSize }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float pixelSize;

      float bayerDither4x4(int x, int y) {
        int index = y * 4 + x;
        float bayer[16];
        bayer[0] = 0.0 / 16.0;  bayer[1] = 8.0 / 16.0;  bayer[2] = 2.0 / 16.0;  bayer[3] = 10.0 / 16.0;
        bayer[4] = 12.0 / 16.0; bayer[5] = 4.0 / 16.0;  bayer[6] = 14.0 / 16.0; bayer[7] = 6.0 / 16.0;
        bayer[8] = 3.0 / 16.0;  bayer[9] = 11.0 / 16.0; bayer[10] = 1.0 / 16.0; bayer[11] = 9.0 / 16.0;
        bayer[12] = 15.0 / 16.0; bayer[13] = 7.0 / 16.0; bayer[14] = 13.0 / 16.0; bayer[15] = 5.0 / 16.0;
        return bayer[index];
      }

      float orderedDither(float color, float threshold) {
        float levels = 16.0;
        float quantized = floor(color * levels + threshold);
        return quantized / (levels - 1.0);
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / resolution;

        vec2 pixelatedUV = floor(uv * resolution / pixelSize) * pixelSize / resolution;
        vec3 color = texture2D(tDiffuse, pixelatedUV).rgb;

        ivec2 pixelPos = ivec2(mod(gl_FragCoord.xy, 4.0));
        float threshold = bayerDither4x4(pixelPos.x, pixelPos.y);

        color.r = orderedDither(color.r, threshold);
        color.g = orderedDither(color.g, threshold);
        color.b = orderedDither(color.b, threshold);
        color = pow(color, vec3(1.0 / 2.2));
        gl_FragColor = vec4(color, 1.0);
      }
    `
  };
  const bayerPass = new ShaderPass(bayerShader);

  // ---- Shake Shader ----
  const shakeShader = {
    uniforms: {
      tDiffuse: { value: null },
      time: { value: 0 },
      intensity: { value: 0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float time;
        uniform float intensity;
        varying vec2 vUv;
        
        float rand(float n) {
          return fract(sin(n) * 43758.5453);
        }
        
        void main() {
          float offsetX = (rand(time) - 0.5) * intensity;
          float offsetY = (rand(time + 100.0) - 0.5) * intensity;
          vec2 shakenUV = vUv + vec2(offsetX, offsetY) * 0.01;
          gl_FragColor = texture2D(tDiffuse, shakenUV);
        }
    `
  };
  const shakePass = new ShaderPass(shakeShader);

  // ---- Effect Composer ----
  const composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(shakePass);   // Add shake BEFORE dither
  composer.addPass(bayerPass);

  // ---- Shake State ----
  let shakeStart = 0;
  let shakeDuration = 0;
  let shakeIntensity = 0;

  function triggerShake(intensity = 1.0, duration = 0.5) {
    shakeStart = performance.now() / 1000;
    shakeDuration = duration;
    shakeIntensity = intensity;
  }

  function update() {
    const now = performance.now() / 1000;
    const elapsed = now - shakeStart;
    if (elapsed < shakeDuration) {
      shakePass.uniforms.intensity.value = shakeIntensity * (1.0 - (elapsed / shakeDuration));
      shakePass.uniforms.time.value = now * 60.0;
    } else {
      shakePass.uniforms.intensity.value = 0;
    }
    composer.render();
  }

  return {
    composer,
    triggerShake,
    update
  };
}
