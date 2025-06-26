import * as THREE from 'three';

export class Player {
    constructor(scene, textureLoader) {
        this.scene = scene;

        this.light = new THREE.PointLight(0xffffff, 0.3);
        this.light.position.set(0, 0.2, 0);
        this.scene.add(this.light);

        const tileTexture = textureLoader.load('/textures/tile-marker.png');
        const tileMaterial = new THREE.MeshBasicMaterial({
            map: tileTexture,
            transparent: true,
            depthWrite: false,
        });

        const tileGeometry = new THREE.PlaneGeometry(1, 1);
        this.tileMarker = new THREE.Mesh(tileGeometry, tileMaterial);
        this.tileMarker.rotation.x = -Math.PI / 2;
        this.tileMarker.position.set(0, 0.01, 0);
        this.scene.add(this.tileMarker);

        const lightHelperGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const lightHelperMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const lightHelper = new THREE.Mesh(lightHelperGeometry, lightHelperMaterial);
        this.light.add(lightHelper);

        this.hopDistance = 1;
        this.hopHeight = 0.5;
        this.hopDuration = 200;
        this.isHopping = false;
        this.queuedDirection = null;
        this.lastInputTime = 0;
        this.inputDebounce = 150;

        window.addEventListener("keydown", (e) => this.onKeyDown(e));
    }

    onKeyDown(e) {
        const validKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
        if (validKeys.includes(e.key)) {
            e.preventDefault();
            this.hop(e.key);
        }
    }

    hop(direction) {
        const now = performance.now();

        if (now - this.lastInputTime < this.inputDebounce) return;
        this.lastInputTime = now;

        if (this.isHopping) {
            this.queuedDirection = direction;
            return;
        }

        this.executeHop(direction);
    }

    executeHop(direction) {
        this.isHopping = true;
        const startTime = performance.now();
        const startPos = this.light.position.clone();

        this.tileMarker.visible = false;

        let dx = 0,
            dz = 0;
        if (direction === "ArrowUp") dz = -this.hopDistance;
        if (direction === "ArrowDown") dz = this.hopDistance;
        if (direction === "ArrowLeft") dx = -this.hopDistance;
        if (direction === "ArrowRight") dx = this.hopDistance;

        const endPos = startPos.clone().add(new THREE.Vector3(dx, 0, dz));

        const animateHop = (currentTime) => {
            const elapsed = currentTime - startTime;
            const t = Math.min(elapsed / this.hopDuration, 1);
            const smoothT = t * t * (3 - 2 * t);
            this.light.position.lerpVectors(startPos, endPos, smoothT);

            const yOffset = Math.sin(Math.PI * smoothT) * this.hopHeight;
            this.light.position.y = startPos.y + yOffset;

            if (t < 1) {
                requestAnimationFrame(animateHop);
            } else {
                this.light.position.set(endPos.x, startPos.y, endPos.z);
                this.tileMarker.position.set(endPos.x, 0.01, endPos.z);
                this.tileMarker.visible = true;
                this.isHopping = false;

                if (this.queuedDirection) {
                    const nextDirection = this.queuedDirection;
                    this.queuedDirection = null;
                    setTimeout(() => this.executeHop(nextDirection));
                }
            }
        };

        requestAnimationFrame(animateHop);
    }
}