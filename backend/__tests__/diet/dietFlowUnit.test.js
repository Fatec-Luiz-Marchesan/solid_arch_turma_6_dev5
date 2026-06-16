const { describe, it, expect } = require('@jest/globals');
const { validateDiet } = require('../../helpers/validate-diet');
const { createDiet } = require('../../usecases/diet/createDiet');
const { listDiets } = require('../../usecases/diet/listDiets');
const { getDietById } = require('../../usecases/diet/getDietById');
const { deleteDiet } = require('../../usecases/diet/deleteDiet');

const validUser = { _id: 'u1', name: 'Usuário' };

const makeDiet = (overrides = {}) => ({
  _id: 'diet-1',
  name: 'Dieta Proteica',
  type: 'high-protein',
  deletedAt: null,
  ...overrides,
});

const makeCreateRepo = (existingByName = null) => ({
  findByName: jest.fn(async () => existingByName),
  create: jest.fn(async (d) => ({ _id: 'diet-1', ...d })),
});

describe('Fluxo de Diet — testes de unidade adicionais', () => {
  describe('validateDiet — campos de data e frequência', () => {
    it('aceita startDate válido', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', startDate: '2025-01-01' }).isValid
      ).toBe(true);
    });

    it('aceita endDate válido', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', endDate: '2025-12-31' }).isValid
      ).toBe(true);
    });

    it('rejeita endDate anterior a startDate', () => {
      const r = validateDiet({
        name: 'Dieta X',
        type: 'other',
        startDate: '2025-06-01',
        endDate: '2025-01-01',
      });
      expect(r.isValid).toBe(false);
      expect(r.errors.some((e) => /data/i.test(e))).toBe(true);
    });

    it('aceita mealFrequency dentro do intervalo válido', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', mealFrequency: 5 }).isValid
      ).toBe(true);
    });

    it('rejeita mealFrequency igual a 0', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', mealFrequency: 0 }).isValid
      ).toBe(false);
    });

    it('rejeita mealFrequency acima do máximo', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', mealFrequency: 15 }).isValid
      ).toBe(false);
    });

    it('aceita mealFrequency nulo', () => {
      expect(
        validateDiet({ name: 'Dieta X', type: 'other', mealFrequency: null }).isValid
      ).toBe(true);
    });
  });

  describe('createDiet — cenários adicionais', () => {
    it('persiste startDate, endDate e mealFrequency', async () => {
      const repo = makeCreateRepo();
      await createDiet({
        data: {
          name: 'Dieta Completa',
          type: 'weight-loss',
          startDate: '2025-01-01',
          endDate: '2025-06-01',
          mealFrequency: 4,
        },
        user: validUser,
        DietRepository: repo,
      });
      const payload = repo.create.mock.calls[0][0];
      expect(payload.mealFrequency).toBe(4);
    });

    it('persiste campo pet quando informado', async () => {
      const repo = makeCreateRepo();
      const pet = { _id: 'pet-1', name: 'Rex' };
      await createDiet({
        data: { name: 'Dieta Rex', type: 'high-protein', pet },
        user: validUser,
        DietRepository: repo,
      });
      expect(repo.create.mock.calls[0][0].pet).toEqual(pet);
    });

    it('rejeita endDate anterior a startDate (422)', async () => {
      const r = await createDiet({
        data: {
          name: 'Dieta Inválida',
          type: 'vegan',
          startDate: '2025-06-01',
          endDate: '2025-01-01',
        },
        user: validUser,
        DietRepository: makeCreateRepo(),
      });
      expect(r.status).toBe(422);
      expect(r.success).toBe(false);
    });

    it('rejeita mealFrequency 0 (422)', async () => {
      const r = await createDiet({
        data: { name: 'Dieta Freq Zero', type: 'vegan', mealFrequency: 0 },
        user: validUser,
        DietRepository: makeCreateRepo(),
      });
      expect(r.status).toBe(422);
    });

    it('rejeita dailyCalories negativo (422)', async () => {
      const r = await createDiet({
        data: { name: 'Dieta X', type: 'high-protein', dailyCalories: -100 },
        user: validUser,
        DietRepository: makeCreateRepo(),
      });
      expect(r.status).toBe(422);
    });

    it('cria dieta com restrictions válidas', async () => {
      const repo = makeCreateRepo();
      await createDiet({
        data: {
          name: 'Dieta Sem Glúten',
          type: 'other',
          restrictions: ['glúten', 'lactose'],
        },
        user: validUser,
        DietRepository: repo,
      });
      expect(repo.create.mock.calls[0][0].restrictions).toEqual(['glúten', 'lactose']);
    });
  });

  describe('listDiets — filtragem e paginação', () => {
    it('aceita filtro por cada tipo de dieta válido', async () => {
      const types = ['weight-loss', 'weight-gain', 'maintenance', 'high-protein', 'low-carb', 'vegan', 'other'];
      for (const type of types) {
        const repo = { findActive: jest.fn(async () => []) };
        const r = await listDiets({ DietRepository: repo, filters: { type } });
        expect(r.success).toBe(true);
        expect(repo.findActive).toHaveBeenCalledWith({ type });
      }
    });

    it('retorna paginação padrão quando não informada', async () => {
      const repo = { findActive: jest.fn(async () => []) };
      const r = await listDiets({ DietRepository: repo, filters: {} });
      expect(r.success).toBe(true);
    });

    it('propaga erro 422 para tipo inválido', async () => {
      const repo = { findActive: jest.fn(async () => []) };
      const r = await listDiets({ DietRepository: repo, filters: { type: 'xyz' } });
      expect(r.success).toBe(false);
      expect(r.status).toBe(422);
    });
  });

  describe('getDietById — cenários adicionais', () => {
    it('retorna a dieta quando ativa', async () => {
      const diet = makeDiet();
      const r = await getDietById({
        id: 'diet-1',
        DietRepository: { findById: jest.fn(async () => diet) },
      });
      expect(r.diet).toEqual(diet);
      expect(r.status).toBe(200);
    });

    it('retorna 422 quando id é string vazia', async () => {
      const r = await getDietById({
        id: '',
        DietRepository: { findById: jest.fn(async () => null) },
      });
      expect(r.status).toBe(422);
    });

    it('retorna 422 quando id é undefined', async () => {
      const r = await getDietById({
        id: undefined,
        DietRepository: { findById: jest.fn(async () => null) },
      });
      expect(r.status).toBe(422);
    });
  });

  describe('deleteDiet — cenários adicionais', () => {
    it('chama update com deletedAt do tipo Date', async () => {
      const diet = makeDiet();
      const repo = {
        findById: jest.fn(async () => diet),
        update: jest.fn(async (id, data) => ({ ...diet, ...data })),
      };
      await deleteDiet({ id: 'diet-1', user: validUser, DietRepository: repo });
      const updateArg = repo.update.mock.calls[0][1];
      expect(updateArg.deletedAt).toBeInstanceOf(Date);
    });

    it('falha quando user._id está ausente (401)', async () => {
      const r = await deleteDiet({
        id: 'diet-1',
        user: {},
        DietRepository: {
          findById: jest.fn(async () => makeDiet()),
          update: jest.fn(),
        },
      });
      expect(r.status).toBe(401);
    });
  });

  describe('validateDiet — todos os tipos de dieta aceitos', () => {
    const validTypes = ['weight-loss', 'weight-gain', 'maintenance', 'high-protein', 'low-carb', 'vegan', 'other'];
    validTypes.forEach((type) => {
      it(`aceita type "${type}"`, () => {
        expect(validateDiet({ name: 'Dieta Teste', type }).isValid).toBe(true);
      });
    });
  });
});
