const {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} = require('@jest/globals');
const request = require('supertest');
const express = require('express');

const OWNER_ID = '507f1f77bcf86cd799439011';
const ADOPTER_ID = '507f1f77bcf86cd799439012';
const OTHER_USER_ID = '507f1f77bcf86cd799439013';
const PET_ID = '507f1f77bcf86cd799439014';
const NONEXISTENT_PET_ID = '507f1f77bcf86cd799439099';

const mockCurrentUserHolder = { value: { _id: OWNER_ID, name: 'Owner', image: 'avatar.png', phone: '11999999999' } };

jest.mock('../../helpers/get-token', () => () => 'fake-token');

jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => mockCurrentUserHolder.value)
);

jest.mock('../../helpers/check-token', () => (req, res, next) => next());

jest.mock('../../helpers/image-upload', () => {
  const middleware = (req, res, next) => {
    req.files = mockUploadHolder.value;
    next();
  };
  return {
    imageUpload: {
      array: () => middleware,
      single: () => middleware,
    },
  };
});

const mockUploadHolder = { value: [{ filename: 'pet1.jpg' }] };
global.mockUploadHolder = mockUploadHolder;

const mockPetStore = new Map();
let mockPetSeq = 0;

jest.mock('../../models/Pet', () => {
  function chainable(value) {
    const chain = {
      sort: () => chain,
      then: (resolve) => Promise.resolve(value).then(resolve),
      catch: (reject) => Promise.resolve(value).catch(reject),
    };
    return chain;
  }

  function PetMock(data) {
    Object.assign(this, data);
    if (!this._id) {
      this._id = '5f5f5f5f5f5f5f5f5f5f5f' + (++mockPetSeq).toString(16).padStart(2, '0');
    }
    this.save = jest.fn(async () => {
      mockPetStore.set(String(this._id), { ...this });
      return { ...this };
    });
  }
  PetMock.find = jest.fn((query = {}) => {
    const results = Array.from(mockPetStore.values()).filter((p) => {
      if (query['user._id']) return String(p.user._id) === String(query['user._id']);
      if (query['adopter._id']) return p.adopter && String(p.adopter._id) === String(query['adopter._id']);
      return true;
    });
    return chainable(results);
  });
  PetMock.findOne = jest.fn(async (query = {}) => {
    if (query._id) {
      return mockPetStore.get(String(query._id)) || null;
    }
    return null;
  });
  PetMock.findByIdAndUpdate = jest.fn(async (id, data) => {
    const cur = mockPetStore.get(String(id));
    if (!cur) return null;
    const updated = { ...cur, ...data };
    mockPetStore.set(String(id), updated);
    return updated;
  });
  PetMock.findByIdAndRemove = jest.fn(async (id) => {
    const cur = mockPetStore.get(String(id));
    mockPetStore.delete(String(id));
    return cur || null;
  });
  return PetMock;
});

const PetRouters = require('../../routers/PetRouters');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/pets', PetRouters);
  return app;
}

function setCurrentUser(user) {
  mockCurrentUserHolder.value = user;
}

function seedPet(overrides = {}) {
  const _id = overrides._id || PET_ID;
  const pet = {
    _id,
    name: 'Rex',
    species: 'dog',
    age: 3,
    weight: 12,
    color: 'preto',
    description: 'Cachorro amigável',
    available: true,
    images: ['rex.jpg'],
    user: { _id: OWNER_ID, name: 'Owner', image: 'avatar.png', phone: '11999999999' },
    ...overrides,
  };
  pet.user._id = pet.user._id || OWNER_ID;
  mockPetStore.set(String(_id), pet);
  return pet;
}

describe('Pet — testes de integração', () => {
  let app;

  beforeEach(() => {
    mockPetStore.clear();
    mockPetSeq = 0;
    mockUploadHolder.value = [{ filename: 'pet1.jpg' }];
    setCurrentUser({ _id: OWNER_ID, name: 'Owner', image: 'avatar.png', phone: '11999999999' });
    app = buildApp();
  });

  afterAll(() => {
    jest.resetModules();
  });

  describe('POST /pets/create', () => {
    it('cria pet válido (201)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
        color: 'preto',
        description: 'Cachorro amigável',
        species: 'dog',
      });

      expect(res.status).toBe(201);
      expect(res.body.newPet).toHaveProperty('_id');
      expect(res.body.newPet.name).toBe('Rex');
    });

    it('rejeita criação sem nome (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        age: 3,
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita criação sem idade (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita criação sem peso (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita criação sem cor (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
      });

      expect(res.status).toBe(422);
    });

    it('rejeita espécie inválida (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
        color: 'preto',
        species: 'dragon',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita criação sem imagens (422)', async () => {
      mockUploadHolder.value = null;

      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita idade fora do range (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 100,
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita peso fora do range (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 500,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita nome muito curto (422)', async () => {
      const res = await request(app).post('/pets/create').send({
        name: 'R',
        age: 3,
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(422);
    });

    it('aceita múltiplas imagens (201)', async () => {
      mockUploadHolder.value = [
        { filename: 'pet1.jpg' },
        { filename: 'pet2.jpg' },
        { filename: 'pet3.jpg' },
      ];

      const res = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
        color: 'preto',
      });

      expect(res.status).toBe(201);
      expect(res.body.newPet.images).toHaveLength(3);
    });
  });

  describe('GET /pets', () => {
    it('lista todos os pets (200)', async () => {
      seedPet({ _id: '507f1f77bcf86cd799439101', name: 'Rex' });
      seedPet({ _id: '507f1f77bcf86cd799439102', name: 'Mia' });

      const res = await request(app).get('/pets');

      expect(res.status).toBe(200);
      expect(res.body.pets).toHaveLength(2);
    });

    it('retorna lista vazia quando não há pets (200)', async () => {
      const res = await request(app).get('/pets');

      expect(res.status).toBe(200);
      expect(res.body.pets).toEqual([]);
    });
  });

  describe('GET /pets/mypets', () => {
    it('lista apenas pets do usuário logado (200)', async () => {
      seedPet({
        _id: '507f1f77bcf86cd799439101',
        name: 'Rex',
        user: { _id: OWNER_ID, name: 'Owner' },
      });
      seedPet({
        _id: '507f1f77bcf86cd799439102',
        name: 'Outro',
        user: { _id: OTHER_USER_ID, name: 'Outro' },
      });

      const res = await request(app).get('/pets/mypets');

      expect(res.status).toBe(200);
      expect(res.body.pets).toHaveLength(1);
      expect(res.body.pets[0].name).toBe('Rex');
    });

    it('retorna lista vazia quando o usuário não tem pets (200)', async () => {
      seedPet({
        _id: '507f1f77bcf86cd799439101',
        user: { _id: OTHER_USER_ID, name: 'Outro' },
      });

      const res = await request(app).get('/pets/mypets');

      expect(res.status).toBe(200);
      expect(res.body.pets).toEqual([]);
    });
  });

  describe('GET /pets/myadoptions', () => {
    it('lista apenas pets adotados pelo usuário logado (200)', async () => {
      seedPet({
        _id: '507f1f77bcf86cd799439101',
        adopter: { _id: OWNER_ID, name: 'Owner' },
      });
      seedPet({
        _id: '507f1f77bcf86cd799439102',
        adopter: { _id: OTHER_USER_ID, name: 'Outro' },
      });

      const res = await request(app).get('/pets/myadoptions');

      expect(res.status).toBe(200);
      expect(res.body.pets).toHaveLength(1);
    });

    it('retorna lista vazia quando o usuário não tem adoções (200)', async () => {
      const res = await request(app).get('/pets/myadoptions');

      expect(res.status).toBe(200);
      expect(res.body.pets).toEqual([]);
    });
  });

  describe('GET /pets/:id', () => {
    it('retorna pet existente (200)', async () => {
      seedPet();

      const res = await request(app).get(`/pets/${PET_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.pet._id).toBe(PET_ID);
    });

    it('retorna 422 com id inválido', async () => {
      const res = await request(app).get('/pets/id-invalido');
      expect(res.status).toBe(422);
    });

    it('retorna 404 quando pet não existe', async () => {
      const res = await request(app).get(`/pets/${NONEXISTENT_PET_ID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /pets/:id', () => {
    it('remove pet do próprio usuário (200)', async () => {
      seedPet();

      const res = await request(app).delete(`/pets/${PET_ID}`);

      expect(res.status).toBe(200);
      expect(mockPetStore.has(PET_ID)).toBe(false);
    });

    it('retorna 422 com id inválido', async () => {
      const res = await request(app).delete('/pets/id-invalido');
      expect(res.status).toBe(422);
    });

    it('retorna 404 quando pet não existe', async () => {
      const res = await request(app).delete(`/pets/${NONEXISTENT_PET_ID}`);
      expect(res.status).toBe(404);
    });

    it('rejeita remoção por quem não é o dono (404)', async () => {
      seedPet({ user: { _id: OTHER_USER_ID, name: 'Outro' } });

      const res = await request(app).delete(`/pets/${PET_ID}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /pets/:id', () => {
    it('atualiza pet com todos os campos (200)', async () => {
      seedPet();

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        name: 'Rex II',
        age: 5,
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(200);
    });

    it('retorna 404 quando pet não existe', async () => {
      const res = await request(app).patch(`/pets/${NONEXISTENT_PET_ID}`).send({
        name: 'Rex',
        age: 5,
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(404);
    });

    it('rejeita edição por quem não é o dono (404)', async () => {
      seedPet({ user: { _id: OTHER_USER_ID, name: 'Outro' } });

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        name: 'Rex II',
        age: 5,
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(404);
    });

    it('rejeita atualização sem nome (422)', async () => {
      seedPet();

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        age: 5,
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita atualização sem idade (422)', async () => {
      seedPet();

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        name: 'Rex',
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita atualização sem available (422)', async () => {
      seedPet();

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        name: 'Rex',
        age: 5,
        weight: 15,
        color: 'marrom',
      });

      expect(res.status).toBe(422);
    });

    it('rejeita atualização sem imagens (422)', async () => {
      seedPet();
      mockUploadHolder.value = null;

      const res = await request(app).patch(`/pets/${PET_ID}`).send({
        name: 'Rex',
        age: 5,
        weight: 15,
        color: 'marrom',
        available: 'true',
      });

      expect(res.status).toBe(422);
    });
  });

  describe('PATCH /pets/schedule/:id', () => {
    it('agenda visita em pet de outro usuário (200)', async () => {
      seedPet({ user: { _id: OWNER_ID, name: 'Owner', phone: '11999999999' } });
      setCurrentUser({
        _id: ADOPTER_ID,
        name: 'Adopter',
        image: 'a.png',
        equals: (other) => String(ADOPTER_ID) === String(other),
      });

      const pet = mockPetStore.get(PET_ID);
      pet.user._id = { equals: (other) => String(OWNER_ID) === String(other) };

      const res = await request(app).patch(`/pets/schedule/${PET_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/agendada/i);
    });

    it('rejeita agendar visita com o próprio pet (422)', async () => {
      seedPet();

      const pet = mockPetStore.get(PET_ID);
      pet.user._id = { equals: (other) => String(OWNER_ID) === String(other) };

      setCurrentUser({
        _id: OWNER_ID,
        name: 'Owner',
        image: 'o.png',
        equals: (other) => String(OWNER_ID) === String(other),
      });

      const res = await request(app).patch(`/pets/schedule/${PET_ID}`);

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/próprio/i);
    });

    it('rejeita segundo agendamento do mesmo adotante (422)', async () => {
      seedPet({
        user: { _id: OWNER_ID, name: 'Owner', phone: '11999999999' },
        adopter: {
          _id: { equals: (other) => String(ADOPTER_ID) === String(other) },
          name: 'Adopter',
        },
      });

      const pet = mockPetStore.get(PET_ID);
      pet.user._id = { equals: (other) => String(OWNER_ID) === String(other) };

      setCurrentUser({
        _id: ADOPTER_ID,
        name: 'Adopter',
        image: 'a.png',
        equals: (other) => String(ADOPTER_ID) === String(other),
      });

      const res = await request(app).patch(`/pets/schedule/${PET_ID}`);

      expect(res.status).toBe(422);
      expect(res.body.message).toMatch(/já agendou/i);
    });
  });

  describe('PATCH /pets/conclude/:id', () => {
    it('conclui adoção marcando available=false (200)', async () => {
      seedPet({ available: true });

      const res = await request(app).patch(`/pets/conclude/${PET_ID}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/finalizado/i);

      const pet = mockPetStore.get(PET_ID);
      expect(pet.available).toBe(false);
    });
  });

  describe('Fluxo completo: criar → buscar → atualizar → remover', () => {
    it('executa ciclo de vida do pet', async () => {
      const createRes = await request(app).post('/pets/create').send({
        name: 'Rex',
        age: 3,
        weight: 12,
        color: 'preto',
        species: 'dog',
      });
      expect(createRes.status).toBe(201);
      const petId = createRes.body.newPet._id;

      const getRes = await request(app).get(`/pets/${petId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.pet.name).toBe('Rex');

      const updateRes = await request(app).patch(`/pets/${petId}`).send({
        name: 'Rex II',
        age: 4,
        weight: 14,
        color: 'preto e branco',
        available: 'true',
      });
      expect(updateRes.status).toBe(200);

      const deleteRes = await request(app).delete(`/pets/${petId}`);
      expect(deleteRes.status).toBe(200);

      const afterDeleteRes = await request(app).get(`/pets/${petId}`);
      expect(afterDeleteRes.status).toBe(404);
    });
  });
});