const { describe, it, expect } = require('@jest/globals');
const { validateReview } = require('../../helpers/validate-review');

const validData = {
  rating: 5,
  comment: 'Adoção tranquila, doador muito atencioso.',
  petId: '507f1f77bcf86cd799439011',
};

describe('validateReview helper', () => {
  it('aceita review válida', () => {
    const r = validateReview(validData);
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejeita rating ausente', () => {
    const r = validateReview({ ...validData, rating: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/avaliação/i);
  });

  it('rejeita rating menor que 1', () => {
    const r = validateReview({ ...validData, rating: 0 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/1.*5/);
  });

  it('rejeita rating maior que 5', () => {
    const r = validateReview({ ...validData, rating: 6 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/1.*5/);
  });

  it('rejeita rating não inteiro', () => {
    const r = validateReview({ ...validData, rating: 3.5 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/inteiro/i);
  });

  it('rejeita rating que não é número', () => {
    const r = validateReview({ ...validData, rating: 'cinco' });
    expect(r.isValid).toBe(false);
  });

  it('rejeita comment ausente', () => {
    const r = validateReview({ ...validData, comment: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/comentário/i);
  });

  it('rejeita comment muito curto', () => {
    const r = validateReview({ ...validData, comment: 'curto' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/10/);
  });

  it('rejeita comment muito longo', () => {
    const r = validateReview({ ...validData, comment: 'a'.repeat(1001) });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/1000/);
  });

  it('rejeita petId ausente', () => {
    const r = validateReview({ ...validData, petId: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/pet/i);
  });

  it('rejeita petId em formato inválido', () => {
    const r = validateReview({ ...validData, petId: 'abc' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/inválido/i);
  });
});