const { describe, it, expect, afterEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Teste' }))
);

const BreedController = require('../../controllers/BreedController');

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

const makeRepo = () => ({
  create: jest.fn(async (d) => ({ _id: 'b1', ...d })),
  findActive: jest.fn(async () => []),
  countActive: jest.fn(async () => 0),
  findById: jest.fn(async () => null),
  findByName: jest.fn(async () => null),
  update: jest.fn(async (id, d) => ({ _id: id, ...d })),
});

describe('BreedController — testes do controller', () => {
  afterEach(() => BreedController.resetRepository());

  describe('create', () => {
    it('retorna 201 com dados válidos', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.create(
        makeReq({ name: 'Labrador', species: 'dog' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/criada/i) })
      );
    });

    it('retorna 422 quando nome ausente', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.create(makeReq({ species: 'dog' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando species inválida', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.create(
        makeReq({ name: 'Dragão', species: 'dragon' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 409 quando nome duplicado', async () => {
      const repo = makeRepo();
      repo.findByName = jest.fn(async () => ({ _id: 'b0', name: 'Labrador' }));
      BreedController.setRepository(repo);
      const res = makeRes();
      await BreedController.create(
        makeReq({ name: 'Labrador', species: 'dog' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('list', () => {
    it('retorna 200 com lista vazia', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.list(makeReq({}, {}, {}), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ breeds: [] })
      );
    });

    it('retorna 422 com species inválida', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.list(makeReq({}, {}, { species: 'dragon' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('getById', () => {
    it('retorna 200 quando encontrado', async () => {
      const repo = makeRepo();
      repo.findById = jest.fn(async () => ({ _id: 'b1', name: 'Labrador', deletedAt: null }));
      BreedController.setRepository(repo);
      const res = makeRes();
      await BreedController.getById(makeReq({}, { id: 'b1' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando não encontrado', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.getById(makeReq({}, { id: 'nope' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('retorna 200 com dados válidos', async () => {
      const repo = makeRepo();
      repo.findById = jest.fn(async () => ({ _id: 'b1', name: 'Lab', deletedAt: null }));
      BreedController.setRepository(repo);
      const res = makeRes();
      await BreedController.update(
        makeReq({ description: 'Muito dócil' }, { id: 'b1' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando raça não existe', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.update(makeReq({ description: 'x' }, { id: 'nope' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('retorna 200 quando removido', async () => {
      const repo = makeRepo();
      repo.findById = jest.fn(async () => ({ _id: 'b1', deletedAt: null }));
      BreedController.setRepository(repo);
      const res = makeRes();
      await BreedController.delete(makeReq({}, { id: 'b1' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando não existe', async () => {
      BreedController.setRepository(makeRepo());
      const res = makeRes();
      await BreedController.delete(makeReq({}, { id: 'nope' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});