const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => require('mongoose'));

const Vaccine = require('../../models/Vaccine');

const validData = {
  name: 'Raiva',
  applicationDate: new Date('2025-01-15'),
  pet: { _id: 'p1', name: 'Rex' },
  user: { _id: 'u1', name: 'Ana' },
};

describe('Vaccine Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('aceita dados válidos', () => {
      expect(new Vaccine(validData).validateSync()).toBeUndefined();
    });

    it('rejeita sem name', () => {
      const v = new Vaccine({ ...validData, name: undefined });
      expect(v.validateSync().errors.name).toBeDefined();
    });

    it('rejeita sem applicationDate', () => {
      const v = new Vaccine({ ...validData, applicationDate: undefined });
      expect(v.validateSync().errors.applicationDate).toBeDefined();
    });

    it('rejeita sem pet', () => {
      const v = new Vaccine({ ...validData, pet: undefined });
      expect(v.validateSync().errors.pet).toBeDefined();
    });

    it('rejeita sem user', () => {
      const v = new Vaccine({ ...validData, user: undefined });
      expect(v.validateSync().errors.user).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('manufacturer default null', () => {
      expect(new Vaccine(validData).manufacturer).toBeNull();
    });

    it('batchNumber default null', () => {
      expect(new Vaccine(validData).batchNumber).toBeNull();
    });

    it('nextDueDate default null', () => {
      expect(new Vaccine(validData).nextDueDate).toBeNull();
    });

    it('dose default 1', () => {
      expect(new Vaccine(validData).dose).toBe(1);
    });

    it('status default applied', () => {
      expect(new Vaccine(validData).status).toBe('applied');
    });

    it('veterinarian default null', () => {
      expect(new Vaccine(validData).veterinarian).toBeNull();
    });

    it('notes default null', () => {
      expect(new Vaccine(validData).notes).toBeNull();
    });

    it('clinicName default null', () => {
      expect(new Vaccine(validData).clinicName).toBeNull();
    });

    it('location default null', () => {
      expect(new Vaccine(validData).location).toBeNull();
    });

    it('expirationDate default null', () => {
      expect(new Vaccine(validData).expirationDate).toBeNull();
    });

    it('serialNumber default null', () => {
      expect(new Vaccine(validData).serialNumber).toBeNull();
    });

    it('deletedAt default null', () => {
      expect(new Vaccine(validData).deletedAt).toBeNull();
    });
  });

  describe('enum e limites', () => {
    it('rejeita status fora do enum', () => {
      const v = new Vaccine({ ...validData, status: 'expired' });
      expect(v.validateSync()).toBeDefined();
    });

    it('aceita status scheduled', () => {
      expect(new Vaccine({ ...validData, status: 'scheduled' }).validateSync()).toBeUndefined();
    });

    it('aceita status overdue', () => {
      expect(new Vaccine({ ...validData, status: 'overdue' }).validateSync()).toBeUndefined();
    });

    it('rejeita dose menor que 1', () => {
      expect(new Vaccine({ ...validData, dose: 0 }).validateSync()).toBeDefined();
    });

    it('rejeita dose maior que 20', () => {
      expect(new Vaccine({ ...validData, dose: 21 }).validateSync()).toBeDefined();
    });

    it('aceita dose válida', () => {
      expect(new Vaccine({ ...validData, dose: 3 }).validateSync()).toBeUndefined();
    });
  });

  describe('trim', () => {
    it('aplica trim no name', () => {
      expect(new Vaccine({ ...validData, name: '  Raiva  ' }).name).toBe('Raiva');
    });

    it('aplica trim no manufacturer', () => {
      expect(new Vaccine({ ...validData, manufacturer: '  Pfizer  ' }).manufacturer).toBe('Pfizer');
    });

    it('aplica trim no veterinarian', () => {
      expect(new Vaccine({ ...validData, veterinarian: '  Dr. Silva  ' }).veterinarian).toBe('Dr. Silva');
    });

    it('aplica trim no clinicName', () => {
      expect(new Vaccine({ ...validData, clinicName: '  PetClin  ' }).clinicName).toBe('PetClin');
    });
  });

  describe('múltiplas validações', () => {
    it('lista erros quando vários campos faltam', () => {
      const v = new Vaccine({});
      const err = v.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.applicationDate).toBeDefined();
      expect(err.errors.pet).toBeDefined();
      expect(err.errors.user).toBeDefined();
    });
  });
});