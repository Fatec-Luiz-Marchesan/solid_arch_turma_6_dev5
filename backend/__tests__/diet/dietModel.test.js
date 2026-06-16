const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => {
  const mongoose = require('mongoose');
  return mongoose;
});

const Diet = require('../../models/Diet');

const validData = {
  name: 'Dieta Proteica',
  type: 'high-protein',
  user: { _id: 'u1', name: 'Ana' },
};

describe('Diet Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('rejeita sem name', () => {
      const d = new Diet({ ...validData, name: undefined });
      const err = d.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
    });

    it('rejeita sem type', () => {
      const d = new Diet({ ...validData, type: undefined });
      const err = d.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('rejeita type fora do enum', () => {
      const d = new Diet({ ...validData, type: 'keto-extreme' });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('aceita dados válidos', () => {
      const d = new Diet(validData);
      const err = d.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('defaults', () => {
    it('goal tem default vazio', () => {
      const d = new Diet(validData);
      expect(d.goal).toBe('');
    });

    it('dailyCalories tem default null', () => {
      const d = new Diet(validData);
      expect(d.dailyCalories).toBeNull();
    });

    it('durationDays tem default null', () => {
      const d = new Diet(validData);
      expect(d.durationDays).toBeNull();
    });

    it('mealsPerDay tem default null', () => {
      const d = new Diet(validData);
      expect(d.mealsPerDay).toBeNull();
    });

    it('restrictions tem default vazio', () => {
      const d = new Diet(validData);
      expect(d.restrictions).toEqual([]);
    });

    it('notes tem default vazio', () => {
      const d = new Diet(validData);
      expect(d.notes).toBe('');
    });

    it('deletedAt tem default null', () => {
      const d = new Diet(validData);
      expect(d.deletedAt).toBeNull();
    });
  });

  describe('validações numéricas', () => {
    it('rejeita dailyCalories negativo', () => {
      const d = new Diet({ ...validData, dailyCalories: -1 });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('rejeita dailyCalories acima de 10000', () => {
      const d = new Diet({ ...validData, dailyCalories: 10001 });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('aceita dailyCalories válido', () => {
      const d = new Diet({ ...validData, dailyCalories: 2000 });
      const err = d.validateSync();
      expect(err).toBeUndefined();
    });

    it('rejeita durationDays 0', () => {
      const d = new Diet({ ...validData, durationDays: 0 });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('rejeita mealsPerDay 0', () => {
      const d = new Diet({ ...validData, mealsPerDay: 0 });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('rejeita mealsPerDay 13', () => {
      const d = new Diet({ ...validData, mealsPerDay: 13 });
      const err = d.validateSync();
      expect(err).toBeDefined();
    });

    it('aceita mealsPerDay válido', () => {
      const d = new Diet({ ...validData, mealsPerDay: 5 });
      const err = d.validateSync();
      expect(err).toBeUndefined();
    });
  });

  describe('trim e maxlength', () => {
    it('aplica trim no name', () => {
      const d = new Diet({ ...validData, name: '  Dieta Teste  ' });
      expect(d.name).toBe('Dieta Teste');
    });

    it('aplica trim no goal', () => {
      const d = new Diet({ ...validData, goal: '  Emagrecer  ' });
      expect(d.goal).toBe('Emagrecer');
    });

    it('aplica trim no notes', () => {
      const d = new Diet({ ...validData, notes: '  Sem açúcar  ' });
      expect(d.notes).toBe('Sem açúcar');
    });
  });
});