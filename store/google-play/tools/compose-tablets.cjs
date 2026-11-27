'use strict';
const fs = require('node:fs');
const path = require('node:path');
const Jimp = require('jimp-compact');
const { Resvg } = require('@resvg/resvg-js');
const { png, svg } = require('./build-assets.cjs');
const root = path.resolve(__dirname, '../../..');
const store = path.join(root, 'store/google-play');
const fontFiles = ['Inter_400Regular.ttf', 'Inter_700Bold.ttf'].map(f => path.join(root, 'assets/fonts', f));
const shots = [
  ['01-visao-geral.png', 'Mais espaço para acompanhar', 'Painel em configuração de tablet, com resumo e gráfico de categorias.'],
  ['02-orcamento.png', 'Planeje o mês com clareza', 'Orçamento em configuração de tablet, com consumo e categorias.'],
  ['03-metas.png', 'Seus objetivos em foco', 'Metas e seus movimentos em configuração de tablet.'],
  ['04-relatorios.png', 'Monte o seu relatório', 'Período, seções e formatos de relatório em configuração de tablet.'],
];
async function main() {
  const manifest = { status: 'captured',
    source: 'Aplicativo Android real, emulador API 36 / Expo Go 57.0.9, configuração lógica 1600x2560 e densidade 320 (800 dp de largura).',
    composition: 'A captura física é 1080x2400. Foram retiradas somente as faixas pretas externas ao viewport 1080x1728; a interface foi escalada uniformemente e enquadrada em 1080x1920 com título.',
    screenshots: [],
  };
  for (const [name, headline, alt] of shots) {
    const inputFile = path.join(store, 'screenshots/raw-tablet', name);
    const input = fs.readFileSync(inputFile);
    const image = await Jimp.read(input);
    const { data, width, height } = image.bitmap;
    const lit = y => {
      let count = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (Math.max(data[i], data[i + 1], data[i + 2]) > 10) count++;
      }
      return count > width * 0.1;
    };
    let top = 0, bottom = height - 1;
    while (top < height - 1 && !lit(top)) top++;
    while (bottom > top && !lit(bottom)) bottom--;
    const viewportHeight = bottom - top + 1;
    if (width !== 1080 || viewportHeight !== 1728 || top !== 336) throw new Error(`Viewport inesperado em ${name}; conferir a captura antes de compor.`);
    const x = 24, y = 210, w = 1032, h = viewportHeight * w / width;
    const doc = svg(1080, 1920, `<defs><linearGradient id="bg" x2="0.5" y2="1"><stop stop-color="#F8FBFD"/><stop offset="1" stop-color="#DCEEF8"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#bg)"/><text x="54" y="72" font-family="Inter" font-weight="700" font-size="34" fill="#141D33">Poup<tspan fill="#0E5787">Eazy</tspan></text><text x="54" y="144" font-family="Inter" font-size="48" font-weight="700" fill="#141D33">${headline}</text><rect x="54" y="177" width="48" height="5" rx="2.5" fill="#32A5DF"/><rect x="${x - 2}" y="${y - 2}" width="${w + 4}" height="${h + 4}" fill="#BDD4E2"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 ${top} ${width} ${viewportHeight}"><image width="${width}" height="${height}" href="data:image/png;base64,${input.toString('base64')}"/></svg>`);
    const render = new Resvg(doc, { font: { fontFiles, loadSystemFonts: false, defaultFontFamily: 'Inter' } }).render();
    const output = path.join(store, 'screenshots/tablet', name);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, png(render.pixels, render.width, render.height, false));
    manifest.screenshots.push({ file: `screenshots/tablet/${name}`, sourceFile: `screenshots/raw-tablet/${name}`, headline, alt, width: 1080, height: 1920, status: 'captured' });
    console.log(`${path.relative(store, output)}: 1080x1920 RGB, ${fs.statSync(output).size} bytes`);
  }
  fs.writeFileSync(path.join(store, 'pt-BR/tablet-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
