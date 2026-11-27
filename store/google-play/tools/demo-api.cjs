#!/usr/bin/env node
'use strict';

/**
 * API LOCAL de capturas da loja. TODOS os dados abaixo sao ficticios.
 * Nao importa a API real, dotenv, banco, SDKs, Gmail ou arquivos de credenciais.
 * Nao faz requests externos, proxy, cadastro, gravacoes ou envios.
 *
 * Executar: node store/google-play/tools/demo-api.cjs
 * Base no computador: http://127.0.0.1:43188/api
 * Base no emulador Android: http://10.0.2.2:43188/api
 * Login SOMENTE de demonstracao: ana@example.test / DemoPoupEazy2026!
 * Configure EXPO_PUBLIC_API_URL explicitamente e EXPO_NO_DOTENV=1 no Metro.
 * A sessao ficticia nao e um JWT e nao funciona na API real. Limpe-a ao terminar.
 * As telas usam o periodo do dispositivo; selecione novembro de 2026.
 *
 * Verificacao sem abrir porta: node store/google-play/tools/demo-api.cjs --self-test
 */

const http = require('node:http');
const assert = require('node:assert/strict');

const HOST = '127.0.0.1';
const PORT = 43188;
const DEMO_EMAIL = 'ana@example.test';
const DEMO_PASSWORD = 'DemoPoupEazy2026!';
const DEMO_TOKEN = 'poupeazy-store-demo-only-not-a-real-jwt';
const OWNER = '10000000-0000-4000-8000-000000000001';
const stamp = '2026-11-27T12:00:00.000Z';
const uuid = (family, number) => `${family}000000-0000-4000-8000-${String(number).padStart(12, '0')}`;

const user = { id: OWNER, email: DEMO_EMAIL, email_verificado: true, email_verificacao_obrigatoria: true, criado_em: '2026-09-01T12:00:00.000Z' };
const profile = { id: OWNER, nome: 'Ana Exemplo', telefone: null, criado_em: user.criado_em, atualizado_em: stamp };
const categoryRows = [
  ['Moradia', 'despesa_fixa', 'home-outline'],
  ['Alimentação', 'despesa_variavel', 'food-outline'],
  ['Saúde', 'despesa_variavel', 'heart-pulse'],
  ['Educação', 'despesa_variavel', 'school-outline'],
  ['Transporte', 'despesa_variavel', 'bus'],
  ['Lazer', 'despesa_variavel', 'movie-open-outline'],
  ['Assinaturas', 'despesa_fixa', 'repeat'],
  ['Outros', 'despesa_variavel', 'dots-horizontal'],
  ['Salário', 'receita', 'cash'],
  ['Freelance', 'receita', 'briefcase-outline'],
];
const categories = categoryRows.map(([nome, tipo, icone], index) => ({ id: uuid('20', index + 1), id_usuario: null, nome, tipo, icone, sistema: true }));
const goals = [
  { id: uuid('30', 1), id_usuario: OWNER, nome: 'Reserva de emergência', descricao: 'Mais tranquilidade para os imprevistos.', valor_objetivo: '5000.00', valor_atual: '1800.00', data_limite: '2027-06-30', status: 'ativa', criado_em: user.criado_em },
  { id: uuid('30', 2), id_usuario: OWNER, nome: 'Notebook para estudar', descricao: 'Um passo de cada vez para o próximo semestre.', valor_objetivo: '3600.00', valor_atual: '1200.00', data_limite: '2027-03-31', status: 'ativa', criado_em: user.criado_em },
  { id: uuid('30', 3), id_usuario: OWNER, nome: 'Curso de idiomas', descricao: null, valor_objetivo: '480.00', valor_atual: '480.00', data_limite: '2026-10-31', status: 'concluida', criado_em: user.criado_em },
];
const budgets = [
  { id: uuid('40', 10), id_usuario: OWNER, mes: 10, ano: 2026, valor_planejado: '4000.00', valor_real: '-2720.00', criado_em: '2026-10-01T12:00:00.000Z', atualizado_em: stamp },
  { id: uuid('40', 11), id_usuario: OWNER, mes: 11, ano: 2026, valor_planejado: '4000.00', valor_real: '-3359.30', criado_em: '2026-11-01T12:00:00.000Z', atualizado_em: stamp },
];
// Category index, value, date, description, type, optional goal index, status, origin.
const transactionRows = [
  [6, '39.90', '2026-11-28', 'Assinatura de música', 'despesa', null, 'pendente'],
  [1, '356.80', '2026-11-27', 'Compras do mercado', 'despesa'],
  [4, '148.00', '2026-11-26', 'Transporte do mês', 'despesa', null, 'confirmada', 'chatbot'],
  [9, '400.00', '2026-11-25', 'Projeto freelance', 'receita'],
  [7, '400.00', '2026-11-24', 'Aporte para a reserva', 'despesa', 0],
  [3, '120.00', '2026-11-23', 'Curso de fotografia', 'despesa'],
  [2, '85.90', '2026-11-20', 'Farmácia', 'despesa'],
  [5, '180.00', '2026-11-18', 'Cinema e passeio', 'despesa'],
  [6, '100.00', '2026-11-15', 'Internet de casa', 'despesa'],
  [0, '1450.00', '2026-11-05', 'Aluguel', 'despesa'],
  [8, '5800.00', '2026-11-01', 'Salário de novembro', 'receita'],
  [7, '1400.00', '2026-10-20', 'Primeiro aporte para a reserva', 'despesa', 0],
  [7, '1200.00', '2026-10-15', 'Aporte para o notebook', 'despesa', 1],
  [7, '480.00', '2026-10-10', 'Objetivo do curso alcançado', 'despesa', 2],
  [8, '5800.00', '2026-10-01', 'Salário de outubro', 'receita'],
];
const transactions = transactionRows.map(([category, valor, data_transacao, descricao, tipo, goal = null, status = 'confirmada', origem = 'manual'], index) => ({
  id: uuid('50', index + 1), id_orcamento: budgets.find((budget) => budget.mes === Number(data_transacao.slice(5, 7))).id,
  id_categoria: categories[category].id, id_metas: goal === null ? null : goals[goal].id,
  valor, data_transacao, descricao, tipo, origem, status, nlp_metadata: null, id_externo: null,
  criado_em: `${data_transacao}T12:00:00.000Z`, categoria: categories[category],
}));
const preferences = {
  alerta_orcamento_ativo: true, alerta_orcamento_percentual: 80,
  alerta_despesa_ativo: true, alerta_despesa_valor_minimo: 250,
  alerta_receita_ativo: false, alerta_receita_valor_minimo: 1000,
  alerta_meta_concluida_ativo: true, email_verificado: true,
};

function positiveInt(value, fallback, maximum) {
  return /^\d+$/.test(value || '') && Number(value) >= 1 ? Math.min(Number(value), maximum) : fallback;
}

function listTransactions(params) {
  const text = (value) => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  let rows = transactions.filter((row) => {
    for (const key of ['tipo', 'origem', 'status', 'id_categoria', 'id_orcamento', 'id_metas']) {
      if (params.get(key) && row[key] !== params.get(key)) return false;
    }
    if (params.get('data_inicio') && row.data_transacao < params.get('data_inicio')) return false;
    if (params.get('data_fim') && row.data_transacao > params.get('data_fim')) return false;
    return !params.get('q') || text(row.descricao).includes(text(params.get('q')));
  });
  rows = [...rows].sort((left, right) => right.data_transacao.localeCompare(left.data_transacao) || right.criado_em.localeCompare(left.criado_em));
  const page = positiveInt(params.get('page'), 1, 1000000);
  const limit = positiveInt(params.get('limit'), 50, 1000);
  return { data: rows.slice((page - 1) * limit, page * limit), pagination: { page, limit, total: rows.length, totalPages: Math.ceil(rows.length / limit) } };
}

const readRoutes = new Set(['/api/auth/me', '/api/profile', '/api/despesas', '/api/categorias', '/api/metas', '/api/orcamentos', '/api/preferencias-email', '/api/integracoes', '/api/whatsapp/vinculo']);
const resourcePath = /^\/api\/(?:auth|profile|despesas|categorias|metas|orcamentos|preferencias-email|integracoes|pluggy|whatsapp|relatorios|notificacoes)(?:\/|$)/;

function demoResponse({ method = 'GET', path = '/', authorization = '', body } = {}) {
  const url = new URL(path, `http://${HOST}:${PORT}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  if (method === 'GET' && pathname === '/api/health') return { status: 200, data: { status: 'ok', demo: true } };
  if (method === 'POST' && pathname === '/api/auth/login') {
    if (body?.email?.trim().toLowerCase() !== DEMO_EMAIL || body?.password !== DEMO_PASSWORD) {
      return { status: 401, data: { error: 'Use somente as credenciais fictícias documentadas no harness.', code: 'DEMO_LOGIN_REQUIRED' } };
    }
    return { status: 200, data: { token: DEMO_TOKEN, user, profile } };
  }
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) && resourcePath.test(pathname)) {
    return { status: 403, data: { error: 'Demonstração somente leitura: alterações e envios estão desativados.', code: 'DEMO_READ_ONLY' } };
  }
  if (method !== 'GET' || !readRoutes.has(pathname)) return { status: 404, data: { error: 'Rota indisponível na demonstração local.' } };
  if (authorization !== `Bearer ${DEMO_TOKEN}`) return { status: 401, data: { error: 'Entre com a conta fictícia da demonstração.' } };
  const data = {
    '/api/auth/me': { user, profile }, '/api/profile': profile,
    '/api/despesas': () => listTransactions(url.searchParams), '/api/categorias': categories,
    '/api/metas': goals, '/api/orcamentos': budgets, '/api/preferencias-email': preferences,
    '/api/integracoes': [], '/api/whatsapp/vinculo': { habilitado: false, vinculado: false, url: null },
  }[pathname];
  return { status: 200, data: typeof data === 'function' ? data() : data };
}

function sendJson(res, response) {
  res.writeHead(response.status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(response.data));
}

function readLoginBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []; let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > 4096) { reject(new Error('body-limit')); req.resume(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { reject(new Error('invalid-json')); } });
    req.on('error', () => reject(new Error('request-error')));
  });
}

function createDemoServer() {
  return http.createServer({ requestTimeout: 10000, headersTimeout: 10000 }, async (req, res) => {
    // Apenas origens locais; apps nativos nao precisam de CORS.
    const origin = req.headers.origin;
    if (origin && !/^http:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin)) {
      req.resume(); return sendJson(res, { status: 403, data: { error: 'A demonstração aceita somente origens locais.' } });
    }
    if (origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    try {
      const login = req.method === 'POST' && new URL(req.url, `http://${HOST}:${PORT}`).pathname.replace(/\/+$/, '') === '/api/auth/login';
      const body = login ? await readLoginBody(req) : undefined;
      if (!login) req.resume();
      return sendJson(res, demoResponse({ method: req.method, path: req.url, authorization: req.headers.authorization, body }));
    } catch {
      return sendJson(res, { status: 400, data: { error: 'Requisição local inválida.' } });
    }
  });
}

function selfTest() {
  const call = (method, path, body) => demoResponse({ method, path, body, authorization: `Bearer ${DEMO_TOKEN}` });
  assert.equal(call('POST', '/api/auth/login', { email: DEMO_EMAIL, password: DEMO_PASSWORD }).status, 200);
  assert.equal(call('POST', '/api/auth/login', { email: 'other@example.test', password: 'incorrect' }).status, 401);
  assert.equal(demoResponse({ path: '/api/auth/me' }).status, 401);
  for (const path of readRoutes) assert.equal(call('GET', path).status, 200);
  const november = call('GET', '/api/despesas?data_inicio=2026-11-01&data_fim=2026-11-30').data;
  assert.equal(november.pagination.total, 11);
  const totals = november.data.filter((row) => row.status === 'confirmada').reduce((result, row) => {
    result[row.tipo] += Math.round(Number(row.valor) * 100); return result;
  }, { receita: 0, despesa: 0 });
  assert.deepEqual(totals, { receita: 620000, despesa: 284070 });
  for (const budget of budgets) {
    const net = transactions.filter((row) => row.id_orcamento === budget.id && row.status === 'confirmada')
      .reduce((sum, row) => sum + (row.tipo === 'despesa' ? 1 : -1) * Math.round(Number(row.valor) * 100), 0);
    assert.equal(net, Math.round(Number(budget.valor_real) * 100));
  }
  for (const goal of goals) {
    const total = transactions.filter((row) => row.id_metas === goal.id && row.status === 'confirmada')
      .reduce((sum, row) => sum + (row.tipo === 'despesa' ? 1 : -1) * Math.round(Number(row.valor) * 100), 0);
    assert.equal(total, Math.round(Number(goal.valor_atual) * 100));
  }
  assert.equal(call('GET', '/api/despesas?q=farmacia').data.pagination.total, 1);
  assert.equal(call('GET', '/api/despesas?tipo=receita&limit=1&page=2').data.data.length, 1);
  assert.equal(call('GET', '/api/despesas?status=pendente').data.pagination.total, 1);
  for (const [method, path] of [['POST', '/api/auth/register'], ['POST', '/api/auth/forgot-password'], ['PATCH', '/api/preferencias-email'], ['POST', '/api/relatorios/email'], ['POST', '/api/despesas'], ['DELETE', '/api/auth/delete-account'], ['POST', '/api/pluggy/sync/example']]) {
    assert.equal(call(method, path).status, 403);
  }
  assert.equal(call('GET', '/api/unknown').status, 404);
  assert.equal(call('POST', '/api/unknown').status, 404);
  assert.equal(call('GET', '/api/pluggy/token').status, 404);
  console.log('Harness verificado: contratos, filtros, paginação, totais e bloqueios; nenhuma porta aberta.');
}

module.exports = { createDemoServer, demoResponse, HOST, PORT };
if (require.main === module) {
  if (process.argv.length === 3 && process.argv[2] === '--self-test') selfTest();
  else if (process.argv.length > 2) { console.error('Use sem argumentos ou --self-test.'); process.exitCode = 1; }
  else {
    const server = createDemoServer();
    server.on('error', () => { console.error('Não foi possível iniciar o harness local.'); process.exitCode = 1; });
    server.listen(PORT, HOST, () => console.log(`Harness local somente leitura em http://${HOST}:${PORT}/api; dados fictícios; sem serviços externos.`));
  }
}
