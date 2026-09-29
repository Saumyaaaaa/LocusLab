// Procedural canvas floor textures: wood planks, kitchen tiles, bathroom tiles, and bedroom carpet.
// Generated in-memory on HTML5 Canvas without any external network asset dependencies.
import * as THREE from 'three';

// Cache generated textures to avoid redundant canvas draw operations
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Procedural wood plank texture with plank boundaries and subtle grain variations.
 */
export function getWoodPlankTexture(
  baseColor = '#c29b68',
  plankColor = '#a8804c',
  borderColor = '#78562d'
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const cacheKey = `wood_${baseColor}_${plankColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 512, 512);

    // Render continuous longitudinal hardwood floorboards (vertical tongue-and-groove boards)
    // No horizontal staggered seams, guaranteeing zero resemblance to brick masonry or fences.
    const numBoards = 8;
    const boardWidth = 512 / numBoards;

    for (let b = 0; b < numBoards; b++) {
      const x = b * boardWidth;
      const shadeOffset = ((b * 17) % 11) - 5;
      ctx.fillStyle = shadeOffset > 0 ? baseColor : plankColor;
      ctx.fillRect(x + 1, 0, boardWidth - 2, 512);

      // Fine parallel wood grain lines along board length
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 0.75;
      for (let g = 0; g < 3; g++) {
        const gx = x + (boardWidth * (g + 1)) / 4;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.bezierCurveTo(
          gx + ((g % 2 === 0 ? 2 : -2)),
          170,
          gx - ((g % 2 === 0 ? 2 : -2)),
          340,
          gx,
          512
        );
        ctx.stroke();
      }

      // Clean longitudinal board seam
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural square tile texture with clean grout joints.
 */
export function getTileTexture(
  tileColor = '#f8fafc',
  groutColor = '#94a3b8',
  tileSize = 64
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const cacheKey = `tile_${tileColor}_${groutColor}_${tileSize}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = groutColor;
    ctx.fillRect(0, 0, 256, 256);

    const count = 256 / tileSize;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        // Tile surface with slight specular highlight gradient
        const grad = ctx.createLinearGradient(
          x * tileSize,
          y * tileSize,
          (x + 1) * tileSize,
          (y + 1) * tileSize
        );
        grad.addColorStop(0, tileColor);
        grad.addColorStop(1, '#e2e8f0');

        ctx.fillStyle = grad;
        ctx.fillRect(x * tileSize + 2, y * tileSize + 2, tileSize - 4, tileSize - 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}

/**
 * Procedural aqua/teal bathroom tile texture.
 */
export function getBathroomTileTexture(): THREE.CanvasTexture {
  return getTileTexture('#e0f2fe', '#0284c7', 48);
}

/**
 * Procedural soft woven carpet texture.
 */
export function getCarpetTexture(
  baseColor = '#ede9fe',
  tuftColor = '#c4b5fd'
): THREE.CanvasTexture {
  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture({} as any);
  }

  const cacheKey = `carpet_${baseColor}_${tuftColor}`;
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Stippled tuft weave
    ctx.fillStyle = tuftColor;
    for (let i = 0; i < 2500; i++) {
      const x = (i * 37) % 256;
      const y = (i * 59) % 256;
      const radius = 1 + ((i % 3) * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);
  return texture;
}
