const { describe, it, expect, beforeEach } = require('@jest/globals');

const OWNER_ID = 'owner-1';
const ADOPTER_ID = 'adopter-1';
const OTHER_USER_ID = 'other-1';
const PET_ID = '507f1f77bcf86cd799439011';

const mockUserHolder = {
  value: { _id: OWNER_ID, name: 'Owner', image: 'avatar.png', phone: '11999999999' },
};

jest.mock('../../helpers/get-token', () => () => 'fake-token');

jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => mockUserHolder.value)
);

jest.mock('../../models/Pet', () => {
  const PetMock = jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    if (!this._id) this._id = 'generated-id';
    this.save = jest.fn();
  });
  PetMock.find = jest.fn();
  PetMock.findOne = jest.fn();
  PetMock.findByIdAndUpdate = jest.fn();
  PetMock.findByIdAndRemove = jest.fn();
  return PetMock;
});

const Pet = require('../../models/Pet');
const PetController = require('../../controllers/PetController');

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = ({ body = {}, params = {}, files } = {}) => ({
  body,
  params,
  files,
});

const validBody = () => ({
  name: 'Rex',
  age: 3,
  weight: 12,
  color: 'preto',
  description: 'amigável',
  species: 'dog',
});

const validFiles = () => [{ filename: 'pet1.jpg' }];

function setCurrentUser(user) {
  mockUserHolder.value = user;
}

describe('PetController — testes unitários', () => {
 beforeEach(() => {
    jest.clearAllMocks();
    Pet.mockImplementation(function (data) {
      Object.assign(this, data);
      if (!this._id) this._id = 'generated-id';
      this.save = jest.fn(async () => ({ _id: this._id, ...data }));
    });
    setCurrentUser({ _id: OWNER_ID, name: 'Owner', image: 'avatar.png', phone: '11999999999' });
  });

  describe('create', () => {
    it('retorna 201 quando dados válidos', async () => {
      const req = makeReq({ body: validBody(), files: validFiles() });
      const res = makeRes();

      Pet.mockImplementation(function (data) {
        Object.assign(this, data, { _id: PET_ID });
        this.save = jest.fn(async () => ({ _id: PET_ID, ...data }));
      });

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('retorna 422 quando nome ausente', async () => {
      const req = makeReq({
        body: { ...validBody(), name: undefined },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando idade ausente', async () => {
      const req = makeReq({
        body: { ...validBody(), age: undefined },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando peso ausente', async () => {
      const req = makeReq({
        body: { ...validBody(), weight: undefined },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando cor ausente', async () => {
      const req = makeReq({
        body: { ...validBody(), color: undefined },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando imagens ausentes', async () => {
      const req = makeReq({ body: validBody(), files: undefined });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando species inválida', async () => {
      const req = makeReq({
        body: { ...validBody(), species: 'dragon' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 500 quando o save lança erro', async () => {
      Pet.mockImplementation(function (data) {
        Object.assign(this, data);
        this.save = jest.fn(async () => {
          throw new Error('DB down');
        });
        this.images = [];
      });

      const req = makeReq({ body: validBody(), files: validFiles() });
      const res = makeRes();

      await PetController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAll', () => {
    it('retorna 200 com lista de pets', async () => {
      const pets = [{ _id: 'p1', name: 'Rex' }, { _id: 'p2', name: 'Mia' }];
      Pet.find.mockReturnValue({ sort: jest.fn().mockResolvedValue(pets) });

      const res = makeRes();
      await PetController.getAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pets });
    });

    it('retorna 200 com lista vazia quando não há pets', async () => {
      Pet.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([]) });

      const res = makeRes();
      await PetController.getAll(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pets: [] });
    });
  });

  describe('getAllUserPets', () => {
    it('retorna apenas pets do usuário logado', async () => {
      const pets = [{ _id: 'p1', name: 'Rex' }];
      Pet.find.mockResolvedValue(pets);

      const res = makeRes();
      await PetController.getAllUserPets(makeReq(), res);

      expect(Pet.find).toHaveBeenCalledWith({ 'user._id': OWNER_ID });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pets });
    });

    it('retorna lista vazia quando o usuário não tem pets', async () => {
      Pet.find.mockResolvedValue([]);

      const res = makeRes();
      await PetController.getAllUserPets(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pets: [] });
    });
  });

  describe('getAllUserAdoptions', () => {
    it('retorna apenas adoções do usuário logado', async () => {
      const pets = [{ _id: 'p1', name: 'Adotado' }];
      Pet.find.mockResolvedValue(pets);

      const res = makeRes();
      await PetController.getAllUserAdoptions(makeReq(), res);

      expect(Pet.find).toHaveBeenCalledWith({ 'adopter._id': OWNER_ID });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna lista vazia quando o usuário não tem adoções', async () => {
      Pet.find.mockResolvedValue([]);

      const res = makeRes();
      await PetController.getAllUserAdoptions(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ pets: [] });
    });
  });

  describe('getPetById', () => {
    it('retorna 200 quando pet existe', async () => {
      Pet.findOne.mockResolvedValue({ _id: PET_ID, name: 'Rex' });

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.getPetById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 quando o id é inválido', async () => {
      const req = makeReq({ params: { id: 'id-invalido' } });
      const res = makeRes();

      await PetController.getPetById(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 404 quando pet não existe', async () => {
      Pet.findOne.mockResolvedValue(null);

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.getPetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('removePetById', () => {
    it('retorna 200 quando dono remove o próprio pet', async () => {
      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: { toString: () => OWNER_ID } },
      });
      Pet.findByIdAndRemove.mockResolvedValue(true);

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.removePetById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 422 quando o id é inválido', async () => {
      const req = makeReq({ params: { id: 'invalid' } });
      const res = makeRes();

      await PetController.removePetById(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 404 quando pet não existe', async () => {
      Pet.findOne.mockResolvedValue(null);

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.removePetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 404 quando quem tenta remover não é o dono', async () => {
      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: { toString: () => OTHER_USER_ID } },
      });

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.removePetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updatePet', () => {
    function petOwnedByCurrent() {
      return {
        _id: PET_ID,
        user: { _id: { toString: () => OWNER_ID } },
      };
    }

    it('retorna 200 quando dados válidos e usuário é o dono', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());
      Pet.findByIdAndUpdate.mockResolvedValue(true);

      const req = makeReq({
        params: { id: PET_ID },
        body: {
          name: 'Rex',
          age: 3,
          weight: 12,
          color: 'preto',
          available: 'true',
        },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('retorna 404 quando pet não existe', async () => {
      Pet.findOne.mockResolvedValue(null);

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, weight: 12, color: 'preto', available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 404 quando quem tenta editar não é o dono', async () => {
      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: { toString: () => OTHER_USER_ID } },
      });

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, weight: 12, color: 'preto', available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 422 sem nome', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { age: 3, weight: 12, color: 'preto', available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 sem idade', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', weight: 12, color: 'preto', available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 sem peso', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, color: 'preto', available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 sem cor', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, weight: 12, available: 'true' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 sem imagens', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, weight: 12, color: 'preto', available: 'true' },
        files: undefined,
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 sem available', async () => {
      Pet.findOne.mockResolvedValue(petOwnedByCurrent());

      const req = makeReq({
        params: { id: PET_ID },
        body: { name: 'Rex', age: 3, weight: 12, color: 'preto' },
        files: validFiles(),
      });
      const res = makeRes();

      await PetController.updatePet(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });
  });

  describe('schedule', () => {
    function fakeIdEquals(value) {
      return { equals: (other) => String(value) === String(other) };
    }

    it('retorna 422 ao tentar agendar visita com o próprio pet', async () => {
      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: fakeIdEquals(OWNER_ID), name: 'Owner', phone: '11999' },
      });

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.schedule(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando o usuário já agendou esta visita antes', async () => {
      setCurrentUser({ _id: ADOPTER_ID, name: 'Adopter', image: 'a.png' });

      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: fakeIdEquals(OWNER_ID), name: 'Owner', phone: '11999' },
        adopter: { _id: fakeIdEquals(ADOPTER_ID), name: 'Adopter' },
      });

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.schedule(req, res);

      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 200 ao agendar visita com sucesso', async () => {
      setCurrentUser({ _id: ADOPTER_ID, name: 'Adopter', image: 'a.png' });

      Pet.findOne.mockResolvedValue({
        _id: PET_ID,
        user: { _id: fakeIdEquals(OWNER_ID), name: 'Owner', phone: '11999' },
      });
      Pet.findByIdAndUpdate.mockResolvedValue(true);

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.schedule(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('concludeAdoption', () => {
    it('retorna 200 marcando available=false', async () => {
      const pet = { _id: PET_ID, available: true };
      Pet.findOne.mockResolvedValue(pet);
      Pet.findByIdAndUpdate.mockResolvedValue(true);

      const req = makeReq({ params: { id: PET_ID } });
      const res = makeRes();

      await PetController.concludeAdoption(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(pet.available).toBe(false);
    });
  });
});