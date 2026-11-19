import * as THREE from 'three';

function finalizeColorTex(tex: THREE.CanvasTexture, anisotropy: number): THREE.CanvasTexture {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = anisotropy;
  return tex;
}

export function makeStripeTexture(
  bg: string,
  fg: string,
  anisotropy: number,
  rivets = true
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = fg;
  for (let i = -256; i < 512; i += 48) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 24, 0);
    ctx.lineTo(i + 280, 256);
    ctx.lineTo(i + 256, 256);
    ctx.closePath();
    ctx.fill();
  }
  if (rivets) {
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.fillRect(0, 0, 256, 12);
    ctx.fillRect(0, 244, 256, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    for (let x = 20; x < 245; x += 54) {
      ctx.beginPath();
      ctx.arc(x, 18, 4, 0, Math.PI * 2);
      ctx.arc(x, 238, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return finalizeColorTex(tex, anisotropy);
}

export function makeTrackBedTexture(anisotropy: number): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Gravel ballast bed
  ctx.fillStyle = '#3e3a46';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 900; i++) {
    const shade = (i * 29) % 45;
    ctx.fillStyle =
      i % 3 === 0
        ? `rgb(${76 + shade}, ${72 + shade}, ${82 + shade})`
        : `rgb(${44 + (shade % 20)}, ${40 + (shade % 20)}, ${48 + (shade % 20)})`;
    ctx.fillRect((i * 73) % 254, (i * 47) % 254, 4, 4);
  }

  // Wooden railway sleeper ties with iron rail plates
  for (let y = 0; y < 256; y += 32) {
    ctx.fillStyle = '#5a3d2b';
    ctx.fillRect(14, y + 4, 228, 14);
    ctx.fillStyle = '#3f281b';
    ctx.fillRect(14, y + 15, 228, 3);
    ctx.fillStyle = '#73503b';
    ctx.fillRect(14, y + 4, 228, 2);
    // Steel tie plates
    ctx.fillStyle = '#64748b';
    ctx.fillRect(28, y + 5, 18, 12);
    ctx.fillRect(210, y + 5, 18, 12);
  }

  // Bump map for ballast & ties relief
  const b = document.createElement('canvas');
  b.width = 256;
  b.height = 256;
  const bctx = b.getContext('2d')!;
  bctx.fillStyle = '#505050';
  bctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 700; i++) {
    bctx.fillStyle = i % 2 === 0 ? '#787878' : '#323232';
    bctx.fillRect((i * 73) % 254, (i * 47) % 254, 4, 4);
  }
  bctx.fillStyle = '#d4d4d4';
  for (let y = 0; y < 256; y += 32) {
    bctx.fillRect(14, y + 4, 228, 14);
  }

  const map = new THREE.CanvasTexture(c);
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(1, 5);
  finalizeColorTex(map, anisotropy);

  const bumpMap = new THREE.CanvasTexture(b);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(1, 5);
  bumpMap.anisotropy = anisotropy;

  return { map, bumpMap };
}

export function makePlatformTexture(baseHex: string, edgeHex: string, anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 256);

  // Subtle concrete paving grid
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 2;
  for (let y = 0; y <= 256; y += 64) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  for (let x = 0; x <= 256; x += 64) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  // Tactile yellow safety edge stripe
  ctx.fillStyle = edgeHex;
  ctx.fillRect(0, 0, 26, 256);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 8; y < 256; y += 24) {
    ctx.fillRect(4, y, 18, 10);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 4);
  return finalizeColorTex(tex, anisotropy);
}

export function makeGraffitiWallTexture(
  wallHex: string,
  accentA: string,
  accentB: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  ctx.fillStyle = wallHex;
  ctx.fillRect(0, 0, 512, 256);

  // Brick courses
  ctx.strokeStyle = 'rgba(0,0,0,0.16)';
  ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
    const offset = (y / 32) % 2 === 0 ? 0 : 32;
    for (let x = offset; x < 512; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + 32);
      ctx.stroke();
    }
  }

  // Street graffiti mural panels
  ctx.save();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = accentA;
  ctx.beginPath();
  ctx.ellipse(140, 140, 74, 42, -0.14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = accentB;
  ctx.beginPath();
  ctx.ellipse(355, 130, 82, 38, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#0f172a';
  ctx.font = '900 44px sans-serif';
  ctx.strokeText('RUSH', 76, 155);
  ctx.fillStyle = '#fef08a';
  ctx.fillText('RUSH', 76, 155);

  ctx.strokeText('SURF', 292, 144);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('SURF', 292, 144);
  ctx.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return finalizeColorTex(tex, anisotropy);
}

export function makeTrainSideTexture(
  mainColor: string,
  stripeColor: string,
  accentColor: string,
  anisotropy: number,
  withGraffiti = false
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  // Metallic upper/lower body
  ctx.fillStyle = mainColor;
  ctx.fillRect(0, 0, 512, 256);

  // Roofline trim & lower bumper skirt
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  ctx.fillRect(0, 12, 512, 12);
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 218, 512, 38);

  // Express livery stripe
  ctx.fillStyle = stripeColor;
  ctx.fillRect(0, 156, 512, 30);
  ctx.fillStyle = accentColor;
  ctx.fillRect(0, 188, 512, 10);

  // Sliding doors & passenger windows with warm interior glow
  for (let x = 22; x < 480; x += 96) {
    // Door frame
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 56, 38, 30, 178);

    // Window
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x, 48, 46, 68);
    const grad = ctx.createLinearGradient(x, 48, x, 116);
    grad.addColorStop(0, '#bae6fd');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;
    ctx.fillRect(x + 4, 52, 38, 60);
    // Window highlight diagonal
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.moveTo(x + 6, 52);
    ctx.lineTo(x + 22, 52);
    ctx.lineTo(x + 10, 112);
    ctx.lineTo(x + 4, 112);
    ctx.closePath();
    ctx.fill();
  }

  if (withGraffiti) {
    ctx.save();
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = accentColor;
    ctx.font = '900 48px sans-serif';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#090d16';
    ctx.strokeText('SUBWAY', 110, 198);
    ctx.fillText('SUBWAY', 110, 198);
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  return finalizeColorTex(tex, anisotropy);
}

export function makeTrainFrontTexture(
  mainColor: string,
  destinationText: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = mainColor;
  ctx.fillRect(0, 0, 256, 256);

  // Destination LED panel
  ctx.fillStyle = '#090d16';
  ctx.fillRect(48, 22, 160, 34);
  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(destinationText, 128, 46);

  // Twin armored windshields
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(28, 68, 92, 74);
  ctx.fillRect(136, 68, 92, 74);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(34, 74, 80, 62);
  ctx.fillRect(142, 74, 80, 62);

  // Lower grille & bumper
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 206, 256, 50);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(22, 192, 212, 10);

  const tex = new THREE.CanvasTexture(c);
  return finalizeColorTex(tex, anisotropy);
}

export function makeMysteryBoxTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#7c3aed';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#fde047';
  ctx.lineWidth = 10;
  ctx.strokeRect(8, 8, 112, 112);
  ctx.fillStyle = '#fef08a';
  ctx.font = '900 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 64, 68);
  const tex = new THREE.CanvasTexture(c);
  return finalizeColorTex(tex, anisotropy);
}

export function makeBuildingFacadeTexture(
  baseHex: string,
  windowGlowHex: string,
  anisotropy: number
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 256, 512);

  // Subtle vertical structural pilasters
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  ctx.fillRect(0, 0, 14, 512);
  ctx.fillRect(242, 0, 14, 512);

  // Grid of lit and shaded skyscraper windows
  for (let row = 0; row < 12; row++) {
    const y = 24 + row * 40;
    for (let col = 0; col < 4; col++) {
      const x = 26 + col * 54;
      const lit = (row * 7 + col * 13) % 5 !== 0;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, 36, 26);
      ctx.fillStyle = lit ? windowGlowHex : 'rgba(148, 163, 184, 0.25)';
      ctx.fillRect(x + 3, y + 3, 30, 20);
      if (lit) {
        ctx.fillStyle = 'rgba(255,255,255,0.28)';
        ctx.fillRect(x + 3, y + 3, 30, 6);
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return finalizeColorTex(tex, anisotropy);
}

export function makeRampChevronTexture(anisotropy: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 512);

  // Side hazard rails
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 20, 512);
  ctx.fillRect(236, 0, 20, 512);

  // Glowing upward chevrons
  for (let y = 32; y < 500; y += 96) {
    ctx.fillStyle = y % 192 === 32 ? '#facc15' : '#fb923c';
    ctx.beginPath();
    ctx.moveTo(42, y + 54);
    ctx.lineTo(128, y + 8);
    ctx.lineTo(214, y + 54);
    ctx.lineTo(214, y + 78);
    ctx.lineTo(128, y + 32);
    ctx.lineTo(42, y + 78);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return finalizeColorTex(tex, anisotropy);
}

export function makeContactShadowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d')!;
  const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 60);
  grad.addColorStop(0, 'rgba(6, 10, 20, 0.72)');
  grad.addColorStop(0.55, 'rgba(6, 10, 20, 0.35)');
  grad.addColorStop(1, 'rgba(6, 10, 20, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function makeSkateDeckTexture(
  deckHex: string,
  trimHex: string,
  glowHex: string,
  pattern: 'classic' | 'flames' | 'lightning' | 'star' | 'cyber' | 'imperial',
  anisotropy = 4
): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext('2d')!;

  // Metallic gradient deck base
  const grad = ctx.createLinearGradient(0, 0, 512, 1024);
  grad.addColorStop(0, deckHex);
  grad.addColorStop(0.5, trimHex);
  grad.addColorStop(1, deckHex);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 1024);

  // Subtle carbon-fiber micro weave
  ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
  for (let y = 0; y < 1024; y += 16) {
    for (let x = (y / 16) % 2 === 0 ? 0 : 8; x < 512; x += 16) {
      ctx.fillRect(x, y, 8, 8);
    }
  }

  // Grip tape center inlay with chamfered borders
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(58, 74, 396, 876);
  ctx.strokeStyle = glowHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(58, 74, 396, 876);

  // Grip texture speckles
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
  for (let i = 0; i < 650; i++) {
    const sx = 68 + ((i * 73) % 376);
    const sy = 84 + ((i * 139) % 856);
    ctx.fillRect(sx, sy, 3, 3);
  }

  // Center pattern graphic
  ctx.save();
  if (pattern === 'classic') {
    ctx.fillStyle = trimHex;
    ctx.fillRect(216, 94, 80, 836);
    ctx.fillStyle = glowHex;
    ctx.fillRect(244, 94, 24, 836);
  } else if (pattern === 'flames') {
    ctx.fillStyle = glowHex;
    for (let i = 0; i < 4; i++) {
      const yBase = 860 - i * 180;
      ctx.beginPath();
      ctx.moveTo(96, yBase);
      ctx.quadraticCurveTo(180, yBase - 140, 256, yBase - 220);
      ctx.quadraticCurveTo(332, yBase - 140, 416, yBase);
      ctx.quadraticCurveTo(256, yBase - 70, 96, yBase);
      ctx.fill();
    }
  } else if (pattern === 'lightning') {
    ctx.fillStyle = glowHex;
    ctx.beginPath();
    ctx.moveTo(300, 140);
    ctx.lineTo(155, 510);
    ctx.lineTo(255, 510);
    ctx.lineTo(195, 880);
    ctx.lineTo(360, 460);
    ctx.lineTo(260, 460);
    ctx.closePath();
    ctx.fill();
  } else if (pattern === 'star') {
    ctx.fillStyle = glowHex;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 140 : 62;
      const a = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const px = 256 + Math.cos(a) * r;
      const py = 512 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (pattern === 'imperial') {
    // Imperial gold rails + royal center diamond crest
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 8;
    ctx.strokeRect(86, 110, 340, 804);
    ctx.fillStyle = '#facc15';
    for (const cy of [270, 512, 754]) {
      ctx.beginPath();
      ctx.moveTo(256, cy - 88);
      ctx.lineTo(348, cy);
      ctx.lineTo(256, cy + 88);
      ctx.lineTo(164, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(256, cy - 42);
      ctx.lineTo(300, cy);
      ctx.lineTo(256, cy + 42);
      ctx.lineTo(212, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#facc15';
    }
  } else {
    // cyber grid & chevrons
    ctx.strokeStyle = glowHex;
    ctx.lineWidth = 6;
    for (let y = 160; y <= 860; y += 140) {
      ctx.beginPath();
      ctx.moveTo(92, y + 60);
      ctx.lineTo(256, y);
      ctx.lineTo(420, y + 60);
      ctx.stroke();
    }
  }
  ctx.restore();

  // Stainless steel deck truck bolts (front & rear)
  ctx.fillStyle = '#e2e8f0';
  for (const ty of [220, 770]) {
    for (const bx of [210, 302]) {
      for (const by of [ty, ty + 48]) {
        ctx.beginPath();
        ctx.arc(bx, by, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const tex = new THREE.CanvasTexture(c);
  return finalizeColorTex(tex, anisotropy);
}
