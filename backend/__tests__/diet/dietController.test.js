const { describe, it, expect, beforeEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Teste' }))
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

describe('DietController — testes do controller', () => {
  let failRepo;

  beforeEach(() => {
    failRepo = {
      create: jest.fn().mockRejectedValue(new Error('DB error')),
      findActive: jest.fn().mockRejectedValue(new Error('DB error')),
      findById: jest.fn().mockRejectedValue(new Error('DB error')),
      findByName: jest.fn().mockRejectedValue(new Error('DB error')),
      update: jest.fn().mockRejectedValue(new Error('DB error')),
    };
  });

  describe('create — erro 500', () => {
    it('retorna 500 quando repositório falha', async () => {
      DietController.setRepository(failRepo);
      failRepo.findByName = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await DietController.create(
        makeReq({ name: 'Dieta Proteica', type: 'high-protein' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(500);
      DietController.resetRepository();
    });
  });

  describe('list — erro 500', () => {
    it('retorna 500 quando repositório falha', async () => {
      DietController.setRepository(failRepo);
      const res = makeRes();
      await DietController.list(makeReq({}, {}, {}), res);
      expect(res.status).toHaveBeenCalledWith(500);
      DietController.resetRepository();
    });
  });

  describe('getById — erro 500', () => {
    it('retorna 500 quando repositório falha', async () => {
      DietController.setRepository(failRepo);
      const res = makeRes();
      await DietController.getById(makeReq({}, { id: 'x' }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      DietController.resetRepository();
    });
  });

  describe('update — erro 500', () => {
    it('retorna 500 quando repositório falha', async () => {
      DietController.setRepository(failRepo);
      failRepo.findById = jest.fn().mockResolvedValue({ _id: 'x', deletedAt: null });
      failRepo.findByName = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await DietController.update(
        makeReq({ dailyCalories: 2000 }, { id: 'x' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(500);
      DietController.resetRepository();
    });
  });

  describe('delete — erro 500', () => {
    it('retorna 500 quando repositório falha', async () => {
      DietController.setRepository(failRepo);
      const res = makeRes();
      await DietController.delete(makeReq({}, { id: 'x' }), res);
      expect(res.status).toHaveBeenCalledWith(500);
      DietController.resetRepository();
    });
  });

  describe('create — validação via controller', () => {
    it('retorna 422 quando nome ausente', async () => {
      DietController.setRepository({
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      });
      const res = makeRes();
      await DietController.create(
        makeReq({ type: 'vegan' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
      DietController.resetRepository();
    });

    it('retorna 422 quando tipo inválido', async () => {
      DietController.setRepository({
        findByName: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
      });
      const res = makeRes();
      await DietController.create(
        makeReq({ name: 'Dieta X', type: 'keto-extreme' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
      DietController.resetRepository();
    });
  });

  describe('list — validação de paginação', () => {
    it('retorna 422 quando page é 0', async () => {
      DietController.setRepository({
        findActive: jest.fn().mockResolvedValue([]),
      });
      const res = makeRes();
      await DietController.list(
        makeReq({}, {}, { page: '0', limit: '10' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
      DietController.resetRepository();
    });
  });
});