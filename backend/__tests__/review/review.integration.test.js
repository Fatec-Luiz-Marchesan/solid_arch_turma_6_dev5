const {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} = require('@jest/globals');
const request = require('supertest');
const express = require('express');

const USER_LOGGED_ID = '507f1f77bcf86cd799439011';
const OWNER_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439013';
const PET_ID = '507f1f77bcf86cd799439014';
const PET_AVAILABLE_ID = '507f1f77bcf86cd799439015';
const PET_NONEXISTENT_ID = '507f1f77bcf86cd799439016';
const NONEXISTENT_USER_ID = '507f1f77bcf86cd799439017';
const NONEXISTENT_REVIEW_ID = '507f1f77bcf86cd799439018';

jest.mock('../../helpers/get-token', () => () => 'fake-token');

jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: '507f1f77bcf86cd799439011', name: 'Usuário Logado' }))
);

jest.mock('../../helpers/check-token', () => (req, res, next) => next());

const mockReviewStore = new Map();
let mockReviewSeq = 0;
const mockPetStore = new Map();

function generateReviewId() {
  const seq = (++mockReviewSeq).toString(16).padStart(24, '0');
  return seq;
}

jest.mock('../../models/Review', () => {
  function chainable(value) {
    const chain = {
      sort: () => chain,
      then: (resolve) => Promise.resolve(value).then(resolve),
      catch: (reject) => Promise.resolve(value).catch(reject),
    };
    return chain;
  }

  function ReviewMock(data) {
    Object.assign(this, data);
    this.save = jest.fn(async () => {
      const seq = (++mockReviewSeq).toString(16).padStart(24, '0');
      const _id = seq;
      const saved = { _id, ...data, createdAt: new Date() };
      mockReviewStore.set(_id, saved);
      return saved;
    });
  }
  ReviewMock.findById = jest.fn(async (id) => mockReviewStore.get(id) || null);
  ReviewMock.find = jest.fn((query = {}) => {
    const results = Array.from(mockReviewStore.values()).filter((r) => {
      if (query['reviewed._id']) return String(r.reviewed._id) === String(query['reviewed._id']);
      if (query['reviewer._id']) return String(r.reviewer._id) === String(query['reviewer._id']);
      return true;
    });
    return chainable(results);
  });
  ReviewMock.findOne = jest.fn(async (query = {}) => {
    return (
      Array.from(mockReviewStore.values()).find((r) => {
        return (
          String(r.pet._id) === String(query['pet._id']) &&
          String(r.reviewer._id) === String(query['reviewer._id'])
        );
      }) || null
    );
  });
  ReviewMock.findByIdAndUpdate = jest.fn(async (id, data) => {
    const cur = mockReviewStore.get(id);
    if (!cur) return null;
    const updated = { ...cur, ...data };
    mockReviewStore.set(id, updated);
    return updated;
  });
  ReviewMock.findByIdAndDelete = jest.fn(async (id) => {
    const cur = mockReviewStore.get(id);
    mockReviewStore.delete(id);
    return cur || null;
  });
  return ReviewMock;
});

jest.mock('../../models/Pet', () => {
  function PetMock(data) {
    Object.assign(this, data);
  }
  PetMock.findById = jest.fn(async (id) => mockPetStore.get(id) || null);
  return PetMock;
});

const ReviewRouters = require('../../routers/ReviewRouters');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/reviews', ReviewRouters);
  return app;
}

describe('Review — testes de integração', () => {
  let app;

  beforeEach(() => {
    mockReviewStore.clear();
    mockPetStore.clear();
    mockReviewSeq = 0;
    app = buildApp();
  });

  afterAll(() => {
    jest.resetModules();
  });

  function seedAdoptedPet({ petId = PET_ID, adopterId = USER_LOGGED_ID, ownerId = OWNER_ID } = {}) {
    mockPetStore.set(petId, {
      _id: petId,
      name: 'Rex',
      status: 'adopted',
      adopter: { _id: adopterId, name: 'Adopter' },
      user: { _id: ownerId, name: 'Dono' },
    });
  }

  function seedReview(overrides = {}) {
    const _id = overrides._id || generateReviewId();
    const review = {
      _id,
      rating: 5,
      comment: 'Excelente adoção, muito feliz com o processo!',
      pet: { _id: PET_ID, name: 'Rex' },
      reviewer: { _id: USER_LOGGED_ID, name: 'Usuário Logado' },
      reviewed: { _id: OWNER_ID, name: 'Dono' },
      createdAt: new Date(),
      ...overrides,
    };
    mockReviewStore.set(_id, review);
    return review;
  }

  describe('POST /reviews', () => {
    it('cria avaliação válida (201)', async () => {
      seedAdoptedPet();
      const res = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 5,
        comment: 'Adoção tranquila, recomendo muito ao próximo adotante!',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.rating).toBe(5);
    });

    it('rejeita rating inválido (422)', async () => {
      seedAdoptedPet();
      const res = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 10,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita comentário muito curto (422)', async () => {
      seedAdoptedPet();
      const res = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 5,
        comment: 'curto',
      });

      expect(res.status).toBe(422);
    });

    it('retorna 404 quando pet não existe', async () => {
      const res = await request(app).post('/reviews').send({
        petId: PET_NONEXISTENT_ID,
        rating: 5,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(404);
    });

    it('rejeita avaliar pet ainda não adotado (422)', async () => {
      mockPetStore.set(PET_AVAILABLE_ID, {
        _id: PET_AVAILABLE_ID,
        name: 'Rex',
        status: 'available',
        user: { _id: OWNER_ID, name: 'Dono' },
      });

      const res = await request(app).post('/reviews').send({
        petId: PET_AVAILABLE_ID,
        rating: 5,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita avaliação de quem não é o adotante (403)', async () => {
      seedAdoptedPet({ adopterId: OTHER_USER_ID });

      const res = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 5,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(403);
    });

    it('rejeita avaliação duplicada do mesmo adotante (409)', async () => {
      seedAdoptedPet();
      seedReview();

      const res = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 4,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(409);
    });
  });

  describe('GET /reviews/:id', () => {
    it('retorna avaliação existente (200)', async () => {
      const review = seedReview();
      const res = await request(app).get(`/reviews/${review._id}`);

      expect(res.status).toBe(200);
      expect(res.body.review._id).toBe(review._id);
    });

    it('retorna 404 quando não existe', async () => {
      const res = await request(app).get(`/reviews/${NONEXISTENT_REVIEW_ID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /reviews/user/:userId', () => {
    it('lista avaliações de um usuário avaliado (200)', async () => {
      seedReview({ reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ reviewed: { _id: OTHER_USER_ID, name: 'Outro' } });

      const res = await request(app).get(`/reviews/user/${OWNER_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(2);
    });

    it('retorna lista vazia quando usuário nunca foi avaliado (200)', async () => {
      const res = await request(app).get(`/reviews/user/${NONEXISTENT_USER_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toEqual([]);
    });
  });

  describe('GET /reviews/my-reviews', () => {
    it('lista avaliações feitas pelo usuário logado (200)', async () => {
      seedReview({ reviewer: { _id: USER_LOGGED_ID, name: 'Usuário Logado' } });
      seedReview({ reviewer: { _id: USER_LOGGED_ID, name: 'Usuário Logado' } });
      seedReview({ reviewer: { _id: OTHER_USER_ID, name: 'Outro' } });

      const res = await request(app).get('/reviews/my-reviews');

      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(2);
    });
  });

  describe('PATCH /reviews/:id', () => {
    it('atualiza avaliação própria (200)', async () => {
      const review = seedReview();

      const res = await request(app).patch(`/reviews/${review._id}`).send({
        petId: PET_ID,
        rating: 3,
        comment: 'Atualizando minha avaliação para uma nota menor.',
      });

      expect(res.status).toBe(200);
      expect(res.body.data.rating).toBe(3);
    });

    it('retorna 404 quando avaliação não existe', async () => {
      const res = await request(app).patch(`/reviews/${NONEXISTENT_REVIEW_ID}`).send({
        petId: PET_ID,
        rating: 4,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(404);
    });

    it('rejeita edição por quem não é o autor (403)', async () => {
      const review = seedReview({
        reviewer: { _id: OTHER_USER_ID, name: 'Outro' },
      });

      const res = await request(app).patch(`/reviews/${review._id}`).send({
        petId: PET_ID,
        rating: 1,
        comment: 'Tentando editar avaliação de outra pessoa!',
      });

      expect(res.status).toBe(403);
    });

    it('rejeita dados inválidos na atualização (422)', async () => {
      const review = seedReview();

      const res = await request(app).patch(`/reviews/${review._id}`).send({
        petId: PET_ID,
        rating: 0,
        comment: 'Comentário com mais de dez caracteres aqui!',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('DELETE /reviews/:id', () => {
    it('remove avaliação própria (200)', async () => {
      const review = seedReview();

      const res = await request(app).delete(`/reviews/${review._id}`);

      expect(res.status).toBe(200);
      expect(mockReviewStore.has(review._id)).toBe(false);
    });

    it('retorna 404 quando avaliação não existe', async () => {
      const res = await request(app).delete(`/reviews/${NONEXISTENT_REVIEW_ID}`);
      expect(res.status).toBe(404);
    });

    it('rejeita remoção por quem não é o autor (403)', async () => {
      const review = seedReview({
        reviewer: { _id: OTHER_USER_ID, name: 'Outro' },
      });

      const res = await request(app).delete(`/reviews/${review._id}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /reviews/user/:userId/average', () => {
    it('calcula média de avaliações do usuário (200)', async () => {
      seedReview({ rating: 5, reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ rating: 3, reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ rating: 4, reviewed: { _id: OWNER_ID, name: 'Dono' } });

      const res = await request(app).get(`/reviews/user/${OWNER_ID}/average`);

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(4);
      expect(res.body.total).toBe(3);
    });

    it('retorna média 0 quando usuário não tem avaliações (200)', async () => {
      const res = await request(app).get(`/reviews/user/${NONEXISTENT_USER_ID}/average`);

      expect(res.status).toBe(200);
      expect(res.body.average).toBe(0);
      expect(res.body.total).toBe(0);
    });

    it('arredonda média para 2 casas decimais (200)', async () => {
      seedReview({ rating: 5, reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ rating: 4, reviewed: { _id: OWNER_ID, name: 'Dono' } });
      seedReview({ rating: 4, reviewed: { _id: OWNER_ID, name: 'Dono' } });

      const res = await request(app).get(`/reviews/user/${OWNER_ID}/average`);

      expect(res.status).toBe(200);
      expect(res.body.average).toBeCloseTo(4.33, 2);
    });
  });

  describe('Fluxo completo: criar → buscar → atualizar → remover', () => {
    it('executa ciclo de vida completo da avaliação', async () => {
      seedAdoptedPet();

      const createRes = await request(app).post('/reviews').send({
        petId: PET_ID,
        rating: 5,
        comment: 'Primeira impressão excelente, super recomendo!',
      });
      expect(createRes.status).toBe(201);
      const reviewId = createRes.body.data._id;

      const getRes = await request(app).get(`/reviews/${reviewId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.review.rating).toBe(5);

      const updateRes = await request(app).patch(`/reviews/${reviewId}`).send({
        petId: PET_ID,
        rating: 4,
        comment: 'Atualizei minha avaliação após mais tempo de convívio.',
      });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.rating).toBe(4);

      const deleteRes = await request(app).delete(`/reviews/${reviewId}`);
      expect(deleteRes.status).toBe(200);

      const afterDeleteRes = await request(app).get(`/reviews/${reviewId}`);
      expect(afterDeleteRes.status).toBe(404);
    });
  });
});