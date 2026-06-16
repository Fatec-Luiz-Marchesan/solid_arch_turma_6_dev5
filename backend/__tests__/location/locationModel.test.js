const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => require('mongoose'));

const Location = require('../../models/Location');

const validData = {
  name: 'Casa',
  street: 'Rua das Flores',
  number: '123',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  user: { _id: 'u1', name: 'Ana' },
};

describe('Location Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('aceita dados válidos', () => {
      expect(new Location(validData).validateSync()).toBeUndefined();
    });

    it('rejeita sem name', () => {
      const l = new Location({ ...validData, name: undefined });
      expect(l.validateSync().errors.name).toBeDefined();
    });

    it('rejeita sem street', () => {
      const l = new Location({ ...validData, street: undefined });
      expect(l.validateSync().errors.street).toBeDefined();
    });

    it('rejeita sem city', () => {
      const l = new Location({ ...validData, city: undefined });
      expect(l.validateSync().errors.city).toBeDefined();
    });

    it('rejeita sem state', () => {
      const l = new Location({ ...validData, state: undefined });
      expect(l.validateSync().errors.state).toBeDefined();
    });

    it('rejeita state fora do formato', () => {
      const l = new Location({ ...validData, state: 'São Paulo' });
      expect(l.validateSync()).toBeDefined();
    });

    it('aceita state válido (2 letras maiúsculas)', () => {
      expect(new Location({ ...validData, state: 'RJ' }).validateSync()).toBeUndefined();
    });

    it('rejeita sem zipCode', () => {
      const l = new Location({ ...validData, zipCode: undefined });
      expect(l.validateSync().errors.zipCode).toBeDefined();
    });

    it('rejeita zipCode fora do formato', () => {
      expect(new Location({ ...validData, zipCode: '123' }).validateSync()).toBeDefined();
    });

    it('aceita zipCode sem hífen', () => {
      expect(new Location({ ...validData, zipCode: '01234567' }).validateSync()).toBeUndefined();
    });

    it('rejeita sem user', () => {
      const l = new Location({ ...validData, user: undefined });
      expect(l.validateSync().errors.user).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('country default Brasil', () => {
      expect(new Location(validData).country).toBe('Brasil');
    });

    it('isPrimary default false', () => {
      expect(new Location(validData).isPrimary).toBe(false);
    });
  });

  describe('coordenadas', () => {
    it('aceita latitude válida', () => {
      expect(new Location({ ...validData, latitude: -23.5 }).validateSync()).toBeUndefined();
    });

    it('rejeita latitude abaixo de -90', () => {
      expect(new Location({ ...validData, latitude: -91 }).validateSync()).toBeDefined();
    });

    it('rejeita latitude acima de 90', () => {
      expect(new Location({ ...validData, latitude: 91 }).validateSync()).toBeDefined();
    });

    it('aceita longitude válida', () => {
      expect(new Location({ ...validData, longitude: -46.6 }).validateSync()).toBeUndefined();
    });

    it('rejeita longitude abaixo de -180', () => {
      expect(new Location({ ...validData, longitude: -181 }).validateSync()).toBeDefined();
    });

    it('rejeita longitude acima de 180', () => {
      expect(new Location({ ...validData, longitude: 181 }).validateSync()).toBeDefined();
    });
  });

  describe('trim', () => {
    it('aplica trim no name', () => {
      expect(new Location({ ...validData, name: '  Casa  ' }).name).toBe('Casa');
    });

    it('aplica trim na street', () => {
      expect(new Location({ ...validData, street: '  Rua A  ' }).street).toBe('Rua A');
    });

    it('aplica trim na city', () => {
      expect(new Location({ ...validData, city: '  SP  ' }).city).toBe('SP');
    });

    it('aplica trim no country', () => {
      expect(new Location({ ...validData, country: '  Brasil  ' }).country).toBe('Brasil');
    });
  });

  describe('múltiplas validações', () => {
    it('lista erros quando vários campos faltam', () => {
      const err = new Location({}).validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.street).toBeDefined();
      expect(err.errors.city).toBeDefined();
      expect(err.errors.state).toBeDefined();
      expect(err.errors.zipCode).toBeDefined();
      expect(err.errors.user).toBeDefined();
    });
  });
});