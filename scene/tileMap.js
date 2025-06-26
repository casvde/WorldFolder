import * as THREE from 'three';

export function createTileMap({
    texture,
    tileMap,
    tileSize = 1,
    tileWidth = 16,
    tileHeight = 16,
    offset = {
        x: 0,
        y: 0,
        z: 0
    },
    rotation = {
        x: 0,
        y: 0,
        z: 0
    },
    scene
}) {
    const imageWidth = texture.image.width;
    const imageHeight = texture.image.height;

    const tilesPerRow = Math.floor(imageWidth / tileWidth);
    const tilesPerColumn = Math.floor(imageHeight / tileHeight);

    const group = new THREE.Group();

    for (let y = 0; y < tileMap.length; y++) {
        for (let x = 0; x < tileMap[y].length; x++) {
            const tileIndex = tileMap[y][x];
            if (tileIndex < 0) continue;

            const tileCol = tileIndex % tilesPerRow;
            const tileRow = Math.floor(tileIndex / tilesPerRow);
            const tileRowFlipped = tilesPerColumn - 1 - tileRow;

            const u0 = tileCol / tilesPerRow;
            const v0 = tileRowFlipped / tilesPerColumn;
            const u1 = (tileCol + 1) / tilesPerRow;
            const v1 = (tileRowFlipped + 1) / tilesPerColumn;

            const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
            const uvs = geometry.attributes.uv.array;

            uvs[0] = u0;
            uvs[1] = v1;
            uvs[2] = u1;
            uvs[3] = v1;
            uvs[4] = u0;
            uvs[5] = v0;
            uvs[6] = u1;
            uvs[7] = v0;

            geometry.attributes.uv.needsUpdate = true;

            const material = new THREE.MeshStandardMaterial({
                map: texture,
                transparent: true
            });

            const tileMesh = new THREE.Mesh(geometry, material);
            tileMesh.position.set(x * tileSize, -y * tileSize, 0);
            group.add(tileMesh);
        }
    }

    group.position.set(offset.x, offset.y, offset.z);
    group.rotation.set(rotation.x, rotation.y, rotation.z);

    scene.add(group);
    return group;
}