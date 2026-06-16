const { describe, it, expect, afterEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Teste' }))
);

const VaccineController = require('../../controllers/VaccineController');

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

describe('Vaccine — fluxo de integração', () => {
  afterEach(() => VaccineController.resetRepository());

  it('cria → lista → busca → atualiza → deleta', async () => {
    const store = {};
    const repo = {
      create: jest.fn(async (d) => { store.v = { _id: 'v1', ...d, deletedAt: null }; return store.v; }),
      findActiveByUser: jest.fn(async () => store.v ? [store.v] : []),
      findActiveByPet: jest.fn(async () => []),
      findById: jest.fn(async () => store.v || null),
      update: jest.fn(async (id, d) => { Object.assign(store.v, d); return store.v; }),
    };
    VaccineController.setRepository(repo);

    let res = makeRes();
    await VaccineController.create(
      makeReq({
        name: 'Raiva',
        applicationDate: '2025-01-15',
        petId: 'p1',
        petName: 'Rex',
      }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(201);

    res = makeRes();
    await VaccineController.list(makeReq({}, {}, {}), res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json.mock.calls[0][0].vaccines.length).toBe(1);

    res = makeRes();
    await VaccineController.getById(makeReq({}, { id: 'v1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);

    res = makeRes();
    await VaccineController.update(
      makeReq({ dose: 2 }, { id: 'v1' }),
      res
    );
    expect(res.status).toHaveBeenCalledWith(200);

    res = makeRes();
    await VaccineController.delete(makeReq({}, { id: 'v1' }), res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getById retorna 404 quando não existe', async () => {
    VaccineController.setRepository({
      findById: jest.fn(async () => null),
    });
    const res = makeRes();
    await VaccineController.getById(makeReq({}, { id: 'x' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('delete retorna 404 quando não existe', async () => {
    VaccineController.setRepository({
      findById: jest.fn(async () => null),
      update: jest.fn(),
    });
    const res = makeRes();
    await VaccineController.delete(makeReq({}, { id: 'x' }), res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('create retorna 422 com dados inválidos', async () => {
    VaccineController.setRepository({
      create: jest.fn(),
    });
    const res = makeRes();
    await VaccineController.create(makeReq({ name: '' }), res);
    expect(res.status).toHaveBeenCalledWith(422);
  });
});