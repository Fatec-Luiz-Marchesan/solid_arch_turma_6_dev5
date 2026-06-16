const { describe, it, expect, beforeEach } = require('@jest/globals');

jest.mock('../../models/User');
jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () => jest.fn());
jest.mock('../../helpers/create-user-token', () => jest.fn());
jest.mock('../../helpers/image-upload', () => ({
  imageUpload: { single: () => (req, res, next) => next() },
}));
jest.mock('bcrypt');

const User = require('../../models/User');
const bcrypt = require('bcrypt');
const getUserByToken = require('../../helpers/get-user-by-token');
const createUserToken = require('../../helpers/create-user-token');
const UserController = require('../../controllers/UserController');

const makeReq = (body = {}, params = {}, headers = {}) => ({
  body,
  params,
  headers,
  file: null,
});

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.send = jest.fn(() => res);
  return res;
};

describe('UserController — testes de integração', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('retorna 422 quando email ausente', async () => {
      const res = makeRes();
      await UserController.login(makeReq({ password: '123456' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando senha ausente', async () => {
      const res = makeRes();
      await UserController.login(makeReq({ email: 'j@email.com' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando email tem formato inválido', async () => {
      const res = makeRes();
      await UserController.login(makeReq({ email: 'invalido', password: '123' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando usuário não existe', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce(null);
      const res = makeRes();
      await UserController.login(
        makeReq({ email: 'j@email.com', password: '123456' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/não há usuário/i) })
      );
    });

    it('retorna 422 quando senha incorreta', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce({ _id: 'u1', password: 'hashed' });
      bcrypt.compare = jest.fn().mockResolvedValueOnce(false);
      const res = makeRes();
      await UserController.login(
        makeReq({ email: 'j@email.com', password: 'wrong' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/senha inválida/i) })
      );
    });

    it('chama createUserToken quando login válido', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce({ _id: 'u1', password: 'hashed' });
      bcrypt.compare = jest.fn().mockResolvedValueOnce(true);
      const req = makeReq({ email: 'j@email.com', password: '123456' });
      const res = makeRes();
      await UserController.login(req, res);
      expect(createUserToken).toHaveBeenCalledWith(
        expect.objectContaining({ _id: 'u1' }),
        req,
        res
      );
    });
  });

  describe('getUserById', () => {
    it('retorna 200 com usuário encontrado', async () => {
      User.findById = jest.fn().mockResolvedValueOnce({ _id: 'u1', name: 'João' });
      const res = makeRes();
      await UserController.getUserById(makeReq({}, { id: 'u1' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        user: expect.objectContaining({ name: 'João' }),
      });
    });

    it('retorna 422 quando usuário não encontrado', async () => {
      User.findById = jest.fn().mockResolvedValueOnce(null);
      const res = makeRes();
      await UserController.getUserById(makeReq({}, { id: 'none' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/não encontrado/i) })
      );
    });
  });

  describe('checkUser', () => {
    it('retorna null quando sem authorization', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const res = makeRes();
      await UserController.checkUser(makeReq({}, {}, {}), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(null);
      consoleSpy.mockRestore();
    });
  });

  describe('editUser', () => {
    const editBody = {
      name: 'João',
      email: 'j@email.com',
      phone: '11999998888',
      password: 'abc123',
      confirmpassword: 'abc123',
    };

    beforeEach(() => {
      getUserByToken.mockResolvedValue({
        _id: 'u1',
        name: 'João',
        email: 'j@email.com',
        phone: '11999998888',
        bio: '',
      });
      bcrypt.genSalt = jest.fn().mockResolvedValue('salt');
      bcrypt.hash = jest.fn().mockResolvedValue('newHash');
    });

    it('retorna 422 quando nome vazio', async () => {
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, name: '' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando email inválido', async () => {
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, email: 'invalido' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando telefone curto', async () => {
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, phone: '123' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando tenta usar email de outro usuário', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce({ _id: 'u2', email: 'outro@e.com' });
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, email: 'outro@e.com' }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
expect(res.json).toHaveBeenCalledWith(
  expect.objectContaining({
    message: expect.stringMatching(/outro e-mail/i),
  })
);
});
    it('atualiza usuário com dados válidos', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce(null);
      User.findOneAndUpdate = jest.fn().mockResolvedValueOnce({
        _id: 'u1',
        name: 'Maria',
      });
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, name: 'Maria' }),
        res
      );
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/atualizado/i) })
      );
      
    });

    it('persiste bio com trim', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce(null);
      User.findOneAndUpdate = jest.fn().mockResolvedValueOnce({ _id: 'u1' });
      const res = makeRes();
      await UserController.editUser(
        makeReq({ ...editBody, bio: '  Dev fullstack  ' }),
        res
      );
      const setArg = User.findOneAndUpdate.mock.calls[0][1].$set;
      expect(setArg.bio).toBe('Dev fullstack');
    });

    it('retorna 500 quando ocorre erro no banco', async () => {
      User.findOne = jest.fn().mockResolvedValueOnce(null);
      User.findOneAndUpdate = jest.fn().mockRejectedValueOnce(new Error('DB error'));
      const res = makeRes();
      await UserController.editUser(makeReq(editBody), res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});