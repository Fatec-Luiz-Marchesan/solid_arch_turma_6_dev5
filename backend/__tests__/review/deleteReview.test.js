const { describe, it, expect } = require('@jest/globals');
const { deleteReview } = require('../../usecases/review/deleteReview');

describe('deleteReview use case', () => {
  it('deleta quando usuário é o autor', async () => {
    const repo = {
      findById: jest.fn(async () => ({
        _id: 'r1',
        reviewer: { _id: 'u1' },
      })),
      delete: jest.fn(async () => true),
    };
    const r = await deleteReview({
      id: 'r1',
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(repo.delete).toHaveBeenCalledWith('r1');
  });

  it('retorna 404 quando não existe', async () => {
    const repo = {
      findById: jest.fn(async () => null),
      delete: jest.fn(),
    };
    const r = await deleteReview({
      id: 'r1',
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
      delete: jest.fn(),
    };
    const r = await deleteReview({
      id: 'r1',
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(403);
    expect(repo.delete).not.toHaveBeenCalled();
  });
});