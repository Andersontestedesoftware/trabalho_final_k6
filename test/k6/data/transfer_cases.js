// Lista de casos de teste para Data-Driven Testing
// Cada objeto descreve uma faixa de valores e metadados usados pelo script k6.
// Comentários linha-a-linha abaixo explicam cada campo.

export default [
  // Caso 1 — small
  // "min": valor mínimo (inclusive) para gerar o montante
  // "max": valor máximo (inclusive) para gerar o montante
  // "decimals": número de casas decimais (ex.: 2 -> 12.34)
  // "label": rótulo curto usado em logs/relatórios
  // "description": explicação do propósito do caso
  // "expectedStatus": status HTTP esperado ao enviar a transferência (opcional)
  {
    min: 1,
    max: 10,
    decimals: 2,
    label: 'small',
    description: 'Valores pequenos usados para testar transferências de baixo valor (ex.: micro-transações).',
    expectedStatus: 201
  },

  // Caso 2 — medium
  // faixa típica para transferências do dia a dia
  {
    min: 10,
    max: 50,
    decimals: 2,
    label: 'medium',
    description: 'Valores médios para simular transferências típicas entre usuários comuns.',
    expectedStatus: 201
  },

  // Caso 3 — large
  // valores maiores para testar limites e impacto sobre performance/validação
  {
    min: 50,
    max: 100,
    decimals: 2,
    label: 'large',
    description: 'Valores altos para testar limites e desempenho com valores maiores.',
    expectedStatus: 201
  },

  // Caso 4 — random (faixa mista)
  // usado para variar os testes e cobrir casos intermediários
  {
    min: 5,
    max: 20,
    decimals: 2,
    label: 'random',
    description: 'Caso extra com faixa mista para variar e cobrir valores intermediários.',
    expectedStatus: 201
  }
];
