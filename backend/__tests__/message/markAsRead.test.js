const { describe, it, expect } = require('@jest/globals');
const { markAsRead } = require('../../usecases/message/markAsRead');

describe('markAsRead use case', () => {
  it('marca como lida quando usuário é o receiver', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'm1',
        sender: { _id: 'u1' },
        receiver: { _id: 'u2' },
        read: false,
      })),
      update: jest.fn(async (id, d) => ({ _id: id, ...d })),
    };
    const r = await markAsRead({
      id: 'm1',
      user: { _id: 'u2' },
      MessageRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(repo.update).toHaveBeenCalledWith('m1', { read: true });
  });

  it('retorna 404 quando não existe', async () => {
    const repo = { findById: jest.fn(async () => null), update: jest.fn() };
    const r = await markAsRead({
      id: 'mx',
      user: { _id: 'u1' },
      MessageRepository: repo,
    });
    expect(r.status).toBe(404);
  });

  it('nega acesso se não é o receiver', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'm1',
        sender: { _id: 'u1' },
        receiver: { _id: 'u2' },
      })),
      update: jest.fn(),
    };
    const r = await markAsRead({
      id: 'm1',
      user: { _id: 'u1' },
      MessageRepository: repo,
    });
    expect(r.status).toBe(403);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('falha sem ID', async () => {
    const r = await markAsRead({
      id: null,
      user: { _id: 'u1' },
      MessageRepository: { findById: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});