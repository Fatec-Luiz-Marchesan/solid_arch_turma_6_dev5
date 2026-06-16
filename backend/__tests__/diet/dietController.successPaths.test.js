const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Usuário Teste' }))
);

const DietController = require('../../controllers/DietController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (body = {}, params = {}, query = {}) => ({
  body,
  params,
  query,
});

const makeDiet = (overrides = {}) => ({
  _id: 'diet-1',
  name: 'Dieta Proteica',
  type: 'high-protein',
  goal: '',
  dailyCalories: null,
  durationDays: null,
  mealsPerDay: null,
  restrictions: [],
  notes: '',
  deletedAt: null,
  createdAt: new Date(),
  ...overrides,
});

describe('DietController — caminhos de sucesso', () => {
  afterEach(() => {
    DietController.resetRepository();
  });

  describe('create — sucesso', () => {
    it('retorna 201 com a dieta criada', async () => {
      const diet = makeDiet();
      DietController.setRepository({
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(diet),
      });
      const res = makeRes();
      await DietController.create(
        makeReq({ name: 'Dieta Proteica', type: 'high-protein' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: diet })
      );
    });

    it('retorna 201 com campos opcionais', async () => {
      const diet = makeDiet({ dailyCalories: 2000, durationDays: 30, mealsPerDay: 5 });
      DietController.setRepository({
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(diet),
      });
      const res = makeRes();
      await DietController.create(
        makeReq({
          name: 'Dieta Proteica',
          type: 'high-protein',
          dailyCalories: 2000,
          durationDays: 30,
          mealsPerDay: 5,
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retorna 409 quando nome já existe', async () => {
      DietController.setRepository({
        findByName: jest.fn().mockResolvedValue(makeDiet()),
        create: jest.fn(),
      });
      const res = makeRes();
      await DietController.create(
        makeReq({ name: 'Dieta Proteica', type: 'high-protein' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('list — sucesso', () => {
    it('retorna 200 com lista de dietas', async () => {
      const diets = [makeDiet({ _id: 'd1' }), makeDiet({ _id: 'd2', name: 'Vegana', type: 'vegan' })];
      DietController.setRepository({
        findActive: jest.fn().mockResolvedValue(diets),
      });
      const res = makeRes();
      await DietController.list(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ diets: expect.any(Array) })
      );
    });

    it('retorna 200 com lista vazia', async () => {
      DietController.setRepository({
        findActive: jest.fn().mockResolvedValue([]),
      });
      const res = makeRes();
      await DietController.list(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.diets).toEqual([]);
    });

    it('retorna 200 com paginação válida', async () => {
      DietController.setRepository({
        findActive: jest.fn().mockResolvedValue([]),
      });
      const res = makeRes();
      await DietController.list(makeReq({}, {}, { page: '1', limit: '5' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 quando type é inválido', async () => {
      DietController.setRepository({
        findActive: jest.fn().mockResolvedValue([]),
      });
      const res = makeRes();
      await DietController.list(makeReq({}, {}, { type: 'invalido' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('getById — sucesso', () => {
    it('retorna 200 com a dieta encontrada', async () => {
      const diet = makeDiet();
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(diet),
      });
      const res = makeRes();
      await DietController.getById(makeReq({}, { id: 'diet-1' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ diet })
      );
    });

    it('retorna 404 quando dieta não existe', async () => {
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(null),
      });
      const res = makeRes();
      await DietController.getById(makeReq({}, { id: 'nao-existe' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 404 quando dieta está deletada', async () => {
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(makeDiet({ deletedAt: new Date() })),
      });
      const res = makeRes();
      await DietController.getById(makeReq({}, { id: 'diet-1' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update — sucesso', () => {
    it('retorna 200 com dieta atualizada', async () => {
      const diet = makeDiet();
      const updated = { ...diet, dailyCalories: 2200 };
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(diet),
        findByName: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue(updated),
      });
      const res = makeRes();
      await DietController.update(
        makeReq({ dailyCalories: 2200 }, { id: 'diet-1' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: updated })
      );
    });

    it('retorna 404 quando dieta não existe', async () => {
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(null),
        findByName: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      });
      const res = makeRes();
      await DietController.update(makeReq({ dailyCalories: 2000 }, { id: 'nope' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 409 quando nome já pertence a outra dieta', async () => {
      const diet = makeDiet();
      const other = makeDiet({ _id: 'diet-2', name: 'Low Carb' });
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(diet),
        findByName: jest.fn().mockResolvedValue(other),
        update: jest.fn(),
      });
      const res = makeRes();
      await DietController.update(makeReq({ name: 'Low Carb' }, { id: 'diet-1' }), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('delete — sucesso', () => {
    it('retorna 200 ao fazer soft delete', async () => {
      const diet = makeDiet();
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(diet),
        update: jest.fn().mockResolvedValue({ ...diet, deletedAt: new Date() }),
      });
      const res = makeRes();
      await DietController.delete(makeReq({}, { id: 'diet-1' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando dieta não existe', async () => {
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      });
      const res = makeRes();
      await DietController.delete(makeReq({}, { id: 'nope' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 404 quando dieta já foi deletada', async () => {
      DietController.setRepository({
        findById: jest.fn().mockResolvedValue(makeDiet({ deletedAt: new Date() })),
        update: jest.fn(),
      });
      const res = makeRes();
      await DietController.delete(makeReq({}, { id: 'diet-1' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('resetRepository', () => {
    it('restaura o repositório padrão após set', () => {
      const customRepo = { create: jest.fn() };
      DietController.setRepository(customRepo);
      DietController.resetRepository();
      expect(() => DietController.resetRepository()).not.toThrow();
    });
  });
});
