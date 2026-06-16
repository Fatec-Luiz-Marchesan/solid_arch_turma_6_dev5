const { describe, it, expect } = require('@jest/globals');
const { listReviewsByUser } = require('../../usecases/review/listReviewsByUser');

describe('listReviewsByUser use case', () => {
  it('lista reviews recebidas por um usuário', async () => {
    const repo = {
      findByReviewedId: jest.fn(async () => [{ _id: 'r1' }, { _id: 'r2' }]),
    };
    const r = await listReviewsByUser({
      userId: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.reviews).toHaveLength(2);
  });

  it('falha com ID inválido', async () => {
    const r = await listReviewsByUser({
      userId: 'abc',
      ReviewRepository: { findByReviewedId: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});