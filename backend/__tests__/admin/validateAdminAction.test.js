const { describe, it, expect } = require('@jest/globals');
const { validateAdminAction } = require('../../helpers/validate-admin-action');

describe('validateAdminAction helper', () => {
  it('aceita ID válido no formato ObjectId', () => {
    const r = validateAdminAction({ targetId: '507f1f77bcf86cd799439011' });
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('rejeita ID ausente', () => {
    const r = validateAdminAction({});
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/id/i);
  });

  it('rejeita ID em formato inválido', () => {
    const r = validateAdminAction({ targetId: 'abc' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/inválido/i);
  });

  it('rejeita ID que não é string', () => {
    const r = validateAdminAction({ targetId: 123 });
    expect(r.isValid).toBe(false);
  });

  it('rejeita quando actorId é igual a targetId', () => {
    const r = validateAdminAction({
      targetId: '507f1f77bcf86cd799439011',
      actorId: '507f1f77bcf86cd799439011',
    });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/si mesmo/i);
  });

  it('aceita quando actorId é diferente de targetId', () => {
    const r = validateAdminAction({
      targetId: '507f1f77bcf86cd799439011',
      actorId: '507f1f77bcf86cd799439012',
    });
    expect(r.isValid).toBe(true);
  });
});