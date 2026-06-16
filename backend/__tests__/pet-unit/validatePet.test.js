const { describe, it, expect } = require('@jest/globals');
const { validatePet } = require('../../helpers/validate-pet');

describe('validatePet', () => {
  const valid = { name: 'Rex', age: 3, weight: 12, color: 'Marrom' };

  it('aceita dados válidos', () => {
    expect(validatePet(valid).isValid).toBe(true);
  });

  it('aceita com species válido', () => {
    expect(validatePet({ ...valid, species: 'dog' }).isValid).toBe(true);
  });

  it('aceita sem species (opcional)', () => {
    expect(validatePet(valid).isValid).toBe(true);
  });

  it('rejeita species inválido', () => {
    const r = validatePet({ ...valid, species: 'dragon' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/espécie/i);
  });

  it('rejeita sem nome', () => {
    expect(validatePet({ ...valid, name: '' }).isValid).toBe(false);
  });

  it('rejeita nome muito curto', () => {
    expect(validatePet({ ...valid, name: 'A' }).isValid).toBe(false);
  });

  it('rejeita nome muito longo', () => {
    expect(validatePet({ ...valid, name: 'a'.repeat(51) }).isValid).toBe(false);
  });

  it('rejeita sem idade', () => {
    expect(validatePet({ ...valid, age: '' }).isValid).toBe(false);
  });

  it('rejeita idade negativa', () => {
    expect(validatePet({ ...valid, age: -1 }).isValid).toBe(false);
  });

  it('rejeita idade acima de 50', () => {
    expect(validatePet({ ...valid, age: 51 }).isValid).toBe(false);
  });

  it('rejeita sem peso', () => {
    expect(validatePet({ ...valid, weight: '' }).isValid).toBe(false);
  });

  it('rejeita peso zero', () => {
    expect(validatePet({ ...valid, weight: 0 }).isValid).toBe(false);
  });

  it('rejeita peso acima de 200', () => {
    expect(validatePet({ ...valid, weight: 201 }).isValid).toBe(false);
  });

  it('rejeita sem cor', () => {
    expect(validatePet({ ...valid, color: '' }).isValid).toBe(false);
  });

  it('rejeita dados nulos', () => {
    expect(validatePet(null).isValid).toBe(false);
  });
});