const { describe, it, expect } = require('@jest/globals');
const { listConversation } = require('../../usecases/message/listConversation');

describe('listConversation use case', () => {
  it('retorna mensagens filtradas por pet e outro usuário', async () => {
    const repo = {
      findConversation: jest.fn(async () => [
        { _id: 'm1' },
        { _id: 'm2' },
      ]),
    };
    const r = await listConversation({
      user: { _id: 'u1' },
      otherUserId: '507f1f77bcf86cd799439011',
      petId: '507f1f77bcf86cd799439012',
      MessageRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.messages).toHaveLength(2);
    expect(repo.findConversation).toHaveBeenCalled();
  });

  it('falha sem usuário autenticado', async () => {
    const r = await listConversation({
      user: null,
      otherUserId: '507f1f77bcf86cd799439011',
      petId: '507f1f77bcf86cd799439012',
      MessageRepository: { findConversation: jest.fn() },
    });
    expect(r.status).toBe(401);
  });

  it('falha com otherUserId inválido', async () => {
    const r = await listConversation({
      user: { _id: 'u1' },
      otherUserId: 'abc',
      petId: '507f1f77bcf86cd799439012',
      MessageRepository: { findConversation: jest.fn() },
    });
    expect(r.status).toBe(422);
  });

  it('falha com petId inválido', async () => {
    const r = await listConversation({
      user: { _id: 'u1' },
      otherUserId: '507f1f77bcf86cd799439011',
      petId: 'xyz',
      MessageRepository: { findConversation: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});