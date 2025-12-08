import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './BASE_URL.js';

// Reusable check helper. name: label used for k6 check, expectedStatus defaults to 200
export function runCheck(res, name, expectedStatus = 200) {
  try {
    // realiza o check padrão: compara status HTTP com o esperado
    const ok = check(res, { [name]: (r) => r && r.status === expectedStatus });
    if (!ok) {
      // quando falhar, loga um resumo curto (status + trecho do body) para ajudar debug
      const status = res && res.status;
      let bodySnippet = '';
      try {
        if (res && res.body) {
          bodySnippet = typeof res.body === 'string' ? res.body.slice(0, 200) : JSON.stringify(res.body).slice(0, 200);
        }
      } catch (e) {
        bodySnippet = '<unserializable body>';
      }
      console.log(`runCheck failed: ${name} expected=${expectedStatus} got=${status} body=${bodySnippet}`);
    }
    return ok;
  } catch (e) {
    // log de erro inesperado ao executar o check e retorna false
    console.log(`runCheck error: ${name} -> ${e && e.message}`);
    return false;
  }
}

// Register a user and run a health check on the response. Returns the raw response.
export function registerUser(username, pwd) {
  const url = `${BASE_URL}/users/register`;
  const payload = JSON.stringify({ username, password: pwd, favorecidos: ['string'] });
  const params = { headers: { accept: '*/*', 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  // helper-level check (label kept generic)
  runCheck(res, 'register status 201', 201);
  return res;
}

// Login helper: posts credentials, runs a check and returns { res, token }
export function login(username, pwd) {
  const url = `${BASE_URL}/users/login`;
  const payload = JSON.stringify({ username, password: pwd });
  const params = { headers: { accept: '*/*', 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  runCheck(res, 'login status 200', 200);
  let token = null;
  try {
    const b = res.body ? JSON.parse(res.body) : null;
    token = b && b.token;
  } catch (e) {
    token = null;
  }
  return { res, token };
}

export default { runCheck, registerUser, login };
