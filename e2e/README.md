# Testes de autenticação

Esta entrega cobre somente os dois grupos solicitados do `Plano_de_Testes_PoupEazy.pdf`:

| Plano | Implementação | Comando no projeto mobile |
| --- | --- | --- |
| 6.1 — Integração do contexto de autenticação | Suíte Jest do contexto de autenticação | `npm run test:auth` |
| 7.1 — Autenticação de ponta a ponta | Um fluxo Android em `e2e/auth.yaml`, com app, API e PostgreSQL reais | `npm run test:e2e:auth` |

O E2E foi preparado para execução posterior; não foi executado em aparelho/emulador nesta entrega. Revisar o YAML não comprova que o fluxo passou. Os demais grupos do plano ficam para outra etapa.

## Integração

Na raiz de `PoupEazy_Mobile`:

```powershell
npm install
npm run test:auth
```

A suíte exercita o contexto e seus consumidores, com dependências externas controladas. Não precisa de Android nem de banco de dados. Inclui cadastro sem autenticação automática e limpeza de sessão após trocar a senha.

A confirmação de cadastro e a recuperação têm testes de interface separados. Para executar os testes relevantes de autenticação:

```powershell
npx jest --runInBand --runTestsByPath __tests__/auth-context.test.tsx __tests__/email-verification.test.tsx __tests__/forgot-password-screen.test.tsx __tests__/api-services.test.ts
```

## Pré-requisitos do E2E

- Node/npm e o repositório `PoupEazy_BackEnd` ao lado deste projeto.
- PostgreSQL local e um banco **exclusivo de testes**, vazio na primeira preparação.
- Uma conta exclusiva de testes já confirmada pela API/site, para validar login e restauração da sessão. O roteiro também cria uma conta nova pendente e verifica que ela não consegue entrar antes de confirmar o e-mail.
- Android SDK, `adb` no `PATH` e JDK compatível com o build Android desta versão do Expo. Siga a [configuração oficial do ambiente Expo](https://docs.expo.dev/get-started/set-up-your-environment/).
- Emulador iniciado ou aparelho Android conectado por USB com depuração autorizada. `adb devices` deve mostrar o dispositivo como `device`. Para simplificar, mantenha somente um dispositivo conectado.
- Maestro CLI no `PATH`. Siga a [instalação oficial do Maestro para Windows](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) e confira `maestro --help`. O Maestro requer Java 17 ou superior; isso não substitui o requisito de compatibilidade do build Expo.

Use o aplicativo Android de testes instalado com o pacote `com.wesleyglr.poupeazy`. O fluxo não é direcionado ao Expo Go e não depende de tokens de recuperação retornados pela API.

## 1. API e banco local — terminal 1

No computador desta entrega, os executáveis do PostgreSQL estão em `C:\Program Files\PostgreSQL\18\bin`. Ajuste esse caminho e a porta se sua instalação for diferente.

Crie o banco uma única vez. Informe um usuário PostgreSQL local com permissão para criar bancos; `createdb -W` solicita a senha sem colocá-la no comando:

```powershell
$pgBin = 'C:\Program Files\PostgreSQL\18\bin'
$dbUser = Read-Host 'Usuario do PostgreSQL local'
& "$pgBin\createdb.exe" -h 127.0.0.1 -p 5432 -U $dbUser -W poupeazy_auth_e2e
```

Prossiga apenas se a criação terminar com sucesso. Se já existe um banco `poupeazy_auth_e2e`, reutilize-o somente se ele for exclusivo destes testes. Não execute `db/reset.sql` nem apague bancos usados pelo projeto.

No mesmo terminal, configure explicitamente a conexão local antes de inicializar o schema. Informe novamente a senha desse usuário; ela será codificada para uso na URI, sem impressão no terminal:

```powershell
Set-Location 'C:\Users\idjar\Documents\GitHub\PoupEazy_BackEnd'
$dbPassword = Read-Host 'Senha do PostgreSQL local' -AsSecureString
$dbCredential = [System.Management.Automation.PSCredential]::new($dbUser, $dbPassword)
$dbUserEncoded = [Uri]::EscapeDataString($dbUser)
$dbPasswordEncoded = [Uri]::EscapeDataString($dbCredential.GetNetworkCredential().Password)
$env:DATABASE_URL = "postgresql://${dbUserEncoded}:${dbPasswordEncoded}@127.0.0.1:5432/poupeazy_auth_e2e"
$env:JWT_SECRET = 'somente-testes-locais-poupeazy-auth-e2e-2026'
$env:NODE_ENV = 'test'
$env:DATABASE_SSL = 'disable'
$env:PORT = '3002'
npm install
npm run db:init
```

Se o schema for aplicado com sucesso, inicie a API e mantenha este terminal aberto:

```powershell
npm start
```

`db:init` aplica `db/schema.sql`, que já contém as tabelas e migrações necessárias para um banco novo. As variáveis acima sobrepõem os valores carregados de `.env`. Não use a API publicada no Render nem credenciais de produção neste roteiro.

`NODE_ENV=test` não permite obter tokens de recuperação ou confirmação pela API pública. Para testar as solicitações com os endereços descartáveis deste roteiro, use uma instância de testes com transporte de e-mail capturado pelo harness do backend, sem enviar para o Gmail real. O envio precisa estar habilitado nessa instância; caso contrário a API responde que o serviço está indisponível. Prepare a conta confirmada usando o link capturado por esse transporte e a página/endpoint de confirmação, sem alterar as regras de login. Credenciais da Pluggy não são necessárias.

## 2. Instalar o app e manter o Metro — terminal 2

Configure `EXPO_PUBLIC_API_URL` **antes** do build/início do Metro. Para o emulador Android padrão:

```powershell
Set-Location 'C:\Users\idjar\Documents\GitHub\PoupEazy_Mobile'
npm install
adb devices
$env:EXPO_PUBLIC_API_URL = 'http://10.0.2.2:3002/api'
npx expo run:android
```

Para aparelho físico via USB, use estas duas linhas **no lugar** da configuração de URL acima, antes de `npx expo run:android`:

```powershell
adb reverse tcp:3002 tcp:3002
$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:3002/api'
```

Deixe a API e o Metro rodando durante o teste. Se o Metro já estava aberto com outra URL, encerre-o e reinicie-o no terminal com a variável correta usando `npx expo start --clear`. A tela de recuperação tem o mesmo comportamento em desenvolvimento e produção.

Abra o app uma vez e confira a tela de login. No primeiro início, pode ser necessário fechar manualmente uma apresentação/menu de desenvolvimento do Expo antes de executar o fluxo. O teste deve operar as telas do PoupEazy.

## 3. Executar — terminal 3

```powershell
Set-Location 'C:\Users\idjar\Documents\GitHub\PoupEazy_Mobile'
Invoke-RestMethod 'http://127.0.0.1:3002/api/health'
adb devices
maestro test --test-output-dir .tmp/maestro -e AUTH_VERIFIED_EMAIL=conta-confirmada@example.com -e AUTH_VERIFIED_PASSWORD=SenhaExclusivaTeste123! e2e/auth.yaml
```

O healthcheck deve retornar `status: ok`. Substitua os parâmetros acima pelas credenciais da conta confirmada no banco de testes. São parâmetros do [Maestro](https://docs.maestro.dev/maestro-flows/flow-control-and-logic/parameters-and-constants), não variáveis públicas embutidas no aplicativo. Não use credenciais pessoais ou de produção. O script npm também aceita esses parâmetros:

```powershell
npm run test:e2e:auth -- -e AUTH_VERIFIED_EMAIL=conta-confirmada@example.com -e AUTH_VERIFIED_PASSWORD=SenhaExclusivaTeste123!
```

O fluxo verifica, em sequência:

1. Abertura sem sessão e rejeição de credenciais inválidas.
2. Cadastro sem login automático, aviso de confirmação e bloqueio do login da conta nova pendente.
3. Login com a conta de testes já confirmada; sessão preservada ao fechar/reabrir o app. Depois do logout, a reabertura permanece na tela de login.
4. Solicitação de recuperação, mensagem genérica sem revelar se a conta existe e retorno à tela de login.

Os fluxos de cadastro, login e sessão usam API e banco reais. Somente o transporte de e-mail deve ser capturado no servidor de testes. Cada execução cria uma conta pendente `Usuario E2E` com e-mail `e2e.auth.<timestamp>.<aleatorio>@example.com` e senha sintética `E2eInicial123!`; não reutilize essa senha fora do banco de testes. A conta confirmada passada por parâmetro é reutilizada e o roteiro não altera sua senha.

A confirmação completa pelo e-mail também precisa de verificação integrada separada: crie uma conta de testes, abra o link recebido, confirme no site e volte ao app para entrar. Confira que o link só pode ser usado uma vez e que um link expirado oferece reenvio. Uma conta criada antes da exigência de confirmação deve continuar acessando normalmente.

O reset completo pelo link do e-mail precisa de uma verificação integrada separada: solicite a recuperação para uma caixa de testes que você controla, confira o link recebido e abra a página no navegador. Defina a nova senha, volte ao app, confirme que a senha antiga é recusada e que a nova funciona. Reutilizar o link ou usar um link expirado deve falhar. Este YAML não acessa a caixa de e-mail nem comprova a entrega de mensagens.

O `clearState` inicial apaga os dados locais **somente do app alvo** no dispositivo; use uma instalação de testes, sem uma sessão pessoal que queira preservar. As contas criadas permanecem no banco; o roteiro não executa a exclusão. Use um banco descartável dedicado e não limpe dados de outros usuários.

O resultado só será aprovado após o Maestro concluir o fluxo sem falhas. Consulte os artefatos gerados em `.tmp/maestro` e registre a data, dispositivo e resultado da execução. Em caso de falha no primeiro acesso, confira primeiro API, URL embutida no app, conectividade e eventuais telas de desenvolvimento.
