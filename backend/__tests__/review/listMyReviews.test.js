const { describe, it, expect } = require('@jest/globals');
const { listMyReviews } = require('../../usecases/review/listMyReviews');

describe('listMyReviews use case', () => {
  it('lista reviews feitas pelo usuário logado', async () => {
    const repo = {
      findByReviewerId: jest.fn(async () => [{ _id: 'r1' }]),
    };
    const r = await listMyReviews({
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.reviews).toHaveLength(1);
    expect(repo.findByReviewerId).toHaveBeenCalledWith('u1');
  });

  it('falha sem usuário autenticado', async () => {
    const r = await listMyReviews({
      user: null,
      ReviewRepository: { findByReviewerId: jest.fn() },
    });
    expect(r.status).toBe(401);
  });
});