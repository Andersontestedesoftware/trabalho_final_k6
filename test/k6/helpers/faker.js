import faker from 'k6/x/faker';


export function generateUsername() {
  try {
    if (faker && faker.person && typeof faker.person.firstName === 'function') {
      const f = faker.person.firstName();
      const l = typeof faker.person.lastName === 'function' ? faker.person.lastName() : '';
      return `${f}${l}`.replace(/\s+/g, '').toLowerCase();
    }
  } catch (e) {
    // ignore and fallback
  }
  // final fallback
  return Math.random().toString(36).slice(2, 10);
}

export function generatePassword() {
  try {
    if (faker && faker.internet && typeof faker.internet.password === 'function') {
      return faker.internet.password();
    }
    if (faker && faker.strings && typeof faker.strings.random === 'function') {
      return faker.strings.random(12);
    }
  } catch (e) {}
  return Math.random().toString(36).slice(2, 12);
}

export function generateAmount(min = 1, max = 100, decimals = 2) {
  try {
    if (faker && faker.finance && typeof faker.finance.amount === 'function') {
      return parseFloat(faker.finance.amount(min, max, decimals));
    }
  } catch (e) {}
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

export default { generateUsername, generatePassword, generateAmount };