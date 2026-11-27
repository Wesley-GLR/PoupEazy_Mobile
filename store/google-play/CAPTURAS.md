# Origem das capturas

As imagens usam o aplicativo Android real deste checkout, executado no Expo Go
57.0.9 em um emulador Android API 36. A API local de leitura fornece uma conta
fictícia e dados coerentes de novembro de 2026. Nenhuma imagem de interface foi
gerada por IA, substituída pelo site ou redesenhada.

- Celular: emulador em 1080 × 2400, densidade 420; capturas originais em
  `screenshots/raw/`. A composição em `screenshots/phone/` preserva a proporção da
  captura e adiciona título/fundo em uma tela de 1080 × 1920, sem esticar a UI.
- O botão de ferramentas do Expo Go foi ocultado pelo próprio menu antes das
  capturas. A aparência do ícone instalado ainda exige verificação no novo AAB.
- Scripts de apoio não carregam `.env`, não acessam a API de produção e não
  enviam e-mails. O servidor fictício bloqueia alterações nos dados.
- Tablet: o mesmo emulador foi configurado com tamanho lógico 1600 × 2560 e
  densidade 320, produzindo uma área de 800 dp de largura. A interface foi
  renderizada novamente nessa configuração, inclusive com quatro cartões por
  linha no painel. A captura física permaneceu em 1080 × 2400; somente as faixas
  pretas fora do viewport 1080 × 1728 foram retiradas da composição. Fontes em
  `screenshots/raw-tablet/` e artes de upload em `screenshots/tablet/`. O manifesto
  registra o processo. Não são ampliações das capturas de celular.

## Reproduzir localmente

Com o emulador em execução, iniciar a API em um terminal:

```powershell
node store/google-play/tools/demo-api.cjs
```

Configurar as portas do **emulador de teste**, conferindo o serial em `adb devices`:

```powershell
adb -s emulator-5554 reverse tcp:43188 tcp:43188
adb -s emulator-5554 reverse tcp:8081 tcp:8081
```

Em outro terminal:

```powershell
node store/google-play/tools/start-preview.cjs
```

Abrir `exp://127.0.0.1:8081` no Expo Go. A conta fictícia é
`ana@example.test` / `DemoPoupEazy2026!`; essas credenciais só existem no harness.
Se o Windows atender o Metro apenas em `::1` e a conexão IPv4 for recusada, iniciar
também `node store/google-play/tools/loopback-relay.cjs`. O relay é limitado ao
loopback IPv4/IPv6 e não inicia outro Expo nem expõe a rede local.

O botão de câmera da barra do emulador salva os PNGs nativos. Copiar as imagens
para os nomes indicados em `pt-BR/screenshot-captions.json`, dentro de
`screenshots/raw/`. Com o tooling instalado, gerar as composições:

```powershell
npm ci --prefix store/google-play/tools
node store/google-play/tools/compose-screenshots.cjs
node store/google-play/tools/compose-tablets.cjs
```

Conferir visualmente os arquivos, inclusive os trechos selecionados nas telas
com rolagem. O manifesto informa o status individual; arquivos de roteiro sem
captura correspondente permanecem pendentes.

Para reproduzir a configuração de tablet no emulador de teste, consultar primeiro
`adb -s emulator-5554 shell wm size` e `wm density`, registrar os valores e aplicar
`wm size 1600x2560` e `wm density 320`. Depois das capturas desta sessão, os dois
overrides são removidos com `wm size reset` e `wm density reset`; isso restaura a
configuração física original de 1080 × 2400 / 420. Não aplicar esses comandos a
um dispositivo pessoal ou a outro serial sem conferir o alvo.
