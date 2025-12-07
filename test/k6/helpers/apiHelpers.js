import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './BASE_URL.js';

// Reusable check helper. name: label used for k6 check, expectedStatus defaults to 200
export function runCheck(res, name, expectedStatus = 200) {
  try {
    return check(res, { [name]: (r) => r.status === expectedStatus });
  } catch (e) {
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
