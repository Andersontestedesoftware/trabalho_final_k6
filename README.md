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

## COMO EXECUTAR MEUS TESTES
Observação: após clonar o repositório, instale as dependências antes de iniciar o servidor. Recomenda-se Node 16+ (ou 18+). Em um ambiente de desenvolvimento local execute `npm install`.

Exemplo (PowerShell):
```powershell
npm install
```

Em seguida, inicie o servidor:
```powershell
node server.js
```

Abaixo estão os comandos usados para executar o script k6 localizado em `test/k6/trabalho_final_k6.js`.

- Teste sem report (executa localmente, imprime resultados no terminal):

```powershell
k6 run --env base_url='http://localhost:3000' test/k6/trabalho_final_k6.js
```

- Teste com report (exporta o dashboard k6 para `dashboard.html`; PowerShell):

```powershell
$env:K6_WEB_DASHBOARD='true'; $env:K6_WEB_DASHBOARD_EXPORT='dashboard.html'; k6 run --env base_url='http://localhost:3000' test/k6/trabalho_final_k6.js
```

## Comentários do aluno sobre o teste k6

O código abaixo está armazenado no arquivo `test/k6/trabalho_final_k6.js` e demonstra alguns conceitos importantes de teste de carga com k6.

- Groups
  - Exemplo no meu código:

    - Comentário: uso do `group()` para agrupar passos lógicos do teste (registro, login, transferência); grupos aparecem nos relatórios do k6 e ajudam a segmentar métricas e checks.

    ```javascript
    group('login do remetente', function () { // linhas 76-80
      const result = login(email, password); // linhas 76-78
      const token = result && result.token; // linhas 76-78
    });
    ```


- Thresholds
  - Localização: `export const options.thresholds` em `test/k6/trabalho_final_k6.js`.
  - Exemplo no meu código:

    - Comentário: thresholds é como se colocasse um limite de performance, ou seja, o teste só passa se esses números de desempenho forem respeitados.

    ```javascript
    http_req_duration: ['p(90)<=1200', 'p(95)<=1500'], // linhas 17-22
    http_req_failed: ['rate<0.01'] // linhas 17-22
    ```


- Checks
  - Localização: uso de `runCheck(res, 'mensagem', expectedStatus)` em `helpers/apiHelpers.js` e chamadas no script principal.
  - Exemplo no meu código:

  - Comentário: Validações via `runCheck`: helper que encapsula o `check()` do k6, valida os dados para saber se está chegando a informação esperada.

    ```javascript
    const res = registerUser(generatedFrom, generatedFromPassword); // linha 59
    runCheck(res, 'registro remetente status 201', 201); // linha 59
    ```
 

- Helpers
  - Localização: `test/k6/helpers/*` — por exemplo `apiHelpers.js`, `faker.js`, `BASE_URL.js`.
  - Exemplo no meu código:
 
    - Comentário: encapsulam chamadas API (register/login) e execução de checks para manter o script legível, reduzir duplicação e facilitar manutenção.

    ```javascript
    import { registerUser, login, runCheck } from './helpers/apiHelpers.js'; // linhas 1-7
    ```
 
- Trends
  - Localização: `test/k6/trabalho_final_k6.js` — definição `const transferDuration = new Trend('transfer_duration_ms')` (linha 15) e uso no bloco de transferência (linha 105).
  - Exemplo no meu código:

    - Comentário: métricas customizadas (Trend) para analisar distribuição de latências específicas em ms — aqui usamos `transfer_duration_ms` para medir apenas o tempo das transferências, ou seja, metrica de um endpoint específico.

    ```javascript
    if (res && res.timings && typeof res.timings.duration === 'number') {
      transferDuration.add(res.timings.duration); // linha 105
    }
    ```

- Faker
  - Localização: `test/k6/helpers/faker.js` e import `generateUsername`, `generatePassword`, `generateAmount`.
  - Exemplo no meu código:

    - Comentário: gera dados realistas e únicos por VU/iteração (usernames, senhas, valores). Alem disso, dentro da função generateUsername(), eu uso o faker e em caso de falha ele executa um codigo para gerar os dados como se fosse um fluxo alternativo.

    ```javascript
    const generatedFrom = `from_${generateUsername()}_${Math.floor(Math.random() * 10000)}`; // linhas 50-53
    ```

- Variável de Ambiente
  - Localização: `test/k6/helpers/BASE_URL.js` — `export const BASE_URL = __ENV.base_url || 'http://localhost:3000'` (linha 2); o script usa `--env base_url="http://localhost:3000"`.
  - Exemplo no meu código:

    - Comentário: centraliza a URL base em um helper (`test/k6/helpers/BASE_URL.js`) que lê `__ENV.base_url`, permitindo alternar ambientes via `--env` sem tocar o script.

    ```javascript
    import { BASE_URL } from './helpers/BASE_URL.js'; // import no topo do script
    const res = http.get(`${BASE_URL}/users`); // uso simples do BASE_URL
    ```


- Stages
  - Localização: `test/k6/trabalho_final_k6.js` — `export const options.stages` (linhas 25-30).
  - Exemplo no meu código:

    - Comentário: Os Stages definem etapas de carga (ramp-up, pico e ramp-down) para simular aumento gradual de usuários, períodos de tráfego alto e depois redução. Isso permite avaliar como o sistema se comporta em diferentes níveis de carga.

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

    - Comentário: captura o token retornado pelo login e o reutiliza em requisições subsequentes (Authorization Bearer), simulando o fluxo real do usuário: registrar -> login -> ação autenticada.

    ```javascript
    const result = login(generatedFrom, generatedFromPassword); // linhas 76-78
    token = result && result.token; // linhas 76-78
    if (token) params.headers['Authorization'] = `Bearer ${token}`; // linha 101
    ```

- Uso de Token de Autenticação
  - Localização: `test/k6/trabalho_final_k6.js` — montagem do header `Authorization` para chamadas a `/transfers` (linha 101).
  - Exemplo no meu código:

    - Comentário: o header `Authorization: Bearer <token>` é montado a partir do token do login e enviado nas requisições a `/transfers` para autorizar a operação.

    ```javascript
    const params = { headers: {} };
    if (token) params.headers['Authorization'] = `Bearer ${token}`; // linha 101
    const res = http.post(`${BASE_URL}/transfers`, JSON.stringify({ from, to, value }), params);
    ```

- Data-Driven Testing
  - Localização: `test/k6/data/transfer_cases.js` carregado por `SharedArray`.
  - Exemplo no meu código:

      - Comentário: casos externos descrevem valores (min/max/decimals/label) usados para gerar inputs variados; carregamos esses casos via `SharedArray` (open + eval) — observe o uso de eval e o trade-off entre flexibilidade (JS com comentários) e segurança.
      
    ```javascript
    const transferCases = new SharedArray('transferCases', function () { // linhas 38-43
      const src = open('./data/transfer_cases.js');
      const cleaned = src.replace(/export default\\s+/, '');
      return eval(cleaned);
    });
    ```


