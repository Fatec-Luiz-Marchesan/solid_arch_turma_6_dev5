const { describe, it, expect } = require('@jest/globals');
const { createReview } = require('../../usecases/review/createReview');

const validData = {
  rating: 5,
  comment: 'Adoção tranquila, doador atencioso.',
  petId: '507f1f77bcf86cd799439011',
};

const makePet = (overrides = {}) => ({
  _id: '507f1f77bcf86cd799439011',
  status: 'adopted',
  adopter: { _id: 'u1' },
  user: { _id: 'u2', name: 'Doador' },
  ...overrides,
});

const makeRepo = (overrides = {}) => ({
  findPetById: jest.fn(async () => makePet()),
  findExistingReview: jest.fn(async () => null),
  create: jest.fn(async (d) => ({ _id: 'r1', ...d })),
  ...overrides,
});

describe('createReview use case', () => {
  it('cria review quando tudo está válido', async () => {
    const repo = makeRepo();
    const r = await createReview({
      data: validData,
      user: { _id: 'u1', name: 'Adotante' },
      ReviewRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(r.status).toBe(201);
    expect(repo.create).toHaveBeenCalled();
  });

  it('falha com dados inválidos', async () => {
    const r = await createReview({
      data: { rating: 10 },
      user: { _id: 'u1' },
      ReviewRepository: makeRepo(),
    });
    expect(r.status).toBe(422);
  });

  it('falha sem usuário autenticado', async () => {
    const r = await createReview({
      data: validData,
      user: null,
      ReviewRepository: makeRepo(),
    });
    expect(r.status).toBe(401);
  });

  it('falha quando pet não existe', async () => {
    const repo = makeRepo({ findPetById: jest.fn(async () => null) });
    const r = await createReview({
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(404);
  });

  it('falha quando pet ainda não foi adotado', async () => {
    const repo = makeRepo({
      findPetById: jest.fn(async () => makePet({ status: 'available' })),
    });
    const r = await createReview({
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(422);
    expect(r.errors[0]).toMatch(/adotado/i);
  });

  it('falha quando usuário não é o adotante', async () => {
    const repo = makeRepo();
    const r = await createReview({
      data: validData,
      user: { _id: 'u999' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(403);
  });

  it('falha quando já existe review para esse pet', async () => {
    const repo = makeRepo({
      findExistingReview: jest.fn(async () => ({ _id: 'rExist' })),
    });
    const r = await createReview({
      data: validData,
      user: { _id: 'u1' },
      ReviewRepository: repo,
    });
    expect(r.status).toBe(409);
    expect(r.errors[0]).toMatch(/já.*avaliou/i);
  });
});