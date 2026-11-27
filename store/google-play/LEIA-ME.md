# Ficha do PoupEazy no Google Play

Material em **Português (Brasil) — pt-BR**. Os textos descrevem a versão atual do projeto acadêmico. Confira se os recursos estão presentes no AAB que será distribuído antes de copiar a descrição para a loja. Este material não publica nem envia uma versão.

## Campos de texto e idioma

Na **Página principal de detalhes do app**, preencher:

| Campo | Arquivo | Limite |
| --- | --- | --- |
| Nome do app | `pt-BR/title.txt` | 30 caracteres |
| Descrição breve | `pt-BR/short-description.txt` | 80 caracteres |
| Descrição completa | `pt-BR/full-description.txt` | 4.000 caracteres |

Se a ficha estiver em **Português (Portugal) — pt-PT**, adicionar/selecionar **pt-BR** e conferir o idioma padrão antes de preencher os textos. As duas localizações são distintas; o idioma da interface do Console não define o idioma da ficha. Manter legendas e capturas em português brasileiro. [Campos e limites](https://support.google.com/googleplay/android-developer/answer/9859152?hl=pt-BR) · [Idiomas e localização](https://support.google.com/googleplay/android-developer/answer/9844778).

## Elementos gráficos

| Campo do Console | Arquivo | Formato |
| --- | --- | --- |
| Ícone do app | `graphics/icon-512.png` | 512 × 512 px, PNG 32 bits, sRGB, até 1.024 KB; o arquivo preparado também fica abaixo de 1 MB |
| Recurso gráfico | `graphics/feature-1024x500.png` | 1024 × 500 px, PNG RGB sem transparência; respeitar também o limite de arquivo mostrado pelo Console |
| Capturas de tela de smartphone | Seis PNGs em `screenshots/phone/` | 1080 × 1920 px, RGB sem transparência, abaixo de 8 MB por arquivo |
| Capturas de tela de tablet | Quatro PNGs em `screenshots/tablet/` | 1080 × 1920 px, RGB sem transparência, abaixo de 8 MB por arquivo |

Os dois PNGs indicados estão preparados em `graphics/`; conferir a aparência antes do upload. `graphics/icon-512.svg` e `graphics/feature-1024x500.svg` são fontes editáveis, não os arquivos de upload. **`graphics/icon-mask-preview.png` serve apenas para conferir as máscaras do ícone e não deve ser enviado ao Console.** O guia público da feature especifica formato e dimensões; se o formulário indicar **15 MB**, esse é o limite de upload observado, não uma exigência de produzir um arquivo desse tamanho. [Recursos de pré-visualização](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

O ícone da ficha não substitui o **ícone instalado no Android**. O arquivo da loja é quadrado; o Google aplica máscara e sombra. Alterar o launcher exige configuração/recursos nativos e **novo AAB**, com `versionCode` maior, seguido de instalação da nova versão. OTA não altera esse ícone; imagens internas e splash também são recursos separados. [Especificações de ícone](https://developer.android.com/distribute/google-play/resources/icon-design-specifications) · [Ícones no Expo](https://docs.expo.dev/develop/user-interface/app-icons/) · [Versões no Android](https://developer.android.com/studio/publish/versioning).

### Fontes e regeneração das artes

A marca deriva de `assets/brand/logo-horizontal.png`. O arquivo `assets/brand/symbol.svg` contém uma **vetorização aproximada do símbolo desse PNG**, não um original vetorial fornecido pela equipe. Conferir as curvas e proporções antes de usar em outros materiais.

O gerador local é `store/google-play/tools/build-assets.cjs`. Para instalar o tooling separado e regenerar, executar na raiz deste repositório:

```powershell
npm ci --prefix store/google-play/tools
node store/google-play/tools/build-assets.cjs
```

As dependências das artes ficam no `package.json` e no lockfile de `store/google-play/tools/`, separados das dependências do aplicativo. A regeneração usa o PNG original e sobrescreve os SVGs/PNGs gerados em `graphics/` e os ícones derivados em `assets/brand/`; preservar antes eventuais edições manuais. Essa operação não captura telas nem gera um AAB.

O gerador usa as fontes Inter presentes em `assets/fonts/`: `Inter_400Regular.ttf`, `Inter_600SemiBold.ttf` e `Inter_700Bold.ttf`. Os PNGs já têm o texto renderizado; não é necessário enviar fontes ao Console. Para reproduzir as artes a partir dos SVGs, manter essas fontes disponíveis ao gerador.

## Capturas reais prontas

As seis imagens de celular e quatro de tablet usam **capturas reais deste checkout no Expo Go 57.0.9**, com uma API local fictícia configurada apenas para essa sessão. Nomes, valores e endereços são de demonstração; isso não significa que todas as integrações do produto usem sandbox. A interface não foi redesenhada nem substituída pelo site. Foram adicionados enquadramento e títulos, preservando sua proporção.

Os arquivos finais estão em 1080 × 1920 px, 9:16, RGB, sem transparência. Seus nomes foram conferidos no disco. Para promoção em certos espaços, o Google recomenda ao menos quatro capturas em 9:16 ou 16:9 com 1080p. [Regras atuais](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en).

### Smartphone

Enviar os seis arquivos abaixo na seção de smartphone da ficha **pt-BR**:

| Ordem | Tela | Arquivo em `screenshots/phone/` |
| --- | --- | --- |
| 1 | Painel principal | `01-visao-geral.png` |
| 2 | Transações | `02-transacoes.png` |
| 3 | Orçamento | `03-orcamento.png` |
| 4 | Metas | `04-metas.png` |
| 5 | Relatórios | `05-relatorios.png` |
| 6 | Preferências de e-mail | `06-preferencias-de-email.png` |

As capturas originais de celular têm 1080 × 2400 px e foram enquadradas uniformemente nas artes finais. As legendas e os textos alternativos estão em `pt-BR/screenshot-captions.json`.

### Tablets de 7 e 10 polegadas

Enviar os quatro arquivos abaixo em **ambas as seções de tablet**, mantendo a localização **pt-BR** e respeitando a validação apresentada pelo Console. O guia oficial permite aproveitar capturas reais de tablet nas seções de 7 e 10 polegadas. Não ignorar campos marcados com asterisco se o formulário exigir seu preenchimento.

| Ordem | Tela | Arquivo em `screenshots/tablet/` |
| --- | --- | --- |
| 1 | Painel principal | `01-visao-geral.png` |
| 2 | Orçamento | `02-orcamento.png` |
| 3 | Metas | `03-metas.png` |
| 4 | Relatórios | `04-relatorios.png` |

O aplicativo foi renderizado novamente no emulador com tamanho lógico de 1600 × 2560, densidade 320 e largura de 800 dp, exibindo inclusive quatro cartões por linha no painel. A captura física ficou em 1080 × 2400; a composição retirou apenas as faixas pretas externas ao viewport de 1080 × 1728 e enquadrou a interface uniformemente em 1080 × 1920. Não são ampliações das capturas de celular. A origem e a reprodução estão em `CAPTURAS.md`; os arquivos e metadados constam de `pt-BR/tablet-manifest.json`.

As quatro artes de tablet foram inspecionadas visualmente: os títulos e controles visíveis estão legíveis, sem esticar a interface. Algumas áreas roláveis continuam abaixo da dobra, como o restante da legenda do gráfico, o planejamento anual e o botão final do relatório. Isso corresponde ao viewport capturado; o conteúdo completo continua acessível por rolagem no app.

### Outros formatos

- **Desktop/Chromebook:** deixar vazio quando opcional e sem demonstração validada do app nesse formato. Se for preencher, o guia atual pede 4 a 8 capturas, por exemplo 1920 × 1080 px, em 16:9.
- **Dobráveis:** deixar vazio quando opcional e sem captura validada. Se for preencher, preparar 3 a 8 capturas reais, incluindo ao menos uma em 1:1, uma em 4:3 e uma em 10:16, até 8 MB cada. A orientação específica mais restritiva do formulário prevalece para o upload.
- **Vídeo:** deixar vazio quando opcional e ainda não houver demonstração real preparada.

[Guia oficial de captura por dispositivo](https://developer.android.com/google/play/requirements/screenshots-android-cli) · [Recursos específicos de dispositivos](https://support.google.com/googleplay/android-developer/answer/9859152?hl=pt-BR).

Antes do upload, conferir quantidade, dimensões, peso, ausência de transparência nos screenshots, interface sem erro/carregamento e correspondência com a versão distribuída. O cadastro das imagens e a distribuição de um AAB são etapas distintas.

## Pacote para entrega

O ZIP é gerado fora dos arquivos versionados, em `.tmp/google-play/PoupEazy-Google-Play-pt-BR.zip`, a partir da raiz deste repositório. Ele reunirá os PNGs para upload, textos, manifestos e guias. Fontes SVG, capturas brutas e o tooling com `node_modules` ficam no repositório/ambiente de trabalho, fora desse pacote de upload.

As capturas comprovam a aparência deste checkout no Expo Go com dados fictícios. Elas não comprovam a geração, o envio ou a validação de um novo AAB, nem a aparência do novo launcher instalado em uma versão de distribuição.
