const { describe, it, expect, beforeEach, afterEach } = require('@jest/globals');
const request = require('supertest');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: '507f1f77bcf86cd799439011', name: 'Admin Teste', role: 'admin' }))
);

const { buildTestApp } = require('../helpers/buildTestApp');
const AdminController = require('../../controllers/AdminController');

const VALID_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439022';

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (body = {}, params = {}, query = {}, user = null) => ({
  body,
  params,
  query,
  user,
});

describe('AdminController — testes de unidade', () => {
  let failRepo;

  beforeEach(() => {
    failRepo = {
      findAll: jest.fn().mockRejectedValue(new Error('DB error')),
      findById: jest.fn().mockRejectedValue(new Error('DB error')),
      countAdmins: jest.fn().mockRejectedValue(new Error('DB error')),
      countUsers: jest.fn().mockRejectedValue(new Error('DB error')),
      countPets: jest.fn().mockRejectedValue(new Error('DB error')),
      countMessages: jest.fn().mockRejectedValue(new Error('DB error')),
      promote: jest.fn().mockRejectedValue(new Error('DB error')),
      demote: jest.fn().mockRejectedValue(new Error('DB error')),
      delete: jest.fn().mockRejectedValue(new Error('DB error')),
    };
  });

  afterEach(() => {
    AdminController.resetRepository();
  });

  describe('bootstrap — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository({
        countAdmins: jest.fn().mockRejectedValue(new Error('DB error')),
        promote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.bootstrap(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 quando primeiro admin é criado', async () => {
      const promotedUser = { _id: VALID_ID, role: 'admin' };
      AdminController.setRepository({
        countAdmins: jest.fn().mockResolvedValue(0),
        promote: jest.fn().mockResolvedValue(promotedUser),
      });
      const res = makeRes();
      await AdminController.bootstrap(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 403 quando já existe admin', async () => {
      AdminController.setRepository({
        countAdmins: jest.fn().mockResolvedValue(1),
        promote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.bootstrap(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  describe('listUsers — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository(failRepo);
      const res = makeRes();
      await AdminController.listUsers(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 com lista de usuários', async () => {
      AdminController.setRepository({
        findAll: jest.fn().mockResolvedValue([{ _id: 'u1' }, { _id: 'u2' }]),
      });
      const res = makeRes();
      await AdminController.listUsers(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ users: expect.any(Array) })
      );
    });
  });

  describe('getUser — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository({ findById: jest.fn().mockRejectedValue(new Error('DB error')) });
      const res = makeRes();
      await AdminController.getUser(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 quando usuário é encontrado', async () => {
      const user = { _id: VALID_ID, name: 'User X' };
      AdminController.setRepository({ findById: jest.fn().mockResolvedValue(user) });
      const res = makeRes();
      await AdminController.getUser(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando usuário não existe', async () => {
      AdminController.setRepository({ findById: jest.fn().mockResolvedValue(null) });
      const res = makeRes();
      await AdminController.getUser(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 422 com id inválido', async () => {
      AdminController.setRepository({ findById: jest.fn() });
      const res = makeRes();
      await AdminController.getUser(makeReq({}, { id: 'abc' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('promote — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockRejectedValue(new Error('DB error')),
        promote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.promote(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 ao promover usuário comum', async () => {
      const user = { _id: VALID_ID, role: 'user' };
      const promoted = { ...user, role: 'admin' };
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue(user),
        promote: jest.fn().mockResolvedValue(promoted),
      });
      const res = makeRes();
      await AdminController.promote(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 ao promover quem já é admin', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue({ _id: VALID_ID, role: 'admin' }),
        promote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.promote(makeReq({}, { id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('demote — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockRejectedValue(new Error('DB error')),
        countAdmins: jest.fn(),
        demote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.demote(makeReq({}, { id: VALID_ID }, {}, { _id: OTHER_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 ao rebaixar admin com outros admins existentes', async () => {
      const admin = { _id: VALID_ID, role: 'admin' };
      const demoted = { ...admin, role: 'user' };
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue(admin),
        countAdmins: jest.fn().mockResolvedValue(2),
        demote: jest.fn().mockResolvedValue(demoted),
      });
      const res = makeRes();
      await AdminController.demote(makeReq({}, { id: VALID_ID }, {}, { _id: OTHER_ID }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 ao rebaixar último admin', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue({ _id: VALID_ID, role: 'admin' }),
        countAdmins: jest.fn().mockResolvedValue(1),
        demote: jest.fn(),
      });
      const res = makeRes();
      await AdminController.demote(makeReq({}, { id: VALID_ID }, {}, { _id: OTHER_ID }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('deleteUser — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockRejectedValue(new Error('DB error')),
        delete: jest.fn(),
        countAdmins: jest.fn(),
      });
      const res = makeRes();
      await AdminController.deleteUser(makeReq({}, { id: OTHER_ID }, {}, { _id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 ao deletar usuário comum', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue({ _id: OTHER_ID, role: 'user' }),
        delete: jest.fn().mockResolvedValue(true),
        countAdmins: jest.fn(),
      });
      const res = makeRes();
      await AdminController.deleteUser(makeReq({}, { id: OTHER_ID }, {}, { _id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 quando tenta deletar a si mesmo', async () => {
      AdminController.setRepository({
        findById: jest.fn(),
        delete: jest.fn(),
        countAdmins: jest.fn(),
      });
      const res = makeRes();
      await AdminController.deleteUser(makeReq({}, { id: VALID_ID }, {}, { _id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 404 quando usuário não existe', async () => {
      AdminController.setRepository({
        findById: jest.fn().mockResolvedValue(null),
        delete: jest.fn(),
        countAdmins: jest.fn(),
      });
      const res = makeRes();
      await AdminController.deleteUser(makeReq({}, { id: OTHER_ID }, {}, { _id: VALID_ID }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('stats — tratamento de erros', () => {
    it('retorna 500 quando repositório falha', async () => {
      AdminController.setRepository(failRepo);
      const res = makeRes();
      await AdminController.stats(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('retorna 200 com estatísticas do sistema', async () => {
      AdminController.setRepository({
        countAdmins: jest.fn().mockResolvedValue(2),
        countUsers: jest.fn().mockResolvedValue(10),
        countPets: jest.fn().mockResolvedValue(5),
        countMessages: jest.fn().mockResolvedValue(100),
      });
      const res = makeRes();
      await AdminController.stats(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.stats).toMatchObject({
        totalAdmins: 2,
        totalUsers: 10,
        totalPets: 5,
        totalMessages: 100,
      });
    });
  });
});

describe('AdminController — integração via buildTestApp', () => {
  let app;
  let repo;

  beforeEach(() => {
    repo = {
      findAll: jest.fn().mockResolvedValue([]),
      findById: jest.fn().mockResolvedValue(null),
      countAdmins: jest.fn().mockResolvedValue(0),
      countUsers: jest.fn().mockResolvedValue(0),
      countPets: jest.fn().mockResolvedValue(0),
      countMessages: jest.fn().mockResolvedValue(0),
      promote: jest.fn(),
      demote: jest.fn(),
      delete: jest.fn(),
    };
    app = buildTestApp({
      adminRepository: repo,
      adminUser: { _id: VALID_ID, role: 'admin', name: 'Admin' },
    });
  });

  afterEach(() => {
    AdminController.resetRepository();
  });

  it('GET /admin/users retorna 200', async () => {
    repo.findAll = jest.fn().mockResolvedValue([{ _id: 'u1' }]);
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('GET /admin/users/:id retorna 422 com id inválido', async () => {
    const res = await request(app).get('/admin/users/id-ruim');
    expect(res.status).toBe(422);
  });

  it('GET /admin/stats retorna 200 com estatísticas', async () => {
    repo.countAdmins = jest.fn().mockResolvedValue(1);
    repo.countUsers = jest.fn().mockResolvedValue(5);
    repo.countPets = jest.fn().mockResolvedValue(3);
    repo.countMessages = jest.fn().mockResolvedValue(20);
    app = buildTestApp({ adminRepository: repo, adminUser: { _id: VALID_ID, role: 'admin' } });

    const res = await request(app).get('/admin/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats).toHaveProperty('totalUsers', 5);
  });

  it('PATCH /admin/users/:id/promote retorna 404 quando usuário não existe', async () => {
    repo.findById = jest.fn().mockResolvedValue(null);
    const res = await request(app).patch(`/admin/users/${OTHER_ID}/promote`);
    expect(res.status).toBe(404);
  });

  it('DELETE /admin/users/:id retorna 422 ao deletar a si mesmo', async () => {
    const res = await request(app).delete(`/admin/users/${VALID_ID}`);
    expect(res.status).toBe(422);
  });

  it('retorna 500 quando repositório lança exceção', async () => {
    repo.findAll = jest.fn().mockRejectedValue(new Error('Falha crítica'));
    const res = await request(app).get('/admin/users');
    expect(res.status).toBe(500);
  });
});
