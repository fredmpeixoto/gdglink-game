// Pokémon Game Boy Map Engine (Pallet Town / Route Link)

export const TILE_SIZE = 24; // Base pixel size for each map tile
export const MAP_COLS = 36;
export const MAP_ROWS = 30;
export const WORLD_WIDTH = MAP_COLS * TILE_SIZE;
export const WORLD_HEIGHT = MAP_ROWS * TILE_SIZE;

export enum TileType {
  GRASS = 0,
  PATH = 1,
  FLOWER = 2,
  TREE = 3,
  WATER = 4,
  FENCE = 5,
  HOUSE_WALL = 6,
  HOUSE_ROOF_RED = 7,
  HOUSE_ROOF_BLUE = 8,
  DOOR = 9,
  SIGNPOST = 10,
  TALL_GRASS = 11,
}

// Generate the classic Route 1 / Pallet Town layout
export function generateMap(): TileType[][] {
  const map: TileType[][] = [];

  for (let r = 0; r < MAP_ROWS; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // Outer border trees
      if (r === 0 || r === MAP_ROWS - 1 || c === 0 || c === MAP_COLS - 1) {
        row.push(TileType.TREE);
        continue;
      }

      // Main dirt pathways
      const isHorizontalPath1 = r >= 13 && r <= 15 && c >= 2 && c <= 33;
      const isVerticalPath1 = c >= 10 && c <= 12 && r >= 3 && r <= 26;
      const isVerticalPath2 = c >= 24 && c <= 26 && r >= 5 && r <= 26;
      const isHorizontalPath2 = r >= 24 && r <= 25 && c >= 6 && c <= 30;

      if (isHorizontalPath1 || isVerticalPath1 || isVerticalPath2 || isHorizontalPath2) {
        row.push(TileType.PATH);
        continue;
      }

      // Pond in bottom-left
      if (r >= 18 && r <= 22 && c >= 3 && c <= 8) {
        row.push(TileType.WATER);
        continue;
      }

      // House 1 (Red Roof - Top Left)
      if (r >= 4 && r <= 6 && c >= 3 && c <= 8) {
        row.push(TileType.HOUSE_ROOF_RED);
        continue;
      }
      if (r >= 7 && r <= 9 && c >= 3 && c <= 8) {
        if (r === 9 && c === 5) {
          row.push(TileType.DOOR);
        } else {
          row.push(TileType.HOUSE_WALL);
        }
        continue;
      }

      // House 2 (Blue Roof - Top Right)
      if (r >= 4 && r <= 6 && c >= 28 && c <= 33) {
        row.push(TileType.HOUSE_ROOF_BLUE);
        continue;
      }
      if (r >= 7 && r <= 9 && c >= 28 && c <= 33) {
        if (r === 9 && c === 30) {
          row.push(TileType.DOOR);
        } else {
          row.push(TileType.HOUSE_WALL);
        }
        continue;
      }

      // House 3 (PokeCenter / Network Hub - Center)
      if (r >= 4 && r <= 6 && c >= 15 && c <= 21) {
        row.push(TileType.HOUSE_ROOF_RED);
        continue;
      }
      if (r >= 7 && r <= 9 && c >= 15 && c <= 21) {
        if (r === 9 && c === 18) {
          row.push(TileType.DOOR);
        } else {
          row.push(TileType.HOUSE_WALL);
        }
        continue;
      }

      // Signposts
      if ((r === 10 && c === 6) || (r === 10 && c === 19) || (r === 16 && c === 11)) {
        row.push(TileType.SIGNPOST);
        continue;
      }

      // Fences along routes
      if (r === 12 && ((c >= 4 && c <= 9) || (c >= 14 && c <= 22) || (c >= 28 && c <= 33))) {
        row.push(TileType.FENCE);
        continue;
      }

      // Flower patches
      if ((r === 11 && (c === 4 || c === 7 || c === 29 || c === 32)) ||
          (r === 17 && (c === 7 || c === 8 || c === 21 || c === 22))) {
        row.push(TileType.FLOWER);
        continue;
      }

      // Tall grass wild zones (Pokémon catching / networking areas)
      if (r >= 18 && r <= 23 && c >= 14 && c <= 22) {
        row.push(TileType.TALL_GRASS);
        continue;
      }

      if (r >= 18 && r <= 23 && c >= 28 && c <= 33) {
        row.push(TileType.TALL_GRASS);
        continue;
      }

      // Cluster of trees for natural obstacles
      if ((r === 2 && (c === 13 || c === 14 || c === 22 || c === 23)) ||
          (r === 27 && (c >= 3 && c <= 7))) {
        row.push(TileType.TREE);
        continue;
      }

      // Default grass
      row.push(TileType.GRASS);
    }
    map.push(row);
  }

  return map;
}

export const MAP_DATA = generateMap();

/**
 * Checks if a given world pixel coordinate is blocked by obstacles
 */
export function isPositionBlocked(x: number, y: number, radius = 8): boolean {
  // Check bounds
  if (x - radius < 0 || x + radius >= WORLD_WIDTH || y - radius < 0 || y + radius >= WORLD_HEIGHT) {
    return true;
  }

  // Check 4 corner points around the player hit circle
  const points = [
    { x: x - radius, y: y - radius },
    { x: x + radius, y: y - radius },
    { x: x - radius, y: y + radius },
    { x: x + radius, y: y + radius }
  ];

  for (const pt of points) {
    const col = Math.floor(pt.x / TILE_SIZE);
    const row = Math.floor(pt.y / TILE_SIZE);

    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return true;

    const tile = MAP_DATA[row][col];
    // Solid non-walkable tiles
    if (
      tile === TileType.TREE ||
      tile === TileType.WATER ||
      tile === TileType.FENCE ||
      tile === TileType.HOUSE_WALL ||
      tile === TileType.HOUSE_ROOF_RED ||
      tile === TileType.HOUSE_ROOF_BLUE ||
      tile === TileType.SIGNPOST
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Render the map tiles on the canvas
 */
export function drawMap(ctx: CanvasRenderingContext2D, cameraX: number, cameraY: number, viewW: number, viewH: number) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const startCol = Math.max(0, Math.floor(cameraX / TILE_SIZE));
  const endCol = Math.min(MAP_COLS - 1, Math.ceil((cameraX + viewW) / TILE_SIZE));
  const startRow = Math.max(0, Math.floor(cameraY / TILE_SIZE));
  const endRow = Math.min(MAP_ROWS - 1, Math.ceil((cameraY + viewH) / TILE_SIZE));

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const tile = MAP_DATA[r][c];
      const screenX = Math.round(c * TILE_SIZE - cameraX);
      const screenY = Math.round(r * TILE_SIZE - cameraY);

      // Base background: Grass or Path
      if (tile === TileType.PATH) {
        ctx.fillStyle = '#e5c48b'; // warm dirt path
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Path pebbles
        ctx.fillStyle = '#c8a66d';
        ctx.fillRect(screenX + 3, screenY + 4, 2, 2);
        ctx.fillRect(screenX + 16, screenY + 12, 3, 2);
        ctx.fillRect(screenX + 8, screenY + 18, 2, 2);
      } else {
        // Base grass
        ctx.fillStyle = '#78b84d'; // retro Game Boy color green
        ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);

        // Subtle grass blades
        ctx.fillStyle = '#5c9635';
        ctx.fillRect(screenX + 4, screenY + 6, 2, 3);
        ctx.fillRect(screenX + 16, screenY + 14, 2, 3);
      }

      // Overlays
      switch (tile) {
        case TileType.FLOWER: {
          const flowerColors = ['#ea4335', '#fbbc05', '#ffffff', '#4285f4'];
          const fColor = flowerColors[(r + c) % flowerColors.length];
          // Petals
          ctx.fillStyle = fColor;
          ctx.fillRect(screenX + 6, screenY + 6, 4, 4);
          ctx.fillRect(screenX + 14, screenY + 12, 4, 4);
          // Center
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(screenX + 7, screenY + 7, 2, 2);
          ctx.fillRect(screenX + 15, screenY + 13, 2, 2);
          break;
        }

        case TileType.TALL_GRASS: {
          // Classic Pokémon Route 1 tall grass
          ctx.fillStyle = '#4c8728';
          ctx.fillRect(screenX + 1, screenY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.fillStyle = '#316315';
          for (let i = 2; i < TILE_SIZE - 4; i += 5) {
            ctx.fillRect(screenX + i, screenY + 3, 3, 16);
            ctx.fillStyle = '#7ac943';
            ctx.fillRect(screenX + i + 1, screenY + 1, 1, 3);
            ctx.fillStyle = '#316315';
          }
          break;
        }

        case TileType.TREE: {
          // Pine / oak tree
          ctx.fillStyle = '#2d5a1e'; // dark foliage
          ctx.fillRect(screenX + 2, screenY + 1, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.fillStyle = '#41822c'; // highlight foliage
          ctx.fillRect(screenX + 4, screenY + 3, TILE_SIZE - 8, TILE_SIZE - 8);
          // Trunk base
          ctx.fillStyle = '#5a381e';
          ctx.fillRect(screenX + 9, screenY + 16, 6, 8);
          break;
        }

        case TileType.WATER: {
          ctx.fillStyle = '#3b82f6'; // vibrant retro water
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          // Waves
          ctx.fillStyle = '#93c5fd';
          const waveShift = Math.floor((Date.now() / 400) % 4);
          ctx.fillRect(screenX + 3 + waveShift, screenY + 6, 6, 2);
          ctx.fillRect(screenX + 12 - waveShift, screenY + 14, 8, 2);
          break;
        }

        case TileType.FENCE: {
          ctx.fillStyle = '#8b5a2b';
          // Horizontal rails
          ctx.fillRect(screenX, screenY + 6, TILE_SIZE, 3);
          ctx.fillRect(screenX, screenY + 14, TILE_SIZE, 3);
          // Posts
          ctx.fillRect(screenX + 2, screenY + 2, 4, 18);
          ctx.fillRect(screenX + 18, screenY + 2, 4, 18);
          // Highlight
          ctx.fillStyle = '#d49b6a';
          ctx.fillRect(screenX + 3, screenY + 3, 2, 16);
          break;
        }

        case TileType.HOUSE_ROOF_RED: {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          // Tile lines
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(screenX, screenY + 10, TILE_SIZE, 2);
          ctx.fillRect(screenX, screenY + 20, TILE_SIZE, 2);
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
          break;
        }

        case TileType.HOUSE_ROOF_BLUE: {
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          ctx.fillStyle = '#1e40af';
          ctx.fillRect(screenX, screenY + 10, TILE_SIZE, 2);
          ctx.fillRect(screenX, screenY + 20, TILE_SIZE, 2);
          ctx.fillStyle = '#60a5fa';
          ctx.fillRect(screenX + 2, screenY + 2, TILE_SIZE - 4, 2);
          break;
        }

        case TileType.HOUSE_WALL: {
          ctx.fillStyle = '#f5f5f4'; // warm stone/wood siding
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          // Window
          ctx.fillStyle = '#67e8f9';
          ctx.fillRect(screenX + 5, screenY + 5, 8, 8);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 5, screenY + 5, 8, 8);
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(screenX + 8, screenY + 5, 1, 8);
          ctx.fillRect(screenX + 5, screenY + 8, 8, 1);
          break;
        }

        case TileType.DOOR: {
          ctx.fillStyle = '#f5f5f4';
          ctx.fillRect(screenX, screenY, TILE_SIZE, TILE_SIZE);
          // Door frame & mat
          ctx.fillStyle = '#78350f';
          ctx.fillRect(screenX + 4, screenY + 2, 16, 22);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(screenX + 6, screenY + 4, 12, 18);
          // Knob
          ctx.fillStyle = '#facc15';
          ctx.fillRect(screenX + 15, screenY + 13, 2, 2);
          // Doorstep mat
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(screenX + 2, screenY + 20, 20, 4);
          break;
        }

        case TileType.SIGNPOST: {
          ctx.fillStyle = '#a16207';
          // Post
          ctx.fillRect(screenX + 10, screenY + 10, 4, 12);
          // Board
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(screenX + 4, screenY + 4, 16, 10);
          ctx.strokeStyle = '#713f12';
          ctx.lineWidth = 1;
          ctx.strokeRect(screenX + 4, screenY + 4, 16, 10);
          // Text lines
          ctx.fillStyle = '#713f12';
          ctx.fillRect(screenX + 6, screenY + 7, 12, 1);
          ctx.fillRect(screenX + 6, screenY + 10, 8, 1);
          break;
        }
      }
    }
  }

  ctx.restore();
}
