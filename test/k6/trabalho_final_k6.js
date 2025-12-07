import http from 'k6/http';
import {sleep, group } from 'k6';
import { Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import { generateUsername, generatePassword, generateAmount } from './helpers/faker.js';
import { BASE_URL } from './helpers/BASE_URL.js';
import { registerUser, login, runCheck } from './helpers/apiHelpers.js';

// note: debug inspection of `faker` removed — helpers live in ./helpers/faker.js

// URL base configurável via variável de ambiente 'base_url' (lida de `helpers/BASE_URL.js`)
// Ex.: k6 run --env base_url="http://localhost:3000" test/k6/trabalho_final_k6.js

// Métrica customizada para medir duração das requisições de transferência (ms)
const transferDuration = new Trend('transfer_duration_ms');

export const options = {
  thresholds: {
  // Thresholds ajustados para ambientes locais (milissegundos)
  http_req_duration: ['p(90)<=1200', 'p(95)<=1500'],
  http_req_failed: ['rate<0.01']
    //http_req_duration: ['p(90)<=2', 'p(95)<=3'],
    //http_req_failed: ['rate<0.01']
  },
  stages: [
    { duration: '5s', target: 20 }, // Ramp up — aumento gradual
    { duration: '12s', target: 20 }, // Average — média
    { duration: '3s', target: 150 }, // Spike — pico curto e alto
    { duration: '4s', target: 80 }, // Spike — pico menor
    { duration: '6s', target: 25 }, // Average — retorno à média
    { duration: '5s', target: 0 }, // Ramp down — desaceleração
  ]
};

// Carrega casos de teste (Data-Driven) uma vez por VU
// Agora usamos um módulo JS com comentários: transfer_cases.js
// `open()` lê o arquivo e `eval` converte em um array JS.
const transferCases = new SharedArray('transferCases', function () {
  const src = open('./data/transfer_cases.js');
  // o arquivo exporta com `export default [...]`, removemos a parte de export para eval
  const cleaned = src.replace(/export default\s+/, '');
  return eval(cleaned);
});

export default function () {

  // ---------- REGISTRO ----------
  // Gera dois usernames únicos: remetente (from) e destinatário (to) usando `faker`
  // acrescenta um sufixo randômico para evitar colisões entre execuções
  const generatedFrom = `from_${generateUsername()}_${Math.floor(Math.random() * 10000)}`;
  const generatedTo = `to_${generateUsername()}_${Math.floor(Math.random() * 10000)}`;
  // gerar per-user passwords usando adapter (faker ou fallback)
  const generatedFromPassword = generatePassword();
  const generatedToPassword = generatePassword();

  // Registra remetente
  group('registro remetente', function () {
    const res = registerUser(generatedFrom, generatedFromPassword);
    runCheck(res, 'registro remetente status 201', 201);
  });

  sleep(1);

  // Registra destinatário
  group('registro destinatario', function () {
    const res = registerUser(generatedTo, generatedToPassword);
    runCheck(res, 'registro destinatario status 201', 201);
  });

  // Pequena pausa para simular comportamento real entre passos
  sleep(1);

  // ---------- LOGIN ----------
  // Faz login com o remetente e obtém o token
  let token = null;
  group('login do remetente', function () {
    const result = login(generatedFrom, generatedFromPassword);
    token = result && result.token;
  if (result && result.res) runCheck(result.res, 'login status 200', 200);
  });

  sleep(1);

  // ---------- TRANSFERÊNCIA ----------
  group('transferencia entre usuarios', function () {
  const url = `${BASE_URL}/transfers`;
  // Seleciona um caso de teste (aleatório) e gera um valor baseado nele
  const caseDef = transferCases[Math.floor(Math.random() * transferCases.length)];
  const value = generateAmount(caseDef.min, caseDef.max, caseDef.decimals);
    const payload = JSON.stringify({ 
      from: generatedFrom, 
      to: generatedTo, 
      value 
    });
    const params = { 
      headers: { 
        accept: '*/*', 
        'Content-Type': 'application/json' 
      }};
  // se tivermos o token JWT, adicionamos o header Authorization para requisições autenticadas
  if (token) params.headers['Authorization'] = `Bearer ${token}`;
  const res = http.post(url, payload, params);
    // registra a duração (em ms) da requisição de transferência na métrica customizada
    if (res && res.timings && typeof res.timings.duration === 'number') {
      transferDuration.add(res.timings.duration);
    }
    runCheck(res, 'transferência com sucesso status 201', 201);
  // Em caso de falha na transferência, registra status e corpo para depuração
    if (res.status !== 201) {
      // log curto para ajudar a depurar quando ocorrer erro de negócio (ex: usuário não encontrado)
      console.log('transfer failed', res.status, res.body);
    }
  });
}
