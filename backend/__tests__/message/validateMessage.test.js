const { describe, it, expect } = require('@jest/globals');
const { validateMessage } = require('../../helpers/validate-message');

const validData = {
  content: 'Olá, tudo bem?',
  receiverId: '507f1f77bcf86cd799439011',
  petId: '507f1f77bcf86cd799439012',
};

describe('validateMessage helper', () => {
  it('aceita mensagem válida', () => {
    const r = validateMessage(validData);
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejeita content ausente', () => {
    const r = validateMessage({ ...validData, content: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/obrigatório/);
  });

  it('rejeita content que não é string', () => {
    const r = validateMessage({ ...validData, content: 123 });
    expect(r.isValid).toBe(false);
  });

  it('rejeita content vazio após trim', () => {
    const r = validateMessage({ ...validData, content: '   ' });
    expect(r.isValid).toBe(false);
  });

  it('rejeita content muito longo', () => {
    const r = validateMessage({ ...validData, content: 'a'.repeat(1001) });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/1000/);
  });

  it('rejeita sem receiverId', () => {
    const r = validateMessage({ ...validData, receiverId: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/destinatário/i);
  });

  it('rejeita receiverId em formato inválido', () => {
    const r = validateMessage({ ...validData, receiverId: 'abc' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/inválido/i);
  });

  it('rejeita sem petId', () => {
    const r = validateMessage({ ...validData, petId: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/pet/i);
  });

  it('rejeita petId em formato inválido', () => {
    const r = validateMessage({ ...validData, petId: 'xyz' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/inválido/i);
  });
});