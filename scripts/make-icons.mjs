// Draws the app icons (a pixel-art crown with jewels) as PNG files in public/icons/.
// Uses only Node's built-in zlib: no packages, nothing downloaded. Run with: npm run icons
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

// The crown, one letter per pixel. y gold, d gold shade, R/B/G/P/O jewels, . empty.
const CROWN = [
  'y......y......y',
  'yy....yyy....yy',
  'yyy..yyyyy..yyy',
  'yyyyyyyyyyyyyyy',
  'yRyyByyGyyPyyOy',
  'yyyyyyyyyyyyyyy',
  'ddddddddddddddd',
];
const COLORS = {
  y: [0xff, 0xd2, 0x3f],
  d: [0xd9, 0x9a, 0x1e],
  R: [0xff, 0x3d, 0x5a],
  B: [0x4f, 0x9d, 0xff],
  G: [0x5e, 0xe0, 0x7a],
  P: [0xff, 0x86, 0xbf],
  O: [0xff, 0xa5, 0x3d],
};
const OUTLINE = [0x3a, 0x18, 0x40];
const BG = [0x2a, 0x14, 0x38];
const GLOW = [0x5a, 0x2a, 0x6a];

/** Make a size x size RGBA image with the crown taking `fraction` of the width. */
function drawIcon(size, fraction) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b]) => {
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
    px[i + 3] = 255;
  };
  // Purple background with a soft round glow.
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2, y - size / 2) / (size / 2);
      set(x, y, d < 0.75 ? GLOW : BG);
    }
  // The crown, scaled up with crisp square pixels, with a 1-cell outline around it.
  const w = CROWN[0].length + 2;
  const h = CROWN.length + 2;
  const cell = Math.floor((size * fraction) / w);
  const ox = Math.floor((size - w * cell) / 2);
  const oy = Math.floor((size - h * cell) / 2);
  const at = (cx, cy) => CROWN[cy - 1]?.[cx - 1] ?? '.';
  for (let cy = 0; cy < h; cy++)
    for (let cx = 0; cx < w; cx++) {
      let color = COLORS[at(cx, cy)];
      if (!color) {
        let near = false;
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (COLORS[at(cx + dx, cy + dy)]) near = true;
        if (!near) continue;
        color = OUTLINE;
      }
      for (let y = 0; y < cell; y++) for (let x = 0; x < cell; x++) set(ox + cx * cell + x, oy + cy * cell + y, color);
    }
  return px;
}

// ---- A tiny PNG encoder ----
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // no filter
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

mkdirSync('public/icons', { recursive: true });
const icons = [
  ['icon-192.png', 192, 0.8],
  ['icon-512.png', 512, 0.8],
  ['icon-maskable-512.png', 512, 0.55], // extra margin: phones may crop this one into a circle
  ['apple-touch-icon.png', 180, 0.8],
];
for (const [name, size, fraction] of icons) {
  writeFileSync(`public/icons/${name}`, png(size, drawIcon(size, fraction)));
  console.log(`wrote public/icons/${name}`);
}
