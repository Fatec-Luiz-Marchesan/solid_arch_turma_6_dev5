const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => {
  const mongoose = require('mongoose');
  return mongoose;
});

const Location = require('../../models/Location');

const validData = {
  name: 'Casa',
  street: 'Rua das Flores',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  user: { _id: 'u1', name: 'Usuário' },
};

describe('Location Model — novos campos', () => {
  describe('complement', () => {
    it('aceita complement válido', () => {
      const l = new Location({ ...validData, complement: 'Apto 42' });
      expect(l.validateSync()).toBeUndefined();
      expect(l.complement).toBe('Apto 42');
    });

    it('complement tem default vazio', () => {
      const l = new Location(validData);
      expect(l.complement).toBe('');
    });

    it('aplica trim no complement', () => {
      const l = new Location({ ...validData, complement: '  Bloco B  ' });
      expect(l.complement).toBe('Bloco B');
    });

    it('rejeita complement acima de 100 caracteres', () => {
      const l = new Location({ ...validData, complement: 'x'.repeat(101) });
      const err = l.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.complement).toBeDefined();
    });

    it('aceita complement nulo ou vazio', () => {
      const l = new Location({ ...validData, complement: '' });
      expect(l.validateSync()).toBeUndefined();
    });
  });

  describe('phone', () => {
    it('aceita phone válido', () => {
      const l = new Location({ ...validData, phone: '(11) 99999-9999' });
      expect(l.validateSync()).toBeUndefined();
      expect(l.phone).toBe('(11) 99999-9999');
    });

    it('phone tem default vazio', () => {
      const l = new Location(validData);
      expect(l.phone).toBe('');
    });

    it('aplica trim no phone', () => {
      const l = new Location({ ...validData, phone: '  (11) 99999-9999  ' });
      expect(l.phone).toBe('(11) 99999-9999');
    });
  });

  describe('reference', () => {
    it('aceita reference válido', () => {
      const l = new Location({ ...validData, reference: 'Próximo ao metrô' });
      expect(l.validateSync()).toBeUndefined();
      expect(l.reference).toBe('Próximo ao metrô');
    });

    it('reference tem default vazio', () => {
      const l = new Location(validData);
      expect(l.reference).toBe('');
    });

    it('aplica trim no reference', () => {
      const l = new Location({ ...validData, reference: '  Em frente ao parque  ' });
      expect(l.reference).toBe('Em frente ao parque');
    });

    it('rejeita reference acima de 200 caracteres', () => {
      const l = new Location({ ...validData, reference: 'x'.repeat(201) });
      const err = l.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.reference).toBeDefined();
    });
  });

  describe('campos existentes permanecem funcionando', () => {
    it('aceita localização completa com todos os novos campos', () => {
      const l = new Location({
        ...validData,
        complement: 'Apto 42',
        phone: '(11) 98765-4321',
        reference: 'Ao lado da farmácia',
        latitude: -23.55,
        longitude: -46.63,
        isPrimary: true,
      });
      expect(l.validateSync()).toBeUndefined();
    });

    it('rejeita sem name', () => {
      const l = new Location({ ...validData, name: undefined });
      expect(l.validateSync()).toBeDefined();
    });

    it('rejeita sem street', () => {
      const l = new Location({ ...validData, street: undefined });
      expect(l.validateSync()).toBeDefined();
    });

    it('rejeita state inválido', () => {
      const l = new Location({ ...validData, state: 'São Paulo' });
      expect(l.validateSync()).toBeDefined();
    });

    it('rejeita zipCode inválido', () => {
      const l = new Location({ ...validData, zipCode: '123' });
      expect(l.validateSync()).toBeDefined();
    });

    it('country tem default Brasil', () => {
      const l = new Location(validData);
      expect(l.country).toBe('Brasil');
    });

    it('isPrimary tem default false', () => {
      const l = new Location(validData);
      expect(l.isPrimary).toBe(false);
    });
  });
});
