const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => {
  const mongoose = require('mongoose');
  return mongoose;
});

const Breed = require('../../models/Breed');

const validData = {
  name: 'Labrador',
  species: 'dog',
  user: { _id: 'u1', name: 'Ana' },
};

describe('Breed Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('aceita dados válidos', () => {
      const b = new Breed(validData);
      const err = b.validateSync();
      expect(err).toBeUndefined();
    });

    it('rejeita sem name', () => {
      const b = new Breed({ ...validData, name: undefined });
      const err = b.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
    });

    it('rejeita sem species', () => {
      const b = new Breed({ ...validData, species: undefined });
      const err = b.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.species).toBeDefined();
    });

    it('rejeita species fora do enum', () => {
      const b = new Breed({ ...validData, species: 'dragon' });
      const err = b.validateSync();
      expect(err).toBeDefined();
    });

    it('rejeita sem user', () => {
      const b = new Breed({ ...validData, user: undefined });
      const err = b.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.user).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('size default medium', () => {
      expect(new Breed(validData).size).toBe('medium');
    });

    it('description default vazio', () => {
      expect(new Breed(validData).description).toBe('');
    });

    it('temperament default vazio', () => {
      expect(new Breed(validData).temperament).toEqual([]);
    });

    it('lifeExpectancy default null', () => {
      expect(new Breed(validData).lifeExpectancy).toBeNull();
    });

    it('origin default vazio', () => {
      expect(new Breed(validData).origin).toBe('');
    });

    it('hypoallergenic default false', () => {
      expect(new Breed(validData).hypoallergenic).toBe(false);
    });

    it('deletedAt default null', () => {
      expect(new Breed(validData).deletedAt).toBeNull();
    });
  });

  describe('enum e limites', () => {
    it('rejeita size fora do enum', () => {
      const b = new Breed({ ...validData, size: 'giant' });
      const err = b.validateSync();
      expect(err).toBeDefined();
    });

    it('aceita size small', () => {
      expect(new Breed({ ...validData, size: 'small' }).validateSync()).toBeUndefined();
    });

    it('aceita size large', () => {
      expect(new Breed({ ...validData, size: 'large' }).validateSync()).toBeUndefined();
    });

    it('rejeita name muito curto', () => {
      const b = new Breed({ ...validData, name: 'A' });
      expect(b.validateSync()).toBeDefined();
    });

    it('rejeita lifeExpectancy negativo', () => {
      expect(new Breed({ ...validData, lifeExpectancy: -1 }).validateSync()).toBeDefined();
    });

    it('rejeita lifeExpectancy acima de 50', () => {
      expect(new Breed({ ...validData, lifeExpectancy: 51 }).validateSync()).toBeDefined();
    });

    it('aceita lifeExpectancy válido', () => {
      expect(new Breed({ ...validData, lifeExpectancy: 12 }).validateSync()).toBeUndefined();
    });
  });

  describe('trim', () => {
    it('aplica trim no name', () => {
      expect(new Breed({ ...validData, name: '  Labrador  ' }).name).toBe('Labrador');
    });

    it('aplica trim na description', () => {
      expect(new Breed({ ...validData, description: '  Dócil  ' }).description).toBe('Dócil');
    });

    it('aplica trim no origin', () => {
      expect(new Breed({ ...validData, origin: '  Canadá  ' }).origin).toBe('Canadá');
    });
  });

  describe('múltiplas validações', () => {
    it('lista erros quando vários campos faltam', () => {
      const b = new Breed({});
      const err = b.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.species).toBeDefined();
      expect(err.errors.user).toBeDefined();
    });
  });
});