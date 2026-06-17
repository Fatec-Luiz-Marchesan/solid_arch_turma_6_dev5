const {
  describe,
  it,
  expect,
  beforeEach,
  afterAll,
} = require('@jest/globals');
const request = require('supertest');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () => async () => ({
  _id: 'user-test-id',
  name: 'Usuário Teste',
}));

const { buildTestApp } = require('../helpers/buildTestApp');
const BreedController = require('../../controllers/BreedController');

describe('Breed — testes de integração (avançado)', () => {
  let app;
  let repo;
  let store;
  let seq;

  beforeEach(() => {
    store = new Map();
    seq = 0;
    repo = {
      create: jest.fn(async (data) => {
        const _id = 'breed-' + ++seq;
        const breed = {
          _id,
          ...data,
          createdAt: new Date(Date.now() + seq),
        };
        store.set(_id, breed);
        return breed;
      }),
      findActive: jest.fn(async (query = {}, options = {}) => {
        let results = Array.from(store.values()).filter(
          (b) => !b.deletedAt && (!query.species || b.species === query.species)
        );

        const { skip = 0, limit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        results.sort((a, b) => {
          const av = a[sortBy];
          const bv = b[sortBy];
          if (av < bv) return sortOrder === 'asc' ? -1 : 1;
          if (av > bv) return sortOrder === 'asc' ? 1 : -1;
          return 0;
        });

        return results.slice(skip, limit ? skip + limit : undefined);
      }),
      countActive: jest.fn(async (query = {}) =>
        Array.from(store.values()).filter(
          (b) => !b.deletedAt && (!query.species || b.species === query.species)
        ).length
      ),
      findById: jest.fn(async (id) => store.get(id) || null),
      findByName: jest.fn(
        async (name) =>
          Array.from(store.values()).find(
            (b) =>
              !b.deletedAt &&
              String(b.name).toLowerCase() === String(name).toLowerCase()
          ) || null
      ),
      update: jest.fn(async (id, data) => {
        const cur = store.get(id);
        if (!cur) return null;
        const updated = { ...cur, ...data };
        store.set(id, updated);
        return updated;
      }),
    };

    app = buildTestApp({ breedRepository: repo });
  });

  afterAll(() => {
    BreedController.resetRepository();
  });

  async function seedBreeds(names, species = 'dog') {
    for (const name of names) {
      await request(app).post('/breeds').send({ name, species });
    }
  }

  describe('Paginação na listagem', () => {
    it('retorna a primeira página com limit=2 (200)', async () => {
      await seedBreeds(['Labrador', 'Pastor Alemão', 'Bulldog', 'Poodle']);

      const res = await request(app).get('/breeds?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.breeds).toHaveLength(2);
      expect(res.body.total).toBe(4);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(2);
      expect(res.body.totalPages).toBe(2);
    });

    it('retorna a segunda página com limit=2 (200)', async () => {
      await seedBreeds(['Labrador', 'Pastor Alemão', 'Bulldog', 'Poodle']);

      const res = await request(app).get('/breeds?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.breeds).toHaveLength(2);
      expect(res.body.page).toBe(2);
    });

    it('retorna lista vazia em página além do total (200)', async () => {
      await seedBreeds(['Labrador']);

      const res = await request(app).get('/breeds?page=5&limit=10');

      expect(res.status).toBe(200);
      expect(res.body.breeds).toHaveLength(0);
      expect(res.body.total).toBe(1);
    });

    it('rejeita page=0 (422)', async () => {
      const res = await request(app).get('/breeds?page=0');
      expect(res.status).toBe(422);
    });

    it('rejeita page negativa (422)', async () => {
      const res = await request(app).get('/breeds?page=-1');
      expect(res.status).toBe(422);
    });

    it('rejeita limit=0 (422)', async () => {
      const res = await request(app).get('/breeds?limit=0');
      expect(res.status).toBe(422);
    });

    it('rejeita limit acima do máximo permitido (422)', async () => {
      const res = await request(app).get('/breeds?limit=999999');
      expect(res.status).toBe(422);
    });

    it('calcula totalPages corretamente com divisão não exata', async () => {
      await seedBreeds(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'Gg']);

      const res = await request(app).get('/breeds?limit=3');

      expect(res.status).toBe(200);
      expect(res.body.totalPages).toBe(3);
      expect(res.body.total).toBe(7);
    });
  });

  describe('Ordenação na listagem', () => {
    it('ordena por nome ascendente quando sortBy=name&sortOrder=asc', async () => {
      await seedBreeds(['Zorro', 'Akita', 'Maltês']);

      const res = await request(app).get('/breeds?sortBy=name&sortOrder=asc');

      expect(res.status).toBe(200);
      const names = res.body.breeds.map((b) => b.name);
      expect(names).toEqual(['Akita', 'Maltês', 'Zorro']);
    });

    it('ordena por nome descendente quando sortBy=name&sortOrder=desc', async () => {
      await seedBreeds(['Zorro', 'Akita', 'Maltês']);

      const res = await request(app).get('/breeds?sortBy=name&sortOrder=desc');

      expect(res.status).toBe(200);
      const names = res.body.breeds.map((b) => b.name);
      expect(names).toEqual(['Zorro', 'Maltês', 'Akita']);
    });

    it('ordena por createdAt desc por padrão (mais recentes primeiro)', async () => {
      await seedBreeds(['Primeira', 'Segunda', 'Terceira']);

      const res = await request(app).get('/breeds');

      expect(res.status).toBe(200);
      expect(res.body.breeds[0].name).toBe('Terceira');
      expect(res.body.breeds[2].name).toBe('Primeira');
    });

    it('ignora sortBy desconhecido e usa o padrão (200)', async () => {
      await seedBreeds(['Labrador', 'Pastor Alemão']);

      const res = await request(app).get('/breeds?sortBy=campo_invalido');

      expect(res.status).toBe(200);
      expect(res.body.breeds).toHaveLength(2);
    });
  });

  describe('Validações campo-a-campo no POST', () => {
    it('rejeita description acima de 500 caracteres (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          description: 'x'.repeat(501),
        });
      expect(res.status).toBe(422);
    });

    it('aceita description com exatamente 500 caracteres (201)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          description: 'x'.repeat(500),
        });
      expect(res.status).toBe(201);
    });

    it('rejeita origin acima de 100 caracteres (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          origin: 'x'.repeat(101),
        });
      expect(res.status).toBe(422);
    });

    it('rejeita temperament com mais de 10 itens (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          temperament: Array(11).fill('calmo'),
        });
      expect(res.status).toBe(422);
    });

    it('rejeita temperament com item vazio (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          temperament: ['calmo', ''],
        });
      expect(res.status).toBe(422);
    });

    it('rejeita lifeExpectancy negativo (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          lifeExpectancy: -1,
        });
      expect(res.status).toBe(422);
    });

    it('rejeita lifeExpectancy acima de 50 (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          lifeExpectancy: 100,
        });
      expect(res.status).toBe(422);
    });

    it('aceita lifeExpectancy=0 (201)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          lifeExpectancy: 0,
        });
      expect(res.status).toBe(201);
    });

    it('aceita lifeExpectancy=50 (201)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          lifeExpectancy: 50,
        });
      expect(res.status).toBe(201);
    });

    it('rejeita lifeExpectancy como string (422)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({
          name: 'Teste',
          species: 'dog',
          lifeExpectancy: 'doze',
        });
      expect(res.status).toBe(422);
    });

    it('aceita name com exatamente 2 caracteres (201)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({ name: 'Sr', species: 'dog' });
      expect(res.status).toBe(201);
    });

    it('aceita name com exatamente 50 caracteres (201)', async () => {
      const res = await request(app)
        .post('/breeds')
        .send({ name: 'a'.repeat(50), species: 'dog' });
      expect(res.status).toBe(201);
    });
  });

  describe('Soft delete — consistência', () => {
    it('countActive não conta raças removidas', async () => {
      await seedBreeds(['Labrador', 'Bulldog', 'Poodle']);
      const listBefore = await request(app).get('/breeds');
      expect(listBefore.body.total).toBe(3);

      const breedId = listBefore.body.breeds[0]._id;
      await request(app).delete(`/breeds/${breedId}`);

      const listAfter = await request(app).get('/breeds');
      expect(listAfter.body.total).toBe(2);
    });

    it('raça removida não pode ser atualizada (404)', async () => {
      await request(app).post('/breeds').send({ name: 'Labrador', species: 'dog' });
      const created = Array.from(store.values())[0];

      await request(app).delete(`/breeds/${created._id}`);

      const res = await request(app)
        .patch(`/breeds/${created._id}`)
        .send({ name: 'Outro' });

      expect(res.status).toBe(404);
    });

    it('raça removida não pode ser deletada novamente (404)', async () => {
      await request(app).post('/breeds').send({ name: 'Labrador', species: 'dog' });
      const created = Array.from(store.values())[0];

      await request(app).delete(`/breeds/${created._id}`);

      const res = await request(app).delete(`/breeds/${created._id}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH parcial', () => {
    it('atualiza apenas description sem mexer nos outros campos (200)', async () => {
      await request(app).post('/breeds').send({
        name: 'Labrador',
        species: 'dog',
        size: 'large',
        origin: 'Canadá',
      });
      const breedId = Array.from(store.keys())[0];

      const res = await request(app)
        .patch(`/breeds/${breedId}`)
        .send({ description: 'Raça amigável e cheia de energia.' });

      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Raça amigável e cheia de energia.');
      expect(res.body.data.size).toBe('large');
      expect(res.body.data.origin).toBe('Canadá');
    });

    it('atualiza apenas hypoallergenic (200)', async () => {
      await request(app).post('/breeds').send({ name: 'Poodle', species: 'dog' });
      const breedId = Array.from(store.keys())[0];

      const res = await request(app)
        .patch(`/breeds/${breedId}`)
        .send({ hypoallergenic: true });

      expect(res.status).toBe(200);
      expect(res.body.data.hypoallergenic).toBe(true);
    });

    it('atualiza apenas size (200)', async () => {
      await request(app).post('/breeds').send({ name: 'Beagle', species: 'dog' });
      const breedId = Array.from(store.keys())[0];

      const res = await request(app)
        .patch(`/breeds/${breedId}`)
        .send({ size: 'small' });

      expect(res.status).toBe(200);
      expect(res.body.data.size).toBe('small');
    });

    it('rejeita PATCH com body vazio mantendo dados (200)', async () => {
      await request(app).post('/breeds').send({ name: 'Akita', species: 'dog' });
      const breedId = Array.from(store.keys())[0];

      const res = await request(app).patch(`/breeds/${breedId}`).send({});

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Akita');
    });
  });

  describe('Filtragem combinada', () => {
    it('filtra apenas raças ativas de uma espécie quando há removidas', async () => {
      await seedBreeds(['Labrador', 'Bulldog'], 'dog');
      await seedBreeds(['Persa'], 'cat');

      const breedsArr = Array.from(store.values());
      const dogToDelete = breedsArr.find((b) => b.species === 'dog');
      await request(app).delete(`/breeds/${dogToDelete._id}`);

      const res = await request(app).get('/breeds?species=dog');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.breeds[0].species).toBe('dog');
    });

    it('retorna lista vazia para species sem registros (200)', async () => {
      await seedBreeds(['Labrador'], 'dog');

      const res = await request(app).get('/breeds?species=reptile');

      expect(res.status).toBe(200);
      expect(res.body.breeds).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });

    it('aceita todas as espécies válidas: bird, reptile, other', async () => {
      const especies = ['bird', 'reptile', 'other'];
      for (const sp of especies) {
        const res = await request(app)
          .post('/breeds')
          .send({ name: `Teste-${sp}`, species: sp });
        expect(res.status).toBe(201);
      }

      const listRes = await request(app).get('/breeds');
      expect(listRes.body.total).toBe(3);
    });
  });

  describe('Casos de borda — IDs inválidos', () => {
    it('GET /breeds/:id com id inexistente retorna 404', async () => {
      const res = await request(app).get('/breeds/id-que-nao-existe');
      expect(res.status).toBe(404);
    });

    it('PATCH /breeds/:id com id inexistente retorna 404', async () => {
      const res = await request(app)
        .patch('/breeds/id-que-nao-existe')
        .send({ name: 'Novo' });
      expect(res.status).toBe(404);
    });

    it('DELETE /breeds/:id com id inexistente retorna 404', async () => {
      const res = await request(app).delete('/breeds/id-que-nao-existe');
      expect(res.status).toBe(404);
    });
  });

  describe('Fluxos extensos', () => {
    it('cria 5 raças, deleta 2, lista deve mostrar 3', async () => {
      await seedBreeds(['Labrador', 'Bulldog', 'Poodle', 'Beagle', 'Husky']);

      const ids = Array.from(store.keys()).slice(0, 2);
      await request(app).delete(`/breeds/${ids[0]}`);
      await request(app).delete(`/breeds/${ids[1]}`);

      const res = await request(app).get('/breeds');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(3);
    });

    it('cria, renomeia 3 vezes seguidas e mantém o último nome', async () => {
      await request(app).post('/breeds').send({ name: 'Original', species: 'dog' });
      const breedId = Array.from(store.keys())[0];

      await request(app).patch(`/breeds/${breedId}`).send({ name: 'Primeira' });
      await request(app).patch(`/breeds/${breedId}`).send({ name: 'Segunda' });
      const finalRes = await request(app)
        .patch(`/breeds/${breedId}`)
        .send({ name: 'Final' });

      expect(finalRes.status).toBe(200);
      expect(finalRes.body.data.name).toBe('Final');

      const getRes = await request(app).get(`/breeds/${breedId}`);
      expect(getRes.body.breed.name).toBe('Final');
    });

    it('paginação se ajusta após deletar registros', async () => {
      await seedBreeds(['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff']);

      let res = await request(app).get('/breeds?limit=2');
      expect(res.body.totalPages).toBe(3);

      const ids = Array.from(store.keys()).slice(0, 2);
      await request(app).delete(`/breeds/${ids[0]}`);
      await request(app).delete(`/breeds/${ids[1]}`);

      res = await request(app).get('/breeds?limit=2');
      expect(res.body.totalPages).toBe(2);
      expect(res.body.total).toBe(4);
    });
  });
});