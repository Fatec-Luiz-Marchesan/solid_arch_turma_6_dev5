const { describe, it, expect } = require('@jest/globals');
const { updateReview } = require('../../usecases/review/updateReview');

const validData = {
  rating: 4,
  comment: 'Atualizando minha avaliação aqui.',
  petId: '507f1f77bcf86cd799439011',
};

describe('updateReview use case', () => {
  it('atualiza quando usuário é o autor', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'r1',
        reviewer: { _id: 'u1' },
      })),
      update: jest.fn(async (id, d) => ({ _id: id, ...d })),
    };
    const r = await updateReview({
      id: 'r1',
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(repo.update).toHaveBeenCalled();
  });

  it('retorna 404 quando não existe', async () => {
    const repo = {
      findById: jest.fn(async () => null),
      update: jest.fn(),
    };
    const r = await updateReview({
      id: 'r1',
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(404);
  });

  it('nega acesso a quem não é o autor', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'r1',
        reviewer: { _id: 'u2' },
      })),
      update: jest.fn(),
    };
    const r = await updateReview({
      id: 'r1',
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(403);
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('falha com dados inválidos', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'r1',
        reviewer: { _id: 'u1' },
      })),
      update: jest.fn(),
    };
    const r = await updateReview({
      id: 'r1',
      data: { rating: 10, comment: 'curto', petId: 'abc' },
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(422);
  });
});