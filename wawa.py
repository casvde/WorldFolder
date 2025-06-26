import random

def generate_blob_island(width, height, margin=3, max_iterations=1000, smoothing_iterations=5, tile_variants=3):
    grid = [[0 for _ in range(width)] for _ in range(height)]

    start_x, start_y = width // 2, height // 2

    # begin center with a biased land tile
    grid[start_y][start_x] = get_biased_land_tile(tile_variants)

    for _ in range(max_iterations):
        x, y = random.randint(margin, width - margin - 1), random.randint(margin, height - margin - 1)

        if is_near_land(grid, x, y):
            grid[y][x] = get_biased_land_tile(tile_variants)

    for _ in range(smoothing_iterations):
        grid = smooth_grid(grid, tile_variants)

    grid = remove_floating_islands(grid)

    return grid

def get_biased_land_tile(tile_variants):
    """
    Returns a land tile index (1 to tile_variants) with a bias toward lower numbers.
    For example, with tile_variants = 3:
    - Tile 1 might have a 50% chance
    - Tile 2 a 33% chance
    - Tile 3 a 17% chance
    """
    weights = [tile_variants - i for i in range(tile_variants)]
    total = sum(weights)
    probs = [w / total for w in weights]
    return random.choices(range(1, tile_variants + 1), weights=probs)[0]

def is_near_land(grid, x, y):
    height = len(grid)
    width = len(grid[0])
    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            if dy == 0 and dx == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if grid[ny][nx] > 0:
                    return True
    return False

def smooth_grid(grid, tile_variants):
    height = len(grid)
    width = len(grid[0])
    new_grid = [[0 for _ in range(width)] for _ in range(height)]

    for y in range(height):
        for x in range(width):
            land_count = count_surrounding_land(grid, x, y)

            if land_count >= 5:
                new_grid[y][x] = get_biased_land_tile(tile_variants)
            else:
                new_grid[y][x] = 0

    return new_grid

def count_surrounding_land(grid, x, y):
    height = len(grid)
    width = len(grid[0])
    land_count = 0

    for dy in [-1, 0, 1]:
        for dx in [-1, 0, 1]:
            if dy == 0 and dx == 0:
                continue
            nx, ny = x + dx, y + dy
            if 0 <= nx < width and 0 <= ny < height:
                if grid[ny][nx] > 0:
                    land_count += 1

    return land_count

def flood_fill(grid, x, y, width, height):
    stack = [(x, y)]
    visited = set()
    visited.add((x, y))

    while stack:
        cx, cy = stack.pop()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited and grid[ny][nx] > 0:
                visited.add((nx, ny))
                stack.append((nx, ny))

    return visited

def remove_floating_islands(grid):
    height = len(grid)
    width = len(grid[0])
    start_x, start_y = -1, -1
    for y in range(height):
        for x in range(width):
            if grid[y][x] > 0:
                start_x, start_y = x, y
                break
        if start_x != -1:
            break

    if start_x == -1:
        return grid

    connected_land = flood_fill(grid, start_x, start_y, width, height)

    for y in range(height):
        for x in range(width):
            if grid[y][x] > 0 and (x, y) not in connected_land:
                grid[y][x] = 0

    return grid

def print_grid(grid):
    for row in grid:
        print(" ".join(str(cell) for cell in row))


def create_padding(grid):
    height = len(grid)
    width = len(grid[0])
    filled_stroke = [[0 for _ in range(width)] for _ in range(height)]

    for y in range(height):
        for x in range(width):
            if grid[y][x] > 0:
                filled_stroke[y][x] = 1

                for dy in [-1, 0, 1]:
                    for dx in [-1, 0, 1]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < width and 0 <= ny < height:
                            if grid[ny][nx] == 0:
                                filled_stroke[ny][nx] = 1
    return filled_stroke

def create_indexed_padding(grid):
    height = len(grid)
    width = len(grid[0])
    indexed_padding = [[0 for _ in range(width)] for _ in range(height)]

    directions = [
        (-1,  0),  # 1: Left
        (-1, -1),  # 2: Top-left
        ( 0, -1),  # 3: Top
        ( 1, -1),  # 4: Top-right
        ( 1,  0),  # 5: Right
        ( 1,  1),  # 6: Bottom-right
        ( 0,  1),  # 7: Bottom
        (-1,  1),  # 8: Bottom-left
    ]

    for y in range(height):
        for x in range(width):
            if grid[y][x] > 0:
                for idx, (dx, dy) in enumerate(directions):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if grid[ny][nx] == 0 and indexed_padding[ny][nx] == 0:
                            indexed_padding[ny][nx] = idx + 1  # shift index by +1

    return indexed_padding


width = 16
height = 10
margin = 2
max_iterations = 200
smoothing_iterations = 1
tile_variants = 3

island = generate_blob_island(width, height, margin, max_iterations, smoothing_iterations, tile_variants)
print("Island:")
print_grid(island)

outline = create_padding(island)
print("\nExternal Outline (stroke around land):")
print_grid(outline)

wall_outline = create_indexed_padding(outline)
print("\nWall Outline with Directional Indexes:")
print_grid(wall_outline)