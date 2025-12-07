// Exporta a URL base usada nos scripts k6. Permite sobrescrever via variável de ambiente `base_url`.
export const BASE_URL = __ENV.base_url || 'http://localhost:3000';
