const { describe, it, expect, beforeEach } = require('@jest/globals');

jest.mock('../../db/conn', () => require('mongoose'));
jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'u1', name: 'Teste' }))
);
jest.mock('../../models/Settings');

const SettingsController = require('../../controllers/SettingsController');
const Settings = require('../../models/Settings');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (body = {}) => ({ body });

describe('SettingsController — testes de integração', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('retorna 201 com dados válidos', async () => {
      Settings.findOne = jest.fn().mockResolvedValue(null);
      Settings.prototype.save = jest.fn().mockResolvedValue({
        _id: 's1', user: { _id: 'u1' }, theme: 'system',
      });
      const res = makeRes();
      await SettingsController.create(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retorna 409 quando já existem', async () => {
      Settings.findOne = jest.fn().mockResolvedValue({ _id: 's1' });
      const res = makeRes();
      await SettingsController.create(makeReq({}), res);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('retorna 422 quando tema inválido', async () => {
      Settings.findOne = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await SettingsController.create(makeReq({ theme: 'neon' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('get', () => {
    it('retorna 200 quando existem', async () => {
      Settings.findOne = jest.fn().mockResolvedValue({
        _id: 's1', theme: 'dark',
      });
      const res = makeRes();
      await SettingsController.get(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ settings: expect.objectContaining({ theme: 'dark' }) })
      );
    });

    it('retorna 404 quando não existem', async () => {
      Settings.findOne = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await SettingsController.get(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('retorna 200 com dados válidos', async () => {
      Settings.findOne = jest.fn().mockResolvedValue({
        _id: 's1', notifications: { email: true, push: true, sms: false },
      });
      Settings.findOneAndUpdate = jest.fn().mockResolvedValue({
        _id: 's1', theme: 'dark',
      });
      const res = makeRes();
      await SettingsController.update(makeReq({ theme: 'dark' }), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando não existem', async () => {
      Settings.findOne = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await SettingsController.update(makeReq({ theme: 'dark' }), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 422 quando idioma inválido', async () => {
      Settings.findOne = jest.fn().mockResolvedValue({ _id: 's1' });
      const res = makeRes();
      await SettingsController.update(makeReq({ language: 'xx' }), res);
      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('delete', () => {
    it('retorna 200 quando removido', async () => {
      Settings.findOne = jest.fn().mockResolvedValue({ _id: 's1' });
      Settings.findOneAndUpdate = jest.fn().mockResolvedValue({ _id: 's1', deletedAt: new Date() });
      const res = makeRes();
      await SettingsController.delete(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando não existem', async () => {
      Settings.findOne = jest.fn().mockResolvedValue(null);
      const res = makeRes();
      await SettingsController.delete(makeReq(), res);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});