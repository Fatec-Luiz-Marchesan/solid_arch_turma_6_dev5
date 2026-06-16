const { describe, it, expect } = require('@jest/globals');
const { listMessages } = require('../../usecases/message/listMessages');

describe('listMessages use case', () => {
  it('retorna lista do usuário', async () => {
    const repo = {
      findByUser: jest.fn(async () => [{ _id: 'm1' }]),
      countByUser: jest.fn(async () => 1),
    };
    const r = await listMessages({
      user: { _id: 'u1' },
      page: 1,
      limit: 20,
      MessageRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.messages).toHaveLength(1);
    expect(r.total).toBe(1);
    expect(r.page).toBe(1);
  });

  it('usa defaults para page e limit', async () => {
    const repo = {
      findByUser: jest.fn(async () => []),
      countByUser: jest.fn(async () => 0),
    };
    await listMessages({
      user: { _id: 'u1' },
      MessageRepository: repo,
    });
    expect(repo.findByUser).toHaveBeenCalledWith('u1', { skip: 0, limit: 20 });
  });

  it('rejeita sem usuário autenticado', async () => {
    const r = await listMessages({
      user: null,
      MessageRepository: {},
    });
    expect(r.status).toBe(401);
  });

  it('rejeita page menor que 1', async () => {
    const r = await listMessages({
      user: { _id: 'u1' },
      page: 0,
      MessageRepository: {},
    });
    expect(r.status).toBe(422);
  });

  it('rejeita limit maior que 100', async () => {
    const r = await listMessages({
      user: { _id: 'u1' },
      limit: 200,
      MessageRepository: {},
    });
    expect(r.status).toBe(422);
  });
});