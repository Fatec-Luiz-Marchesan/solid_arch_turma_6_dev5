const { describe, it, expect } = require('@jest/globals');
const { validateMessageUpdate } = require('../../helpers/validate-message-update');

describe('validateMessageUpdate helper', () => {
  it('aceita content válido', () => {
    const r = validateMessageUpdate({ content: 'Mensagem editada' });
    expect(r.isValid).toBe(true);
  });

  it('rejeita content ausente', () => {
    const r = validateMessageUpdate({});
    expect(r.isValid).toBe(false);
  });

  it('rejeita content vazio após trim', () => {
    const r = validateMessageUpdate({ content: '   ' });
    expect(r.isValid).toBe(false);
  });

  it('rejeita content muito longo', () => {
    const r = validateMessageUpdate({ content: 'a'.repeat(1001) });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/1000/);
  });

  it('rejeita content que não é string', () => {
    const r = validateMessageUpdate({ content: 123 });
    expect(r.isValid).toBe(false);
  });
});