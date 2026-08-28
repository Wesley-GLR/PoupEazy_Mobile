# Migração PoupEazy Web → Expo

Este arquivo acompanha as fases 0–8 aprovadas. Publicação/EAS/Play Store permanecem adiadas.

## Fundação

- [x] Auditoria do frontend web e do backend
- [x] Scaffold Expo SDK 57 com TypeScript e Expo Router
- [x] Identidade visual e design tokens
- [x] Providers globais, navegação e estados de aplicação
- [x] Cliente HTTP, sessão segura e cache
- [x] Testes básicos da fundação

## Segurança e contrato do backend

- [x] Fechar acesso indevido a itens Pluggy
- [x] Validar orçamento, categoria e meta por proprietário
- [x] Ocultar campos internos das integrações
- [x] Corrigir validações e códigos de erro
- [x] Adicionar filtros/paginação compatíveis em transações
- [x] Tornar a sincronização Open Finance idempotente no backend
- [x] Adicionar testes e documentação de contrato
- [x] Envio de e-mail adiado por decisão do projeto

## Telas nativas

- [x] Login e restauração de sessão
- [x] Cadastro
- [x] Recuperação/reset local por token (sem envio de e-mail)
- [x] Shell autenticado e cinco abas
- [x] Início/Dashboard
- [x] Transações e formulário
- [x] Orçamento e formulário
- [x] Metas, formulário e movimentações
- [x] Mais/Perfil
- [x] Categorias e formulário
- [x] Open Finance

## Verificação

- [x] TypeScript sem erros
- [x] Lint sem erros
- [x] 37 testes unitários e de contrato
- [x] Backend validado localmente
- [x] API publicada no Render configurada como endereço padrão do aplicativo
- [x] Bundle Android gerado com sucesso
- [x] App iniciado no Expo Go/Android local
- [x] Login, logout, painel, filtros e CRUD de transações validados no emulador
- [x] Orçamento, metas, categorias, perfil e estados vazios validados no emulador
- [x] Modal e sincronização Pluggy validados no ambiente local
- [x] Fluxos críticos comparados com o web

## Adiado

- EAS development/preview/production
- Build AAB
- Publicação e requisitos da Play Store
- Envio de e-mail de recuperação
