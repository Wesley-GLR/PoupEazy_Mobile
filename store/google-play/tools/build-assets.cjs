/* Artwork only: no dotenv, network, app runtime, credentials or production API. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const Jimp = require('jimp-compact');
const { Resvg } = require('@resvg/resvg-js');
const root = path.resolve(__dirname, '../../..');
const graphics = path.join(root, 'store/google-play/graphics');
const brand = path.join(root, 'assets/brand');
const fontFiles = ['Inter_400Regular.ttf', 'Inter_600SemiBold.ttf', 'Inter_700Bold.ttf']
  .map(name => path.join(root, 'assets/fonts', name));
const NAVY = '#141D33';
const BLUE = '#32A5DF';

// Trace the project's existing symbol into editable SVG paths. The wordmark and
// tiny export artifacts outside the left-hand symbol are deliberately excluded.
function trace(mask, width, height) {
  const edges = new Map();
  const at = (x, y) => x >= 0 && y >= 0 && x < width && y < height && mask[y * width + x];
  const add = (x1, y1, x2, y2) => {
    const key = `${x1},${y1}`;
    if (!edges.has(key)) edges.set(key, []);
    edges.get(key).push([x2, y2]);
  };
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (!at(x, y)) continue;
    if (!at(x, y - 1)) add(x, y, x + 1, y);
    if (!at(x + 1, y)) add(x + 1, y, x + 1, y + 1);
    if (!at(x, y + 1)) add(x + 1, y + 1, x, y + 1);
    if (!at(x - 1, y)) add(x, y + 1, x, y);
  }
  const paths = [];
  while (edges.size) {
    const first = edges.keys().next().value;
    const points = [first.split(',').map(Number)];
    let key = first;
    for (let step = 0; step < width * height * 4; step++) {
      const choices = edges.get(key);
      if (!choices?.length) break;
      const point = choices.pop();
      if (!choices.length) edges.delete(key);
      points.push(point);
      key = point.join(',');
      if (key === first) break;
    }
    let area = 0;
    for (let i = 1; i < points.length; i++) area += points[i - 1][0] * points[i][1] - points[i][0] * points[i - 1][1];
    if (Math.abs(area) < 18) continue;
    // Simplify straight stair-step edges without changing the brand silhouette.
    const open = points.slice(0, -1);
    const mid = Math.floor(open.length / 2);
    const simplified = [...simplify(open.slice(0, mid + 1), 1.35).slice(0, -1),
      ...simplify([...open.slice(mid), open[0]], 1.35).slice(0, -1)];
    paths.push(curvePath(simplified));
  }
  return paths.join('');
}

function curvePath(points) {
  // Smooth the original raster's stair steps on curves, preserving sharp
  // corners in the arrow, stem and line graph. No new brand geometry is added.
  const n = points.length;
  const tangents = points.map((p, i) => {
    const a = points[(i + n - 1) % n], b = points[(i + 1) % n];
    const incoming = [p[0] - a[0], p[1] - a[1]], outgoing = [b[0] - p[0], b[1] - p[1]];
    const cosine = (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) / (Math.hypot(...incoming) * Math.hypot(...outgoing));
    return cosine < 0.65 ? [0, 0] : [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
  });
  const number = n => Number(n.toFixed(3));
  let result = `M${points[0].join(' ')}`;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = points[i], b = points[j];
    result += `C${[a[0] + tangents[i][0], a[1] + tangents[i][1], b[0] - tangents[j][0], b[1] - tangents[j][1], ...b].map(number).join(' ')}`;
  }
  return `${result}Z`;
}

function simplify(points, tolerance) {
  if (points.length <= 2) return points;
  const a = points[0], b = points[points.length - 1];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  let max = 0, index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const t = dx || dy ? Math.max(0, Math.min(1, ((points[i][0] - a[0]) * dx + (points[i][1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
    const distance = Math.hypot(points[i][0] - a[0] - t * dx, points[i][1] - a[1] - t * dy);
    if (distance > max) { max = distance; index = i; }
  }
  return max > tolerance
    ? [...simplify(points.slice(0, index + 1), tolerance).slice(0, -1), ...simplify(points.slice(index), tolerance)]
    : [a, b];
}

function svg(width, height, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${content}</svg>`;
}

// Encode unambiguous sRGB PNGs with the exact required color type. resvg renders
// artwork; this encoder only serializes the rendered pixels (no image edits).
function png(pixels, width, height, alpha) {
  const channels = alpha ? 4 : 3;
  const rows = Buffer.alloc(height * (1 + width * channels));
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const from = (y * width + x) * 4, to = y * (1 + width * channels) + 1 + x * channels;
    rows[to] = pixels[from]; rows[to + 1] = pixels[from + 1]; rows[to + 2] = pixels[from + 2];
    if (alpha) rows[to + 3] = pixels[from + 3];
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4); header[8] = 8; header[9] = alpha ? 6 : 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('sRGB', Buffer.from([0])), chunk('IDAT', zlib.deflateSync(rows, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
function chunk(type, data) {
  const payload = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of payload) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const length = Buffer.alloc(4), sum = Buffer.alloc(4);
  length.writeUInt32BE(data.length); sum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([length, payload, sum]);
}
function save(file, source, alpha = true) {
  const render = new Resvg(source, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
  const pixels = render.pixels;
  if (path.basename(file).startsWith('android-adaptive-')) {
    const safeRadius = render.width * 66 / 108 / 2;
    for (let y = 0; y < render.height; y++) for (let x = 0; x < render.width; x++) {
      if (pixels[(y * render.width + x) * 4 + 3] > 127 && Math.hypot(x + 0.5 - render.width / 2, y + 0.5 - render.height / 2) > safeRadius) {
        throw new Error('Adaptive artwork extends beyond the guaranteed circular safe zone.');
      }
    }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, png(pixels, render.width, render.height, alpha));
  const size = fs.statSync(file).size;
  console.log(`${path.relative(root, file)}: ${render.width}x${render.height}, ${alpha ? 'RGBA' : 'RGB'}, ${size} bytes`);
  if (file.endsWith('icon-512.png') && size > 1024 * 1024) throw new Error('Store icon exceeds 1 MiB');
}

async function main() {
  const image = await Jimp.read(path.join(brand, 'logo-horizontal.png'));
  const width = 220, height = 180;
  const dark = new Uint8Array(width * height), blue = new Uint8Array(width * height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) for (let x = 40; x < width; x++) {
    const i = (y * image.bitmap.width + x) * 4;
    const [r, g, b, a] = image.bitmap.data.subarray(i, i + 4);
    if (a < 150) continue;
    dark[y * width + x] = r < 100 && g < 125 && b < 165 ? 1 : 0;
    blue[y * width + x] = r < 130 && g > 125 && b > 150 ? 1 : 0;
    if (dark[y * width + x] || blue[y * width + x]) {
      minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x + 1); maxY = Math.max(maxY, y + 1);
    }
  }
  const darkPath = trace(dark, width, height), bluePath = trace(blue, width, height);
  const symbol = (cx, cy, h, mono = false) => {
    const scale = h / (maxY - minY);
    return `<g transform="translate(${cx - (maxX - minX) * scale / 2} ${cy - h / 2}) scale(${scale}) translate(${-minX} ${-minY})" fill-rule="evenodd"><path fill="${mono ? '#000000' : NAVY}" d="${darkPath}"/><path fill="${mono ? '#000000' : BLUE}" d="${bluePath}"/></g>`;
  };
  fs.mkdirSync(graphics, { recursive: true });
  const mark = svg(512, 512, symbol(256, 256, 348));
  fs.writeFileSync(path.join(brand, 'symbol.svg'), mark);
  const storeIcon = svg(512, 512, `<rect width="512" height="512" fill="#FFFFFF"/>${symbol(256, 256, 348)}`);
  fs.writeFileSync(path.join(graphics, 'icon-512.svg'), storeIcon);
  save(path.join(graphics, 'icon-512.png'), storeIcon);
  save(path.join(brand, 'app-icon.png'), svg(1024, 1024, `<rect width="1024" height="1024" fill="#FFFFFF"/>${symbol(512, 512, 696)}`));
  save(path.join(brand, 'android-adaptive-foreground.png'), svg(1024, 1024, symbol(512, 512, 450)));
  save(path.join(brand, 'android-adaptive-monochrome.png'), svg(1024, 1024, symbol(512, 512, 450, true)));
  const banner = svg(1024, 500, `<defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#F7FBFD"/><stop offset="1" stop-color="#E5F2FA"/></linearGradient><linearGradient id="accent" x1="0" x2="1"><stop stop-color="#0E5787"/><stop offset="1" stop-color="#32A5DF"/></linearGradient></defs>
    <rect width="1024" height="500" fill="url(#bg)"/>
    <circle cx="901" cy="252" r="238" fill="#D5EBF7"/>
    <circle cx="904" cy="252" r="181" fill="none" stroke="#C0DEEE" stroke-width="1.5"/>
    <circle cx="904" cy="252" r="132" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
    ${symbol(79, 85, 66)}
    <text x="120" y="101" font-family="Inter" font-weight="700" font-size="39" fill="${NAVY}">Poup<tspan fill="#0E5787">Eazy</tspan></text>
    <rect x="52" y="157" width="47" height="5" rx="2.5" fill="url(#accent)"/>
    <text x="52" y="225" font-family="Inter" font-weight="700" font-size="43" fill="${NAVY}">Mais clareza para</text>
    <text x="52" y="281" font-family="Inter" font-weight="700" font-size="43" fill="${NAVY}">suas finanças.</text>
    <text x="54" y="334" font-family="Inter" font-size="18" fill="#4B6578">Acompanhe seus gastos. Planeje seus objetivos.</text>
    <text x="54" y="410" font-family="Inter" font-size="16" font-weight="600" fill="#0E5787">RECEITAS · DESPESAS · METAS · ORÇAMENTOS</text>
    ${symbol(831, 251, 267)}
  `);
  fs.writeFileSync(path.join(graphics, 'feature-1024x500.svg'), banner);
  save(path.join(graphics, 'feature-1024x500.png'), banner, false);
  // Previews make crop/mask problems reviewable without modifying originals.
  save(path.join(graphics, 'icon-mask-preview.png'), svg(1024, 512,
    `<rect width="1024" height="512" fill="#E6F1F7"/><rect x="26" y="26" width="460" height="460" rx="102" fill="white"/>${symbol(256, 256, 313)}<circle cx="768" cy="256" r="230" fill="white"/>${symbol(768, 256, 313)}`), false);
}
module.exports = { svg, png };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
