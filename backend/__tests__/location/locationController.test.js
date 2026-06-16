const { describe, it, expect, beforeEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Teste' }))
);
jest.mock('../../models/Location');

const LocationController = require('../../controllers/LocationController');
const Location = require('../../models/Location');

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

describe('LocationController — testes de integração', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('retorna 201 com dados válidos', async () => {
      Location.prototype.save = jest.fn().mockResolvedValue({
        _id: 'loc1', name: 'Casa', city: 'SP',
      });
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa', street: 'Rua A', city: 'São Paulo',
          state: 'SP', zipCode: '01234-567',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retorna 422 quando nome ausente', async () => {
      const res = makeRes();
      await LocationController.create(
        makeReq({ street: 'Rua A', city: 'SP', state: 'SP', zipCode: '01234-567' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando estado inválido', async () => {
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa', street: 'Rua A', city: 'SP',
          state: 'São Paulo', zipCode: '01234-567',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando CEP inválido', async () => {
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa', street: 'Rua A', city: 'SP',
          state: 'SP', zipCode: '123',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('list', () => {
    it('retorna 200 com lista', async () => {
      Location.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: 'loc1', name: 'Casa' }]),
      });
      const res = makeRes();
      await LocationController.list(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getById', () => {
    it('retorna 404 quando não encontrado', async () => {
      Location.findById = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await LocationController.getById(makeReq({}, { id: 'x' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('retorna 404 quando não encontrado', async () => {
      Location.findById = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await LocationController.delete(makeReq({}, { id: 'x' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});