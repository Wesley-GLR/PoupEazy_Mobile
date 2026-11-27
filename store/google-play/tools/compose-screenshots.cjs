'use strict';
// Preserve the actual Android UI. Only place the unchanged capture, scaled
// uniformly, in a code-native editorial layout at Google Play's 9:16 ratio.
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('jimp-compact');
const { Resvg } = require('@resvg/resvg-js');
const { png, svg } = require('./build-assets.cjs');
const root = path.resolve(__dirname, '../../..');
const store = path.join(root, 'store/google-play');
const plan = JSON.parse(fs.readFileSync(path.join(store, 'pt-BR/screenshot-captions.json'), 'utf8'));
const escape = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const fontFiles = ['Inter_400Regular.ttf', 'Inter_600SemiBold.ttf', 'Inter_700Bold.ttf'].map(name => path.join(root, 'assets/fonts', name));

function lines(text, limit = 30) {
  const result = [''];
  for (const word of text.split(' ')) {
    const last = result.length - 1;
    if (result[last] && `${result[last]} ${word}`.length > limit) result.push(word);
    else result[last] = `${result[last]} ${word}`.trim();
  }
  return result;
}
async function main() {
  let count = 0;
  for (const shot of plan.screenshots) {
    const source = path.join(store, 'screenshots/raw', path.basename(shot.plannedFile));
    if (!fs.existsSync(source)) {
      shot.status = 'planned';
      delete shot.sourceFile;
      console.log(`Pendente: ${path.basename(source)}`);
      continue;
    }
    const input = fs.readFileSync(source);
    const image = await Jimp.read(input);
    if (image.bitmap.width < 320 || image.bitmap.height < 320) throw new Error('Captura muito pequena');
    if (image.bitmap.height <= image.bitmap.width) throw new Error('Esperada captura Android de telefone em retrato');
    const scale = Math.min(920 / image.bitmap.width, 1516 / image.bitmap.height);
    const w = image.bitmap.width * scale, h = image.bitmap.height * scale;
    const x = (1080 - w) / 2, y = 350 + (1516 - h) / 2;
    const headline = lines(shot.headline).map((line, i) => `<text x="64" y="${175 + i * 70}" font-family="Inter" font-weight="700" font-size="56" fill="#141D33">${escape(line)}</text>`).join('');
    const doc = svg(1080, 1920, `<defs><linearGradient id="bg" x2="0.5" y2="1"><stop stop-color="#F8FBFD"/><stop offset="1" stop-color="#DCEEF8"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#bg)"/><text x="64" y="82" font-family="Inter" font-weight="700" font-size="34" fill="#141D33">Poup<tspan fill="#0E5787">Eazy</tspan></text>${headline}<rect x="64" y="290" width="48" height="5" rx="2.5" fill="#32A5DF"/><rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="#BDD4E2"/><image x="${x}" y="${y}" width="${w}" height="${h}" href="data:image/png;base64,${input.toString('base64')}"/>`);
    const render = new Resvg(doc, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
    const output = path.join(store, shot.plannedFile);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, png(render.pixels, render.width, render.height, false));
    console.log(`${path.relative(store, output)}: 1080x1920, RGB, ${fs.statSync(output).size} bytes`);
    shot.sourceFile = `screenshots/raw/${path.basename(source)}`;
    shot.status = 'captured';
    count++;
  }
  plan.status = count === plan.screenshots.length ? 'captured' : count ? 'partial' : 'planned';
  plan.note = 'As imagens finais usam capturas reais do aplicativo Android, com dados fictícios de uma API local. Apenas o enquadramento e as legendas editoriais foram adicionados; a interface não foi redesenhada. Consulte o status individual de cada captura.';
  fs.writeFileSync(path.join(store, 'pt-BR/screenshot-captions.json'), `${JSON.stringify(plan, null, 2)}\n`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
