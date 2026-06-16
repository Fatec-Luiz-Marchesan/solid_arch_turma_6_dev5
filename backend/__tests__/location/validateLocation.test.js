const { describe, it, expect } = require('@jest/globals');
const { validateLocation } = require('../../helpers/validate-location');

const validData = {
  name: 'Casa',
  street: 'Rua das Flores',
  number: '123',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  country: 'Brasil',
};

describe('validateLocation helper', () => {
  it('aceita localização válida', () => {
    const r = validateLocation(validData);
    expect(r.isValid).toBe(true);
    expect(r.errors).toEqual([]);
  });

  it('aceita zipCode sem hífen', () => {
    const r = validateLocation({ ...validData, zipCode: '01310100' });
    expect(r.isValid).toBe(true);
  });

  it('rejeita name ausente', () => {
    const r = validateLocation({ ...validData, name: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/nome/i);
  });

  it('rejeita street ausente', () => {
    const r = validateLocation({ ...validData, street: undefined });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/rua/i);
  });

  it('rejeita city ausente', () => {
    const r = validateLocation({ ...validData, city: undefined });
    expect(r.isValid).toBe(false);
  });

  it('rejeita state em formato inválido', () => {
    const r = validateLocation({ ...validData, state: 'São Paulo' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/estado/i);
  });

  it('rejeita zipCode em formato inválido', () => {
    const r = validateLocation({ ...validData, zipCode: '123' });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/cep/i);
  });

  it('rejeita latitude fora do range', () => {
    const r = validateLocation({ ...validData, latitude: 100 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/latitude/i);
  });

  it('rejeita longitude fora do range', () => {
    const r = validateLocation({ ...validData, longitude: 200 });
    expect(r.isValid).toBe(false);
    expect(r.errors[0]).toMatch(/longitude/i);
  });

  it('aceita coordenadas válidas', () => {
    const r = validateLocation({
      ...validData,
      latitude: -23.5505,
      longitude: -46.6333,
    });
    expect(r.isValid).toBe(true);
  });

  it('rejeita name acima de 100 caracteres', () => {
    const r = validateLocation({ ...validData, name: 'x'.repeat(101) });
    expect(r.isValid).toBe(false);
  });
});

describe('validateLocation — novos campos', () => {
  const validData = {
    name: 'Casa',
    street: 'Rua das Flores',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  };

  describe('complement', () => {
    it('aceita complement válido', () => {
      expect(validateLocation({ ...validData, complement: 'Apto 42' }).isValid).toBe(true);
    });

    it('aceita complement vazio', () => {
      expect(validateLocation({ ...validData, complement: '' }).isValid).toBe(true);
    });

    it('aceita sem complement', () => {
      expect(validateLocation(validData).isValid).toBe(true);
    });

    it('rejeita complement acima de 100 caracteres', () => {
      const r = validateLocation({ ...validData, complement: 'x'.repeat(101) });
      expect(r.isValid).toBe(false);
      expect(r.errors[0]).toMatch(/complemento/i);
    });

    it('rejeita complement não-string', () => {
      const r = validateLocation({ ...validData, complement: 123 });
      expect(r.isValid).toBe(false);
    });
  });

  describe('phone', () => {
    it('aceita telefone no formato (11) 99999-9999', () => {
      expect(validateLocation({ ...validData, phone: '(11) 99999-9999' }).isValid).toBe(true);
    });

    it('aceita telefone no formato 11999999999', () => {
      expect(validateLocation({ ...validData, phone: '11999999999' }).isValid).toBe(true);
    });

    it('aceita phone vazio', () => {
      expect(validateLocation({ ...validData, phone: '' }).isValid).toBe(true);
    });

    it('aceita sem phone', () => {
      expect(validateLocation(validData).isValid).toBe(true);
    });

    it('rejeita phone em formato inválido', () => {
      const r = validateLocation({ ...validData, phone: 'abc-def' });
      expect(r.isValid).toBe(false);
      expect(r.errors[0]).toMatch(/telefone/i);
    });

    it('rejeita phone não-string', () => {
      const r = validateLocation({ ...validData, phone: 11999999999 });
      expect(r.isValid).toBe(false);
    });
  });

  describe('reference', () => {
    it('aceita reference válido', () => {
      expect(validateLocation({ ...validData, reference: 'Próximo ao metrô' }).isValid).toBe(true);
    });

    it('aceita reference vazio', () => {
      expect(validateLocation({ ...validData, reference: '' }).isValid).toBe(true);
    });

    it('aceita sem reference', () => {
      expect(validateLocation(validData).isValid).toBe(true);
    });

    it('rejeita reference acima de 200 caracteres', () => {
      const r = validateLocation({ ...validData, reference: 'x'.repeat(201) });
      expect(r.isValid).toBe(false);
      expect(r.errors[0]).toMatch(/refer/i);
    });

    it('rejeita reference não-string', () => {
      const r = validateLocation({ ...validData, reference: 42 });
      expect(r.isValid).toBe(false);
    });
  });

  describe('localização completa com todos os campos', () => {
    it('aceita localização completa válida', () => {
      const r = validateLocation({
        ...validData,
        number: '123',
        complement: 'Apto 42',
        country: 'Brasil',
        phone: '(11) 98765-4321',
        reference: 'Próximo ao parque',
        latitude: -23.55,
        longitude: -46.63,
      });
      expect(r.isValid).toBe(true);
    });
  });
});