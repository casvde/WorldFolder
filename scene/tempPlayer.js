import * as THREE from 'three';

export class Player {
    constructor(scene, textureLoader , triggerShake, wallColliders) {
        this.scene = scene;
        this.triggerShake = triggerShake;
        this.wallColliders = wallColliders;

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
        this.tileMarker.position.set(0, 0.03, 0);
        this.scene.add(this.tileMarker);

        const lightHelperGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const lightHelperMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff
        });
        const lightHelper = new THREE.Mesh(lightHelperGeometry, lightHelperMaterial);
        this.light.add(lightHelper);

        this.hopDistance = 1;
        this.hopHeight = 0.5;
        this.hopDuration = 100;
        this.hopCooldown = 150; 
        this.isHopping = false;
        this.queuedDirection = null;
        this.lastInputTime = 0;
        this.inputDebounce = 50;

        window.addEventListener("keydown", (e) => this.onKeyDown(e));
    }
    

    onKeyDown(e) {
        const validKeys = ["w", "s", "a", "d"];
        if (validKeys.includes(e.key)) {
            e.preventDefault();
            this.hop(e.key);
        }
    }

    hop(direction, force = false) {
        const now = performance.now();

        if (!force && now - this.lastInputTime < this.inputDebounce) return;
        this.lastInputTime = now;

        if (this.isHopping) {
            this.queuedDirection = direction;
            return;
        }

        let dx = 0, dz = 0;
        if (direction === "w") dz = -1;
        if (direction === "s") dz = 1;
        if (direction === "a") dx = -1;
        if (direction === "d") dx = 1;

        const currentX = Math.round(this.light.position.x);
        const currentZ = Math.round(this.light.position.z);
        const targetX = currentX + dx;
        const targetZ = currentZ + dz;

        const blocked = this.wallColliders.some(collider => {
            const colX = Math.round(collider.position.x);
            const colZ = Math.round(collider.position.z);
            return colX === targetX && colZ === targetZ;
        });

        if (blocked) {
            this.triggerShake(0.6, 0.2);
            return;
        }

        this.executeHop(direction);
    }


    executeHop(direction) {
        this.isHopping = true;
        const startTime = performance.now();
        const startPos = this.light.position.clone();

        this.tileMarker.visible = false;

        let dx = 0, dz = 0;
        if (direction === "w") dz = -this.hopDistance;
        if (direction === "s") dz = this.hopDistance;
        if (direction === "a") dx = -this.hopDistance;
        if (direction === "d") dx = this.hopDistance;

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
                this.tileMarker.position.set(endPos.x, 0.05, endPos.z);
                this.tileMarker.visible = true;

            setTimeout(() => {
                this.isHopping = false;
            
                if (this.queuedDirection) {
                    const nextDirection = this.queuedDirection;
                    this.queuedDirection = null;
                    this.hop(nextDirection, true);
                }
            }, this.hopCooldown);
            }
        };

        requestAnimationFrame(animateHop);
    }

}
