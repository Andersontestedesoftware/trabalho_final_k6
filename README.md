# API de Transferências e Usuários

Esta API permite o registro, login, consulta de usuários e transferências de valores entre usuários. O objetivo é servir de base para estudos de testes e automação de APIs.

## Tecnologias
- Node.js
- Express
- Swagger (documentação)
- Banco de dados em memória (variáveis)

## Instalação

1. Clone o repositório:
   ```sh
   git clone <repo-url>
   cd pgats-02-api
   ```
2. Instale as dependências:
   ```sh
   npm install express swagger-ui-express bcryptjs
   ```

## Como rodar

- Para iniciar o servidor:
  ```sh
  node server.js
  ```
- A API estará disponível em `http://localhost:3000`
- A documentação Swagger estará em `http://localhost:3000/api-docs`

## Endpoints principais

### Registro de usuário
- `POST /users/register`
  - Body: `{ "username": "string", "password": "string", "favorecidos": ["string"] }`

### Login
- `POST /users/login`
  - Body: `{ "username": "string", "password": "string" }`

### Listar usuários
- `GET /users`

### Transferências
- `POST /transfers`
  - Body: `{ "from": "string", "to": "string", "value": number }`
- `GET /transfers`

## Regras de negócio
- Não é permitido registrar usuários duplicados.
- Login exige usuário e senha.
- Transferências acima de R$ 5.000,00 só podem ser feitas para favorecidos.
- O saldo inicial de cada usuário é de R$ 10.000,00.

## Testes
- O arquivo `app.js` pode ser importado em ferramentas de teste como Supertest.

## Comentários do aluno sobre o teste k6

O código abaixo está armazenado no arquivo `test/k6/trabalho_final_k6.js` e demonstra alguns conceitos importantes de teste de carga com k6. Abaixo eu comentei os trechos do seu script seguindo o formato de exemplo (cada snippet contém comentários inline com as linhas correspondentes):

- Groups
  - Exemplo no meu código:

    - Comentário: uso do `group()` para agrupar passos lógicos do teste (registro, login, transferência). Facilita leitura e relatórios.

    ```javascript
    group('login do remetente', function () { // linhas 76-80
      const result = login(email, password); // linhas 76-78
      const token = result && result.token; // linhas 76-78
    });
    ```


- Thresholds
  - Localização: `export const options.thresholds` em `test/k6/trabalho_final_k6.js`.
  - Exemplo no meu código:

    - Comentário: limites de aceitação para latência (percentis) e taxa de erro; úteis para falhar builds quando a performance degrada.

    ```javascript
    http_req_duration: ['p(90)<=1200', 'p(95)<=1500'], // linhas 17-22
    http_req_failed: ['rate<0.01'] // linhas 17-22
    ```


- Checks
  - Localização: uso de `runCheck(res, 'mensagem', expectedStatus)` em `helpers/apiHelpers.js` e chamadas no script principal.
  - Exemplo no meu código:

    - Comentário: validações funcionais por requisição que contribuem para as metrics `checks` do k6.

    ```javascript
    const res = registerUser(generatedFrom, generatedFromPassword); // linha 59
    runCheck(res, 'registro remetente status 201', 201); // linha 59
    ```
 

- Helpers
  - Localização: `test/k6/helpers/*` — por exemplo `apiHelpers.js`, `faker.js`, `BASE_URL.js`.
  - Exemplo no meu código:
 
    - Comentário: encapsulam registro, login e verificação para manter o script legível e reutilizável.

    ```javascript
    import { registerUser, login, runCheck } from './helpers/apiHelpers.js'; // linhas 1-7
    ```
 
- Trends
  - Localização: `test/k6/trabalho_final_k6.js` — definição `const transferDuration = new Trend('transfer_duration_ms')` (linha 15) e uso no bloco de transferência (linha 105).
  - Exemplo no meu código:

    - Comentário: métricas customizadas para analisar distribuição de latências específicas (aqui: transferências).

    ```javascript
    if (res && res.timings && typeof res.timings.duration === 'number') {
      transferDuration.add(res.timings.duration); // linha 105
    }
    ```

- Faker
  - Localização: `test/k6/helpers/faker.js` e import `generateUsername`, `generatePassword`, `generateAmount`.
  - Exemplo no meu código:

    - Comentário: gera dados realistas e únicos por VU/iteração (usernames, senhas e valores), reduzindo colisões durante os testes. O helper tenta usar a biblioteca faker quando disponível e possui um fallback simples que gera strings/valores programaticamente caso a extensão falhe ou não esteja presente, garantindo que o script continue executando em ambientes sem dependências extra.

    ```javascript
    const generatedFrom = `from_${generateUsername()}_${Math.floor(Math.random() * 10000)}`; // linhas 50-53
    ```

- Variável de Ambiente
  - Localização: `test/k6/helpers/BASE_URL.js` — `export const BASE_URL = __ENV.base_url || 'http://localhost:3000'` (linha 2); o script usa `--env base_url="http://localhost:3000"`.
  - Exemplo no meu código:

    - Comentário: permite apontar os testes para diferentes ambientes sem alterar código.

    ```javascript
    import { BASE_URL } from './helpers/BASE_URL.js'; // import no topo do script
    const res = http.get(`${BASE_URL}/users`); // uso simples do BASE_URL
    ```


- Stages
  - Localização: `test/k6/trabalho_final_k6.js` — `export const options.stages` (linhas 25-30).
  - Exemplo no meu código:

    - Comentário: definições de rampa (ramp-up, spike, ramp-down) para simular diferentes padrões de tráfego.

    ```javascript
    stages: [ // linhas 25-30
      { duration: '5s', target: 20 }, // Ramp up — aumento gradual
      { duration: '12s', target: 20 }, // Average — média
      { duration: '3s', target: 150 }, // Spike — pico curto e alto
      { duration: '4s', target: 80 }, // Spike — pico menor
      { duration: '6s', target: 25 }, // Average — retorno à média
      { duration: '5s', target: 0 }, // Ramp down — desaceleração
    ]
    ```
  

- Reaproveitamento de Resposta
  - Localização: `test/k6/trabalho_final_k6.js` — `login()` retorna `token` e o mesmo é reutilizado para autorizar a requisição de transferência.
  - Exemplo no meu código:

    - Comentário: extrai valor do corpo da resposta e reaproveita em chamadas subsequentes, simulando fluxo real do sistema.

    ```javascript
    const result = login(generatedFrom, generatedFromPassword); // linhas 76-78
    token = result && result.token; // linhas 76-78
    if (token) params.headers['Authorization'] = `Bearer ${token}`; // linha 101
    ```


- Uso de Token de Autenticação
  - Localização: `test/k6/trabalho_final_k6.js` — montagem do header `Authorization` para chamadas a `/transfers` (linha 101).
  - Exemplo no meu código:

    - Comentário: para fazer transferências necessita do token que está em Bearer após pegar do login do usuário.

    ```javascript
    const params = { headers: {} };
    if (token) params.headers['Authorization'] = `Bearer ${token}`; // linha 101
    const res = http.post(`${BASE_URL}/transfers`, JSON.stringify({ from, to, value }), params);
    ```

- Data-Driven Testing
  - Localização: `test/k6/data/transfer_cases.js` carregado por `SharedArray`.
  - Exemplo no meu código:

      - Comentário: casos externos (min/max/decimals/label) fornecem entradas variadas para as transferências.
      
    ```javascript
    const transferCases = new SharedArray('transferCases', function () { // linhas 38-43
      const src = open('./data/transfer_cases.js');
      const cleaned = src.replace(/export default\\s+/, '');
      return eval(cleaned);
    });
    ```


