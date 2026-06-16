const { describe, it, expect, beforeEach, afterAll } = require('@jest/globals');
const request = require('supertest');
const express = require('express');

jest.mock('../../helpers/check-admin', () => (req, res, next) => {
  req.user = { _id: '507f1f77bcf86cd799439011', role: 'admin', name: 'Admin Teste' };
  next();
});

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: '507f1f77bcf86cd799439011', name: 'Admin Teste', role: 'admin' }))
);

const VALID_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439022';

let mockUserFind;
let mockUserFindById;
let mockUserCountDocuments;
let mockUserFindByIdAndUpdate;
let mockUserFindByIdAndDelete;

jest.mock('../../models/User', () => ({
  find: (...args) => mockUserFind(...args),
  findById: (...args) => mockUserFindById(...args),
  countDocuments: (...args) => mockUserCountDocuments(...args),
  findByIdAndUpdate: (...args) => mockUserFindByIdAndUpdate(...args),
  findByIdAndDelete: (...args) => mockUserFindByIdAndDelete(...args),
}));

jest.mock('../../models/Pet', () => ({
  countDocuments: jest.fn(async () => 5),
}));

jest.mock('../../models/Message', () => ({
  countDocuments: jest.fn(async () => 10),
}));

const AdminController = require('../../controllers/AdminController');

function makeAdminApp() {
  const app = express();
  app.use(express.json());

  const checkAdmin = require('../../helpers/check-admin');

  const router = express.Router();
  router.post('/bootstrap', AdminController.bootstrap);
  router.get('/users', checkAdmin, AdminController.listUsers);
  router.get('/users/:id', checkAdmin, AdminController.getUser);
  router.patch('/users/:id/promote', checkAdmin, AdminController.promote);
  router.patch('/users/:id/demote', checkAdmin, AdminController.demote);
  router.delete('/users/:id', checkAdmin, AdminController.deleteUser);
  router.get('/stats', checkAdmin, AdminController.stats);

  app.use('/admin', router);
  return app;
}

describe('Admin — testes de integração', () => {
  let app;

  beforeEach(() => {
    const makeSelectSort = (resolvedValue) => ({
      select: jest.fn(() => ({
        sort: jest.fn(() => Promise.resolve(resolvedValue)),
      })),
    });
    const makeSelect = (resolvedValue) => ({
      select: jest.fn(() => Promise.resolve(resolvedValue)),
    });

    mockUserFind = jest.fn(() => makeSelectSort([]));
    mockUserFindById = jest.fn(() => makeSelect(null));
    mockUserCountDocuments = jest.fn(async () => 0);
    mockUserFindByIdAndUpdate = jest.fn(() => makeSelect(null));
    mockUserFindByIdAndDelete = jest.fn(async () => null);

    app = makeAdminApp();
  });

  describe('POST /admin/bootstrap', () => {
    it('promove primeiro admin quando não há nenhum (200)', async () => {
      const promotedUser = { _id: VALID_ID, role: 'admin', name: 'Admin Teste' };
      mockUserCountDocuments = jest.fn(async () => 0);
      mockUserFindByIdAndUpdate = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(promotedUser)),
      }));
      app = makeAdminApp();

      const res = await request(app).post('/admin/bootstrap');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('bloqueia quando já existe um admin (403)', async () => {
      mockUserCountDocuments = jest.fn(async () => 1);
      app = makeAdminApp();

      const res = await request(app).post('/admin/bootstrap');
      expect(res.status).toBe(403);
    });
  });

  describe('GET /admin/users', () => {
    it('lista todos os usuários (200)', async () => {
      const users = [
        { _id: VALID_ID, name: 'Admin', role: 'admin' },
        { _id: OTHER_ID, name: 'User', role: 'user' },
      ];
      mockUserFind = jest.fn(() => ({
        select: jest.fn(() => ({
          sort: jest.fn(() => Promise.resolve(users)),
        })),
      }));
      app = makeAdminApp();

      const res = await request(app).get('/admin/users');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBe(true);
      expect(res.body.users).toHaveLength(2);
    });

    it('retorna lista vazia quando não há usuários (200)', async () => {
      const res = await request(app).get('/admin/users');
      expect(res.status).toBe(200);
      expect(res.body.users).toEqual([]);
    });
  });

  describe('GET /admin/users/:id', () => {
    it('retorna detalhes do usuário (200)', async () => {
      const user = { _id: VALID_ID, name: 'User X', role: 'user' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(user)),
      }));
      app = makeAdminApp();

      const res = await request(app).get(`/admin/users/${VALID_ID}`);
      expect(res.status).toBe(200);
      expect(res.body.user._id).toBe(VALID_ID);
    });

    it('retorna 404 quando usuário não existe', async () => {
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(null)),
      }));
      app = makeAdminApp();

      const res = await request(app).get(`/admin/users/${VALID_ID}`);
      expect(res.status).toBe(404);
    });

    it('retorna 422 quando id é inválido', async () => {
      const res = await request(app).get('/admin/users/id-invalido');
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /admin/users/:id/promote', () => {
    it('promove usuário comum a admin (200)', async () => {
      const user = { _id: VALID_ID, name: 'User', role: 'user' };
      const promoted = { ...user, role: 'admin' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(user)),
      }));
      mockUserFindByIdAndUpdate = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(promoted)),
      }));
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${VALID_ID}/promote`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
    });

    it('retorna 422 ao tentar promover quem já é admin', async () => {
      const admin = { _id: VALID_ID, name: 'Admin', role: 'admin' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(admin)),
      }));
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${VALID_ID}/promote`);
      expect(res.status).toBe(422);
    });

    it('retorna 404 quando usuário não existe', async () => {
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(null)),
      }));
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${VALID_ID}/promote`);
      expect(res.status).toBe(404);
    });

    it('retorna 422 com id inválido', async () => {
      const res = await request(app).patch('/admin/users/abc/promote');
      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /admin/users/:id/demote', () => {
    it('rebaixa admin a usuário comum (200)', async () => {
      const admin = { _id: OTHER_ID, name: 'Admin2', role: 'admin' };
      const demoted = { ...admin, role: 'user' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(admin)),
      }));
      mockUserCountDocuments = jest.fn(async () => 2);
      mockUserFindByIdAndUpdate = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(demoted)),
      }));
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${OTHER_ID}/demote`);
      expect(res.status).toBe(200);
    });

    it('bloqueia rebaixar último admin (422)', async () => {
      const admin = { _id: VALID_ID, name: 'Admin', role: 'admin' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(admin)),
      }));
      mockUserCountDocuments = jest.fn(async () => 1);
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${VALID_ID}/demote`);
      expect(res.status).toBe(422);
    });

    it('retorna 422 ao rebaixar usuário comum', async () => {
      const user = { _id: VALID_ID, name: 'User', role: 'user' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(user)),
      }));
      app = makeAdminApp();

      const res = await request(app).patch(`/admin/users/${VALID_ID}/demote`);
      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('deleta usuário comum (200)', async () => {
      const user = { _id: OTHER_ID, name: 'User', role: 'user' };
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(user)),
      }));
      mockUserFindByIdAndDelete = jest.fn(async () => true);
      app = makeAdminApp();

      const res = await request(app).delete(`/admin/users/${OTHER_ID}`);
      expect(res.status).toBe(200);
    });

    it('bloqueia auto-deleção (422)', async () => {
      const res = await request(app).delete(`/admin/users/${VALID_ID}`);
      expect(res.status).toBe(422);
    });

    it('retorna 404 quando usuário não existe', async () => {
      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(null)),
      }));
      app = makeAdminApp();

      const res = await request(app).delete(`/admin/users/${OTHER_ID}`);
      expect(res.status).toBe(404);
    });

    it('retorna 422 com id inválido', async () => {
      const res = await request(app).delete('/admin/users/id-invalido');
      expect(res.status).toBe(422);
    });
  });

  describe('GET /admin/stats', () => {
    it('retorna estatísticas do sistema (200)', async () => {
      mockUserCountDocuments = jest.fn(async (query) => {
        if (query && query.role === 'admin') return 1;
        return 5;
      });
      app = makeAdminApp();

      const res = await request(app).get('/admin/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('totalUsers');
      expect(res.body.stats).toHaveProperty('totalAdmins');
      expect(res.body.stats).toHaveProperty('totalPets');
      expect(res.body.stats).toHaveProperty('totalMessages');
    });
  });

  describe('Fluxo completo: listar → promover → rebaixar → deletar', () => {
    it('executa fluxo de gerenciamento de usuário com sucesso', async () => {
      const user = { _id: OTHER_ID, name: 'João', role: 'user' };
      const promoted = { ...user, role: 'admin' };
      const demoted = { ...user, role: 'user' };

      mockUserFind = jest.fn(() => ({
        select: jest.fn(() => ({
          sort: jest.fn(() => Promise.resolve([user])),
        })),
      }));
      app = makeAdminApp();

      const listRes = await request(app).get('/admin/users');
      expect(listRes.status).toBe(200);
      expect(listRes.body.users).toHaveLength(1);

      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(user)),
      }));
      mockUserFindByIdAndUpdate = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(promoted)),
      }));
      app = makeAdminApp();

      const promoteRes = await request(app).patch(`/admin/users/${OTHER_ID}/promote`);
      expect(promoteRes.status).toBe(200);

      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(promoted)),
      }));
      mockUserCountDocuments = jest.fn(async (query) => {
        if (query && query.role === 'admin') return 2;
        return 5;
      });
      mockUserFindByIdAndUpdate = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(demoted)),
      }));
      app = makeAdminApp();

      const demoteRes = await request(app).patch(`/admin/users/${OTHER_ID}/demote`);
      expect(demoteRes.status).toBe(200);

      mockUserFindById = jest.fn(() => ({
        select: jest.fn(() => Promise.resolve(demoted)),
      }));
      mockUserFindByIdAndDelete = jest.fn(async () => true);
      app = makeAdminApp();

      const deleteRes = await request(app).delete(`/admin/users/${OTHER_ID}`);
      expect(deleteRes.status).toBe(200);
    });
  });
});
