import { AvatarStyle, Direction, GOOGLE_COLORS, SKIN_TONES } from '../types';

/**
 * Draws a 16x16 Game Boy style Pokémon trainer sprite onto a 2D Canvas context
 * @param ctx The CanvasRenderingContext2D
 * @param x Top-left X destination
 * @param y Top-left Y destination
 * @param scale Pixel multiplier (typically 2x or 3x for crisp retro look)
 * @param style Avatar styling (color, skin, hat, glasses)
 * @param direction Facing direction
 * @param walkFrame 0 = neutral, 1 = left step, 2 = right step
 * @param isFlashing If true, flashed white/semi-transparent (e.g. when hit)
 */
export function drawPokemonTrainer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  style: AvatarStyle,
  direction: Direction,
  walkFrame: number,
  isFlashing: boolean = false
) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const colorData = GOOGLE_COLORS[style.googleColor] || GOOGLE_COLORS.blue;
  const skinData = SKIN_TONES[style.skinTone] || SKIN_TONES[0];

  const cMain = colorData.hex;
  const cLight = colorData.light;
  const cDark = colorData.dark;
  const cBorder = '#1e293b';

  const sSkin = skinData.hex;
  const sShadow = skinData.shadow;

  const cHair = '#3e2723';
  const cPants = '#1e3a8a';
  const cShoes = '#f8fafc';
  const cShoeSole = '#dc2626';

  if (isFlashing) {
    ctx.filter = 'brightness(2) contrast(1.5)';
  }

  // Helper to draw a single 1x1 pixel (scaled)
  const p = (px: number, py: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x + px * scale), Math.round(y + py * scale), scale, scale);
  };

  // Helper to draw a rectangle of pixels
  const rect = (px: number, py: number, w: number, h: number, fill: string) => {
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(x + px * scale), Math.round(y + py * scale), Math.round(w * scale), Math.round(h * scale));
  };

  // Walk bobbing (1px vertical offset when stepping)
  const bobY = walkFrame !== 0 ? 1 : 0;

  // 1. Shadow underneath
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(
    x + 8 * scale,
    y + 15 * scale,
    5.5 * scale,
    2.2 * scale,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  if (direction === 'down') {
    // === FACING DOWN ===
    // Hair base / Head outline
    rect(5, 2 + bobY, 6, 1, cBorder);
    rect(4, 3 + bobY, 8, 5, cBorder);

    // Hat or Hair
    if (style.hasHat) {
      // Trainer Cap (Google Color)
      rect(5, 2 + bobY, 6, 2, cMain);
      rect(4, 3 + bobY, 8, 2, cMain);
      // Front visor
      rect(3, 5 + bobY, 10, 1, cLight);
      // Cap Logo (Poke-ball white dot)
      p(7, 3 + bobY, '#ffffff');
      p(8, 3 + bobY, '#ffffff');
      // Hair peeking under hat
      p(4, 5 + bobY, cHair);
      p(11, 5 + bobY, cHair);
    } else {
      // Natural Spiky Anime Hair
      rect(5, 2 + bobY, 6, 2, cHair);
      rect(4, 3 + bobY, 8, 3, cHair);
      // Spikes
      p(3, 3 + bobY, cHair);
      p(12, 3 + bobY, cHair);
      p(6, 1 + bobY, cHair);
      p(9, 1 + bobY, cHair);
    }

    // Face / Skin
    rect(5, 5 + bobY, 6, 3, sSkin);
    rect(6, 8 + bobY, 4, 1, sShadow);

    // Eyes
    p(6, 6 + bobY, '#0f172a');
    p(9, 6 + bobY, '#0f172a');

    // Glasses
    if (style.hasGlasses) {
      rect(5, 6 + bobY, 3, 1, '#000000');
      rect(8, 6 + bobY, 3, 1, '#000000');
      p(7, 6 + bobY, '#334155'); // Bridge
      p(5, 6 + bobY, '#e2e8f0'); // Glare
      p(8, 6 + bobY, '#e2e8f0'); // Glare
    }

    // Shirt / Jacket
    rect(5, 9 + bobY, 6, 4, cMain);
    // Inner shirt collar
    p(7, 9 + bobY, '#ffffff');
    p(8, 9 + bobY, '#ffffff');
    p(7, 10 + bobY, '#ffffff');
    p(8, 10 + bobY, '#ffffff');

    // Arms
    rect(4, 9 + bobY, 1, 3, cDark);
    rect(11, 9 + bobY, 1, 3, cDark);
    p(4, 12 + bobY, sSkin);
    p(11, 12 + bobY, sSkin);

    // Belt
    rect(5, 12 + bobY, 6, 1, '#0f172a');
    p(7, 12 + bobY, '#fbbf24'); // buckle

    // Pants & Legs (with walk animation)
    if (walkFrame === 1) {
      // Left foot forward
      rect(5, 13, 2, 2, cPants);
      rect(5, 15, 2, 1, cShoes);
      p(5, 15, cShoeSole);

      rect(9, 13 + bobY, 2, 1, cPants);
      rect(9, 14 + bobY, 2, 1, cShoes);
    } else if (walkFrame === 2) {
      // Right foot forward
      rect(5, 13 + bobY, 2, 1, cPants);
      rect(5, 14 + bobY, 2, 1, cShoes);

      rect(9, 13, 2, 2, cPants);
      rect(9, 15, 2, 1, cShoes);
      p(10, 15, cShoeSole);
    } else {
      // Neutral standing
      rect(5, 13, 2, 2, cPants);
      rect(9, 13, 2, 2, cPants);
      rect(5, 15, 2, 1, cShoes);
      rect(9, 15, 2, 1, cShoes);
    }
  } else if (direction === 'up') {
    // === FACING UP (BACK) ===
    // Head / Hair back
    rect(4, 2 + bobY, 8, 6, cHair);

    if (style.hasHat) {
      // Hat back
      rect(4, 2 + bobY, 8, 4, cMain);
      rect(5, 1 + bobY, 6, 1, cLight);
      // Hair showing at bottom of neck
      rect(5, 6 + bobY, 6, 2, cHair);
    }

    // Jacket Back & Backpack
    rect(4, 8 + bobY, 8, 5, cMain);
    // Google colored Backpack
    rect(6, 8 + bobY, 4, 4, cDark);
    p(7, 8 + bobY, '#facc15'); // Yellow buckle/zipper
    p(8, 8 + bobY, '#facc15');

    // Arms
    rect(3, 8 + bobY, 1, 4, cDark);
    rect(12, 8 + bobY, 1, 4, cDark);

    // Legs
    if (walkFrame === 1) {
      rect(5, 13, 2, 2, cPants);
      rect(5, 15, 2, 1, cShoes);
      rect(9, 13 + bobY, 2, 1, cPants);
      rect(9, 14 + bobY, 2, 1, cShoes);
    } else if (walkFrame === 2) {
      rect(5, 13 + bobY, 2, 1, cPants);
      rect(5, 14 + bobY, 2, 1, cShoes);
      rect(9, 13, 2, 2, cPants);
      rect(9, 15, 2, 1, cShoes);
    } else {
      rect(5, 13, 2, 2, cPants);
      rect(9, 13, 2, 2, cPants);
      rect(5, 15, 2, 1, cShoes);
      rect(9, 15, 2, 1, cShoes);
    }
  } else if (direction === 'left') {
    // === FACING LEFT ===
    // Hair & Hat
    if (style.hasHat) {
      rect(4, 2 + bobY, 7, 3, cMain);
      // Visor poking left
      rect(2, 4 + bobY, 4, 1, cLight);
      // Hair in back
      rect(9, 4 + bobY, 2, 3, cHair);
      // Face
      rect(4, 5 + bobY, 5, 3, sSkin);
    } else {
      rect(4, 2 + bobY, 7, 4, cHair);
      // Face
      rect(4, 5 + bobY, 5, 3, sSkin);
    }

    // Eye
    p(4, 6 + bobY, '#0f172a');

    // Glasses
    if (style.hasGlasses) {
      rect(3, 6 + bobY, 3, 1, '#000000');
      p(3, 6 + bobY, '#e2e8f0');
    }

    // Torso / Backpack
    rect(5, 9 + bobY, 5, 4, cMain);
    // Backpack sticking out right
    rect(9, 9 + bobY, 2, 4, cDark);

    // Arm (swings with walkFrame)
    if (walkFrame === 1) {
      rect(4, 9 + bobY, 2, 3, cDark);
      p(4, 12 + bobY, sSkin);
    } else if (walkFrame === 2) {
      rect(7, 9 + bobY, 2, 3, cDark);
      p(7, 12 + bobY, sSkin);
    } else {
      rect(6, 9 + bobY, 2, 3, cDark);
      p(6, 12 + bobY, sSkin);
    }

    // Pants & Shoes
    if (walkFrame === 1) {
      rect(4, 13, 3, 2, cPants);
      rect(3, 15, 3, 1, cShoes);
    } else if (walkFrame === 2) {
      rect(7, 13, 3, 2, cPants);
      rect(7, 15, 3, 1, cShoes);
    } else {
      rect(5, 13, 4, 2, cPants);
      rect(4, 15, 4, 1, cShoes);
    }
  } else {
    // === FACING RIGHT ===
    // Flip left horizontally for symmetry
    if (style.hasHat) {
      rect(5, 2 + bobY, 7, 3, cMain);
      // Visor poking right
      rect(10, 4 + bobY, 4, 1, cLight);
      // Hair in back
      rect(5, 4 + bobY, 2, 3, cHair);
      // Face
      rect(7, 5 + bobY, 5, 3, sSkin);
    } else {
      rect(5, 2 + bobY, 7, 4, cHair);
      // Face
      rect(7, 5 + bobY, 5, 3, sSkin);
    }

    // Eye
    p(11, 6 + bobY, '#0f172a');

    // Glasses
    if (style.hasGlasses) {
      rect(10, 6 + bobY, 3, 1, '#000000');
      p(11, 6 + bobY, '#e2e8f0');
    }

    // Torso / Backpack
    rect(6, 9 + bobY, 5, 4, cMain);
    // Backpack sticking out left
    rect(5, 9 + bobY, 2, 4, cDark);

    // Arm
    if (walkFrame === 1) {
      rect(10, 9 + bobY, 2, 3, cDark);
      p(10, 12 + bobY, sSkin);
    } else if (walkFrame === 2) {
      rect(7, 9 + bobY, 2, 3, cDark);
      p(7, 12 + bobY, sSkin);
    } else {
      rect(8, 9 + bobY, 2, 3, cDark);
      p(8, 12 + bobY, sSkin);
    }

    // Legs
    if (walkFrame === 1) {
      rect(9, 13, 3, 2, cPants);
      rect(10, 15, 3, 1, cShoes);
    } else if (walkFrame === 2) {
      rect(6, 13, 3, 2, cPants);
      rect(6, 15, 3, 1, cShoes);
    } else {
      rect(7, 13, 4, 2, cPants);
      rect(8, 15, 4, 1, cShoes);
    }
  }

  ctx.restore();
}

/**
 * Draws a flying LinkedIn connection request envelope / projectile
 */
export function drawLinkedInProjectile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  angle: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Outer blue card/envelope with golden border
  const w = 18;
  const h = 14;
  ctx.fillStyle = '#0a66c2'; // Official LinkedIn Blue
  ctx.fillRect(-w / 2, -h / 2, w, h);

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-w / 2, -h / 2, w, h);

  // "in" logo text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('in', 0, 0);

  ctx.restore();
}
