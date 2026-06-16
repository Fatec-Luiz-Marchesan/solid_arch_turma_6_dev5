const ALLOWED_SPECIES = ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'];
const NAME_MIN = 2;
const NAME_MAX = 50;
const AGE_MIN = 0;
const AGE_MAX = 50;
const WEIGHT_MIN = 0.01;
const WEIGHT_MAX = 200;

function validatePet(data) {
  const errors = [];
  const d = data || {};

  if (!d.name || typeof d.name !== 'string' || d.name.trim().length === 0) {
    errors.push('O nome é obrigatório!');
  } else if (d.name.trim().length < NAME_MIN) {
    errors.push(`O nome deve ter pelo menos ${NAME_MIN} caracteres!`);
  } else if (d.name.trim().length > NAME_MAX) {
    errors.push(`O nome não pode passar de ${NAME_MAX} caracteres!`);
  }

  if (d.age === undefined || d.age === null || d.age === '') {
    errors.push('A idade é obrigatória!');
  } else {
    const age = Number(d.age);
    if (isNaN(age)) {
      errors.push('A idade deve ser um número!');
    } else if (age < AGE_MIN || age > AGE_MAX) {
      errors.push(`A idade deve estar entre ${AGE_MIN} e ${AGE_MAX}!`);
    }
  }

  if (d.weight === undefined || d.weight === null || d.weight === '') {
    errors.push('O peso é obrigatório!');
  } else {
    const w = Number(d.weight);
    if (isNaN(w)) {
      errors.push('O peso deve ser um número!');
    } else if (w < WEIGHT_MIN || w > WEIGHT_MAX) {
      errors.push(`O peso deve estar entre ${WEIGHT_MIN} e ${WEIGHT_MAX} kg!`);
    }
  }

  if (!d.color || typeof d.color !== 'string' || d.color.trim().length === 0) {
    errors.push('A cor é obrigatória!');
  }

  if (d.species !== undefined && d.species !== null && d.species !== '') {
    if (!ALLOWED_SPECIES.includes(d.species)) {
      errors.push('Espécie inválida!');
    }
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = {
  validatePet,
  ALLOWED_SPECIES,
  NAME_MIN,
  NAME_MAX,
  AGE_MIN,
  AGE_MAX,
  WEIGHT_MIN,
  WEIGHT_MAX,
};