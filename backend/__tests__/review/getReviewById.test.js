const { describe, it, expect } = require('@jest/globals');
const { getReviewById } = require('../../usecases/review/getReviewById');

describe('getReviewById use case', () => {
  it('retorna review existente', async () => {
    const repo = {
      findById: jest.fn(async () => ({ _id: 'r1', rating: 5 })),
    };
    const r = await getReviewById({
      id: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.review.rating).toBe(5);
  });

  it('falha com ID inválido', async () => {
    const r = await getReviewById({
      id: 'abc',
      ReviewRepository: { findById: jest.fn() },
    });
    expect(r.status).toBe(422);
  });

  it('retorna 404 quando não existe', async () => {
    const repo = { findById: jest.fn(async () => null) };
    const r = await getReviewById({
      id: '507f1f77bcf86cd799439011',
      ReviewRepository: repo,
    });
    expect(r.status).toBe(404);
  });
});