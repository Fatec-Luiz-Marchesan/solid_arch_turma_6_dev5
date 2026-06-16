const { describe, it, expect } = require('@jest/globals');
const { createMessage } = require('../../usecases/message/createMessage');

const validData = {
  content: 'Oi, quero adotar!',
  receiverId: '507f1f77bcf86cd799439011',
  petId: '507f1f77bcf86cd799439012',
};

const makeRepo = () => ({
  create: jest.fn(async (d) => ({ _id: 'msg1', ...d })),
});

describe('createMessage use case', () => {
  it('cria mensagem com dados válidos', async () => {
    const repo = makeRepo();
    const r = await createMessage({
      data: validData,
      sender: { _id: 'u1', name: 'João' },
      MessageRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.status).toBe(201);
    expect(repo.create).toHaveBeenCalled();
  });

  it('falha com dados inválidos', async () => {
    const r = await createMessage({
      data: { content: '' },
      sender: { _id: 'u1' },
      MessageRepository: makeRepo(),
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe(422);
  });

  it('falha sem sender autenticado', async () => {
    const r = await createMessage({
      data: validData,
      sender: null,
      MessageRepository: makeRepo(),
    });
    expect(r.status).toBe(401);
  });

  it('falha ao enviar mensagem para si mesmo', async () => {
    const r = await createMessage({
      data: { ...validData, receiverId: 'u1' },
      sender: { _id: 'u1' },
      MessageRepository: makeRepo(),
    });
    expect(r.success).toBe(false);
  });

  it('falha com receiverId em formato inválido', async () => {
    const r = await createMessage({
      data: { ...validData, receiverId: 'abc' },
      sender: { _id: 'u1' },
      MessageRepository: makeRepo(),
    });
    expect(r.status).toBe(422);
    expect(r.errors[0]).toMatch(/inválido/i);
  });

  it('falha com petId em formato inválido', async () => {
    const r = await createMessage({
      data: { ...validData, petId: 'xyz' },
      sender: { _id: 'u1' },
      MessageRepository: makeRepo(),
    });
    expect(r.status).toBe(422);
    expect(r.errors[0]).toMatch(/inválido/i);
  });
});