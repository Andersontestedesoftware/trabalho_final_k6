// importa o cliente http do k6 para executar requisições HTTP
import http from 'k6/http';
// importa utilitários do k6: sleep (pausas) e group (agrupar passos para relatórios)
import {sleep, group } from 'k6';
// importa Trend para criar métricas customizadas (ex.: latência de transferência)
import { Trend } from 'k6/metrics';
// SharedArray permite carregar dados uma vez por VU e compartilhar entre iterações
import { SharedArray } from 'k6/data';
// helpers para gerar dados de teste (pode usar faker ou um fallback)
import { generateUsername, generatePassword, generateAmount } from './helpers/faker.js';
// BASE_URL centralizado (lido de __ENV.base_url ou fallback em helpers/BASE_URL.js)
import { BASE_URL } from './helpers/BASE_URL.js';
// helpers que encapsulam chamadas API (register/login) e execução de checks
import { registerUser, login, runCheck } from './helpers/apiHelpers.js';

// Observação: os helpers (faker adapter, BASE_URL, apiHelpers) vivem em ./helpers/*
// A URL base é configurável via variável de ambiente 'base_url' (via helpers/BASE_URL.js)
// Exemplo de execução:
// k6 run --env base_url="http://localhost:3000" test/k6/trabalho_final_k6.js

// Declara uma métrica customizada (Trend) para registrar dureções de transferências em ms
const transferDuration = new Trend('transfer_duration_ms');

// Configurações do cenário k6: thresholds e stages controlam falhas e padrão de carga
export const options = {
  thresholds: {
    // Thresholds que falham a execução se ultrapassados (úteis em CI)
    // aqui definidos para ambiente local (valores em ms)
    http_req_duration: ['p(90)<=1200', 'p(95)<=1500'],
    http_req_failed: ['rate<0.01']
    // versões comentadas abaixo seriam thresholds muito agressivos (ex.: para unit-tests)
    //http_req_duration: ['p(90)<=2', 'p(95)<=3'],
    //http_req_failed: ['rate<0.01']
  },
  stages: [
    // Sequência de ramp-up, pico(s) e ramp-down para simular tráfego real
    { duration: '5s', target: 20 }, // Ramp up — aumento gradual
    { duration: '12s', target: 20 }, // Average — mantem carga média
    { duration: '3s', target: 150 }, // Spike — pico curto e alto
    { duration: '4s', target: 80 }, // Spike — pico menor
    { duration: '6s', target: 25 }, // Average — retorno a carga média
    { duration: '5s', target: 0 }, // Ramp down — finaliza o teste
  ]
};

// Carrega casos de teste (Data-Driven) uma vez por VU usando SharedArray
// Usamos um módulo JS (`transfer_cases.js`) com comentários; por isso lemos o arquivo
// como string (open), removemos o `export default` e avaliamos o conteúdo com eval.
const transferCases = new SharedArray('transferCases', function () {
  const src = open('./data/transfer_cases.js');
  // remove a declaração 'export default' para permitir eval do array literal
  const cleaned = src.replace(/export default\s+/, '');
  // eval transforma o texto em um array JS - cuidado com eval em outros contextos
  return eval(cleaned);
});

export default function () {

  // ---------- REGISTRO ----------
  // Gera dois usernames únicos por iteração: remetente (from) e destinatário (to).
  // Usa generateUsername() (faker ou fallback) e acrescenta sufixo randômico para evitar colisões.
  const generatedFrom = `from_${generateUsername()}_${Math.floor(Math.random() * 10000)}`;
  const generatedTo = `to_${generateUsername()}_${Math.floor(Math.random() * 10000)}`;
  // Gera senhas por usuário via helper (adapter faker/fallback)
  const generatedFromPassword = generatePassword();
  const generatedToPassword = generatePassword();

  // Registra remetente (group usado para agrupar passos no relatório k6)
  group('registro remetente', function () {
    // registerUser encapsula a chamada POST /users/register e retorna o response
    const res = registerUser(generatedFrom, generatedFromPassword);
    // runCheck valida o status esperado (201) e incrementa a métrica checks
    runCheck(res, 'registro remetente status 201', 201);
  });

  // Pequena pausa para simular comportamento humano entre ações
  sleep(1);

  // Registra destinatário de forma análoga
  group('registro destinatario', function () {
    const res = registerUser(generatedTo, generatedToPassword);
    runCheck(res, 'registro destinatario status 201', 201);
  });

  // Pausa entre registro e login
  sleep(1);

  // ---------- LOGIN ----------
  // Faz login com o remetente e captura token JWT para autenticar a transferência
  let token = null; // token pode ficar nulo se o login falhar
  group('login do remetente', function () {
    // login retorna tipicamente um objeto { token, res }
    const result = login(generatedFrom, generatedFromPassword);
    // captura token de forma segura (evita exceptions se result for undefined)
    token = result && result.token;
    // se o helper retornou a resposta HTTP, executa um check adicional
    if (result && result.res) runCheck(result.res, 'login status 200', 200);
  });

  sleep(1);

  // ---------- TRANSFERÊNCIA ----------
  group('transferencia entre usuarios', function () {
    // monta a URL de transferência usando BASE_URL configurável
    const url = `${BASE_URL}/transfers`;
    // seleciona um caso de testes (atualmente aleatório) do SharedArray
    const caseDef = transferCases[Math.floor(Math.random() * transferCases.length)];
    // gera um valor conforme min/max/decimals do caso selecionado
    const value = generateAmount(caseDef.min, caseDef.max, caseDef.decimals);

    // constrói o payload JSON da transferência
    const payload = JSON.stringify({ 
      from: generatedFrom, 
      to: generatedTo, 
      value 
    });

    // parâmetros e headers da requisição
    const params = { 
      headers: { 
        accept: '*/*', 
        'Content-Type': 'application/json' 
      }
    };

    // adiciona header Authorization se tivermos um token JWT válido
    if (token) params.headers['Authorization'] = `Bearer ${token}`;

    // executa a requisição POST para criar a transferência
    const res = http.post(url, payload, params);

    // registra a duração da requisição na Trend (se disponível em res.timings.duration)
    if (res && res.timings && typeof res.timings.duration === 'number') {
      transferDuration.add(res.timings.duration);
    }

    // valida que a transferência foi criada com status 201
    runCheck(res, 'transferência com sucesso status 201', 201);

    // se houve falha, registra um log curto com status e corpo para ajudar debug
    if (res.status !== 201) {
      console.log('transfer failed', res.status, res.body);
    }
  });
}
