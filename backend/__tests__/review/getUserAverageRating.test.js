const { describe, it, expect } = require('@jest/globals');
const { getUserAverageRating } = require('../../usecases/review/getUserAverageRating');

describe('getUserAverageRating use case', () => {
  it('calcula média correta de várias reviews', async () => {
    const repo = {
      findByReviewedId: jest.fn(async () => [
        { rating: 5 },
        { rating: 3 },
        { rating: 4 },
      ]),
    };
    const r = await getUserAverageRating({
      userId: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.average).toBe(4);
    expect(r.total).toBe(3);
  });

  it('retorna 0 quando não há reviews', async () => {
    const repo = {
      findByReviewedId: jest.fn(async () => []),
    };
    const r = await getUserAverageRating({
      userId: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.average).toBe(0);
    expect(r.total).toBe(0);
  });

  it('arredonda para 2 casas decimais', async () => {
    const repo = {
      findByReviewedId: jest.fn(async () => [
        { rating: 5 },
        { rating: 4 },
        { rating: 4 },
      ]),
    };
    const r = await getUserAverageRating({
      userId: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.average).toBe(4.33);
  });

  it('falha com ID inválido', async () => {
    const r = await getUserAverageRating({
      userId: 'abc',
      ReviewRepository: { findByReviewedId: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});