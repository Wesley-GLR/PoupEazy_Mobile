# PoupEazy Mobile

Aplicativo Android do PoupEazy, reimaginado para uso nativo com Expo SDK 57, React Native e TypeScript. O app mantém a identidade visual do projeto web e consome a API própria em `PoupEazy_BackEnd`.

## O que já está disponível

- sessão JWT restaurada com armazenamento seguro no aparelho;
- login, cadastro, perfil e alteração de senha;
- recuperação local por token, sem envio de e-mail nesta etapa;
- cinco abas nativas: Início, Transações, Orçamento, Metas e Mais;
- CRUD de transações, categorias, metas e orçamento;
- períodos mensais globais e associação ao orçamento da data escolhida;
- Open Finance via Pluggy, com importação e deduplicação no backend;
- cache de dados, estados de carregamento/erro/vazio e atualização por gesto;
- layout acessível e adaptado para telas pequenas;
- testes automatizados dos formatadores, cliente HTTP e contratos de serviço.

EAS, AAB e publicação na Play Store continuam adiados até a aprovação dos testes locais.

## Requisitos

- Node.js 20+
- backend local em `http://localhost:3001`
- Expo Go compatível com o SDK 57 ou emulador Android
- Docker Desktop para o ambiente local do backend

## Executar localmente

1. Suba o backend:

   ```powershell
   cd C:\Users\wesle\Documents\GitHub\PoupEazy_BackEnd
   docker compose up -d --build
   ```

2. Instale e inicie o app:

   ```powershell
   cd C:\Users\wesle\Documents\GitHub\PoupEazy_Mobile
   npm install
   npx expo start
   ```

O endereço padrão é escolhido por plataforma:

- emulador Android: `http://10.0.2.2:3001/api`;
- navegador/iOS local: `http://localhost:3001/api`.

Em aparelho Android físico, copie `.env.example` para `.env` e use o IP da máquina na rede local:

```env
EXPO_PUBLIC_API_URL=http://192.168.0.10:3001/api
```

O aparelho e o computador precisam estar na mesma rede, e a porta 3001 precisa estar liberada no firewall.

## Comandos de verificação

```powershell
npx tsc --noEmit
npm run lint
npm test
npx expo-doctor
npx expo export --platform android --output-dir dist-qa
```

A validação local atual conclui 34 testes, as 21 verificações do Expo Doctor e a exportação do bundle Android.

O `npm audit --audit-level=high` também passa sem vulnerabilidades altas ou críticas. Permanecem
11 alertas moderados transitivos na cadeia de ferramentas do Expo (`xcode`/`uuid`); o reparo
forçado sugerido pelo npm faria downgrade para uma versão incompatível do Expo e, por isso, não
deve ser aplicado. Esses alertas devem ser reavaliados nas próximas atualizações do SDK.

## Estrutura principal

```text
src/
├─ app/          rotas, abas e modais do Expo Router
├─ api/          cliente HTTP, serviços e hooks React Query
├─ auth/         sessão e SecureStore
├─ components/   componentes visuais reutilizáveis
├─ features/     telas por domínio
├─ providers/    cache, rede e providers globais
├─ state/        período financeiro global
├─ theme/        cores, tipografia, espaços, raios e sombras
├─ types/        contratos tipados da API
└─ utils/        moeda, datas e mensagens de erro
```

## Open Finance

O app solicita um Connect Token ao backend e abre o widget nativo da Pluggy. Após a conexão:

1. o backend confirma que o item pertence ao usuário;
2. o identificador privado fica somente no servidor;
3. a sincronização busca todas as contas e páginas disponíveis;
4. cada transação entra no orçamento do mês da sua própria data;
5. categorias compatíveis são escolhidas e duplicatas são ignoradas;
6. toda a importação é confirmada ou revertida como uma unidade.

O modal pode ser conferido no Expo Go. O retorno OAuth/app bancário exige um development build Android local e será validado antes das fases de publicação.

Uma correção mantida em `patches/` troca o componente de área segura descontinuado usado pela versão 1.6.0 da biblioteca Pluggy. O script `postinstall` reaplica essa compatibilidade automaticamente após cada `npm install`.

## Segurança

- não coloque credenciais de usuário em `.env`, código ou commits;
- somente `EXPO_PUBLIC_API_URL` pode ser público no bundle;
- o JWT fica no SecureStore em Android/iOS;
- um `401` limpa a sessão e os dados em cache;
- IDs/tokens internos da integração nunca são devolvidos pela listagem da API.
