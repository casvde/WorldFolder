function getBiasedLandTile(tileVariants) {
    const weights = Array.from({ length: tileVariants }, (_, i) => tileVariants - i);
    const total = weights.reduce((sum, w) => sum + w, 0);
    const probs = weights.map(w => w / total);
    const rand = Math.random();
    let cumulative = 0;

    for (let i = 0; i < probs.length; i++) {
        cumulative += probs[i];
        if (rand < cumulative) {
            return i + 1;
        }
    }

    return tileVariants;
}

function isNearLand(grid, x, y) {
    const height = grid.length;
    const width = grid[0].length;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[ny][nx] > 0) return true;
            }
        }
    }
    return false;
}

function countSurroundingLand(grid, x, y) {
    const height = grid.length;
    const width = grid[0].length;
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx, ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] > 0) {
                count++;
            }
        }
    }
    return count;
}

function smoothGrid(grid, tileVariants) {
    const height = grid.length;
    const width = grid[0].length;
    const newGrid = Array.from({ length: height }, () => Array(width).fill(0));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const landCount = countSurroundingLand(grid, x, y);
            newGrid[y][x] = landCount >= 5 ? getBiasedLandTile(tileVariants) : 0;
        }
    }

    return newGrid;
}

function floodFill(grid, x, y) {
    const height = grid.length;
    const width = grid[0].length;
    const stack = [[x, y]];
    const visited = new Set([`${x},${y}`]);

    while (stack.length > 0) {
        const [cx, cy] = stack.pop();
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]]) {
            const nx = cx + dx;
            const ny = cy + dy;
            const key = `${nx},${ny}`;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height && grid[ny][nx] > 0 && !visited.has(key)) {
                visited.add(key);
                stack.push([nx, ny]);
            }
        }
    }

    return visited;
}

function removeFloatingIslands(grid) {
    const height = grid.length;
    const width = grid[0].length;
    let startX = -1, startY = -1;

    outer: for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] > 0) {
                startX = x;
                startY = y;
                break outer;
            }
        }
    }

    if (startX === -1) return grid;

    const connected = floodFill(grid, startX, startY);

    return grid.map((row, y) =>
        row.map((val, x) => (val > 0 && !connected.has(`${x},${y}`)) ? 0 : val)
    );
}

function generateBlobIsland(width, height, margin = 3, maxIterations = 1000, smoothingIterations = 5, tileVariants = 3) {
    let grid = Array.from({ length: height }, () => Array(width).fill(0));
    const startX = Math.floor(width / 2);
    const startY = Math.floor(height / 2);
    grid[startY][startX] = getBiasedLandTile(tileVariants);

    for (let i = 0; i < maxIterations; i++) {
        const x = Math.floor(Math.random() * (width - 2 * margin)) + margin;
        const y = Math.floor(Math.random() * (height - 2 * margin)) + margin;
        if (isNearLand(grid, x, y)) {
            grid[y][x] = getBiasedLandTile(tileVariants);
        }
    }

    for (let i = 0; i < smoothingIterations; i++) {
        grid = smoothGrid(grid, tileVariants);
    }

    return removeFloatingIslands(grid);
}

function generateBackgroundTiles(width, height, tileVariants = 3, landRatio = 0.15) {
    const grid = Array.from({ length: height }, () => Array(width).fill(0));
    const totalTiles = width * height;
    const landTilesCount = Math.floor(totalTiles * landRatio);

    const positions = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            positions.push([x, y]);
        }
    }

    for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    for (let i = 0; i < landTilesCount; i++) {
        const [x, y] = positions[i];
        grid[y][x] = 1 + Math.floor(Math.random() * tileVariants);
    }

    return grid;
}


function createPadding(grid, randomMax = 1) {
    const height = grid.length;
    const width = grid[0].length;
    const padded = Array.from({ length: height }, () => Array(width).fill(0));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] > 0) {
                padded[y][x] = 1;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx, ny = y + dy;
                        if (
                            nx >= 0 && nx < width &&
                            ny >= 0 && ny < height &&
                            grid[ny][nx] === 0
                        ) {
                            padded[ny][nx] = 1;
                        }
                    }
                }
            }
        }
    }

    if (randomMax > 1) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (padded[y][x] === 1) {
                    padded[y][x] = Math.floor(Math.random() * randomMax) + 1;
                }
            }
        }
    }

    return padded;
}

function createIndexedPadding(grid) {
    const height = grid.length;
    if (height === 0) return [];
    const width = grid[0].length;
    const indexed = Array(height);
    for (let i = 0; i < height; i++) indexed[i] = new Array(width).fill(0);

    const N = 1 << 0, E = 1 << 1, S = 1 << 2, W = 1 << 3;
    const NE = 1, NW = 3, SE = 5, SW = 7;
    const cardinals = [
        [-1, 0, N],  // N
        [0, 1, E],    // E
        [1, 0, S],    // S
        [0, -1, W],    // W
    ];

    const diagonals = [
        [1, 1, 9],    // br
        [1, -1, 10],   // bl
        [-1, -1, 11],  // tl
        [-1, 1, 12],   // tr
    ];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] !== 0) continue;

            let cardinalMask = 0;
            let diagonalResult = 0;
            for (const [dy, dx, flag] of cardinals) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width && grid[ny][nx] > 0) {
                    cardinalMask |= flag;
                }
            }

            if (cardinalMask) {
                if ((cardinalMask & N) && (cardinalMask & E)) indexed[y][x] = NE;
                else if ((cardinalMask & N) && (cardinalMask & W)) indexed[y][x] = NW;
                else if ((cardinalMask & S) && (cardinalMask & E)) indexed[y][x] = SE;
                else if ((cardinalMask & S) && (cardinalMask & W)) indexed[y][x] = SW;
                else indexed[y][x] = (cardinalMask & N) ? 2 : 
                                    (cardinalMask & E) ? 4 :
                                    (cardinalMask & S) ? 6 : 8;
                continue;
            }

            const diagonalPairs = new Set();
            for (const [dy, dx, value] of diagonals) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < height && nx >= 0 && nx < width && grid[ny][nx] > 0) {
                    if (diagonalResult === 0) diagonalResult = value;
                    diagonalPairs.add(value);
                }
            }

            if (diagonalPairs.size > 0) {
                if (diagonalPairs.has(9) && diagonalPairs.has(11)) indexed[y][x] = 13;
                else if (diagonalPairs.has(10) && diagonalPairs.has(12)) indexed[y][x] = 14;
                else indexed[y][x] = diagonalResult;
            }
        }
    }

    return indexed;
}

function printGrid(grid) {
    grid.forEach(row => console.log(row.join(' ')));
}

function createColliders(grid, tileSize = 1, offset = { x: 0, y: 0, z: 0 }) {
    const height = grid.length;
    if (height === 0) return [];
    const width = grid[0].length;

    const colliders = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (grid[y][x] !== 0) {
                colliders.push({
                    position: {
                        x: x * tileSize + offset.x,
                        y: offset.y,
                        z: y * tileSize + offset.z
                    },
                    size: tileSize
                });
            }
        }
    }

    return colliders;
}







export {
    generateBlobIsland,
    generateBackgroundTiles,
    getBiasedLandTile,
    isNearLand,
    countSurroundingLand,
    smoothGrid,
    floodFill,
    removeFloatingIslands,
    createPadding,
    createIndexedPadding,
    printGrid,
    createColliders
};
