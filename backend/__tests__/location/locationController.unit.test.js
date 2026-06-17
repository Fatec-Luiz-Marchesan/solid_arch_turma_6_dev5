const { describe, it, expect, beforeEach } = require('@jest/globals');

jest.mock('../../helpers/get-token', () => () => 'fake-token');
jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({ _id: 'user-1', name: 'Usuário Teste' }))
);
jest.mock('../../models/Location');

const LocationController = require('../../controllers/LocationController');
const Location = require('../../models/Location');

const VALID_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';
const NONEXISTENT_ID = '507f1f77bcf86cd799439099';

const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.json = jest.fn(() => res);
  return res;
};

const makeReq = (body = {}, params = {}, query = {}) => ({ body, params, query });

const baseLocation = (overrides = {}) => ({
  _id: VALID_ID,
  name: 'Casa',
  street: 'Rua A, 100',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01234-567',
  isPrimary: false,
  user: { _id: 'user-1', name: 'Usuário Teste' },
  ...overrides,
});

describe('LocationController — testes unitários (complementar)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Location.find = jest.fn();
    Location.findById = jest.fn();
    Location.findByIdAndUpdate = jest.fn();
    Location.findByIdAndDelete = jest.fn();
    Location.updateMany = jest.fn();
  });

  describe('create — branches adicionais', () => {
    it('retorna 422 quando estado tem mais de 2 letras', async () => {
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa',
          city: 'São Paulo',
          state: 'SPP',
          zipCode: '01234-567',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

    it('retorna 422 quando cidade ausente', async () => {
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa',
          state: 'SP',
          zipCode: '01234-567',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(422);
    });

 it('aceita CEP sem hífen (201)', async () => {
      Location.prototype.save = jest.fn().mockResolvedValue(baseLocation({ zipCode: '01234567' }));
      const res = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa',
          street: 'Rua A',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
        }),
        res
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('list — branches adicionais', () => {
    it('retorna 200 com lista vazia quando o usuário não tem locations', async () => {
      Location.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const res = makeRes();
      await LocationController.list(makeReq(), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ locations: [] });
    });

    it('passa o id do usuário logado para o repositório', async () => {
      Location.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([]),
      });

      const res = makeRes();
      await LocationController.list(makeReq(), res);

      expect(Location.find).toHaveBeenCalledWith({ 'user._id': 'user-1' });
    });
  });

  describe('getById — branches adicionais', () => {
    it('retorna 200 quando a location existe e pertence ao usuário', async () => {
      Location.findById.mockResolvedValue(baseLocation());

      const res = makeRes();
      await LocationController.getById(makeReq({}, { id: VALID_ID }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ location: expect.any(Object) })
      );
    });

    it('retorna 403 quando a location pertence a outro usuário', async () => {
      Location.findById.mockResolvedValue(
        baseLocation({ user: { _id: 'user-outro' } })
      );

      const res = makeRes();
      await LocationController.getById(makeReq({}, { id: VALID_ID }), res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    
  });

  describe('update', () => {
    it('retorna 200 ao atualizar uma location do próprio usuário', async () => {
      Location.findById.mockResolvedValue(baseLocation());
      Location.findByIdAndUpdate.mockResolvedValue(
        baseLocation({ name: 'Casa Nova' })
      );

      const res = makeRes();
      await LocationController.update(
        makeReq(
          {
            name: 'Casa Nova',
            street: 'Rua A',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
          },
          { id: VALID_ID }
        ),
        res
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/atualizada/i) })
      );
    });

    it('retorna 404 quando a location não existe', async () => {
      Location.findById.mockResolvedValue(null);

      const res = makeRes();
      await LocationController.update(
        makeReq({ name: 'Casa Nova' }, { id: NONEXISTENT_ID }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 403 quando a location pertence a outro usuário', async () => {
      Location.findById.mockResolvedValue(
        baseLocation({ user: { _id: 'user-outro' } })
      );

      const res = makeRes();
      await LocationController.update(
        makeReq({ name: 'Casa Nova' }, { id: VALID_ID }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('retorna 422 ao atualizar com estado inválido', async () => {
      Location.findById.mockResolvedValue(baseLocation());

      const res = makeRes();
      await LocationController.update(
        makeReq({ state: 'INVALIDO' }, { id: VALID_ID }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(422);
    });

    
  });

  describe('setPrimary', () => {
    it('retorna 200 ao definir como primária', async () => {
      Location.findById.mockResolvedValue(baseLocation());
      Location.updateMany.mockResolvedValue({ modifiedCount: 1 });
      Location.findByIdAndUpdate.mockResolvedValue(
        baseLocation({ isPrimary: true })
      );

      const res = makeRes();
      await LocationController.setPrimary(makeReq({}, { id: VALID_ID }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringMatching(/principal/i) })
      );
    });

    it('retorna 404 quando a location não existe', async () => {
      Location.findById.mockResolvedValue(null);

      const res = makeRes();
      await LocationController.setPrimary(
        makeReq({}, { id: NONEXISTENT_ID }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('retorna 403 quando a location pertence a outro usuário', async () => {
      Location.findById.mockResolvedValue(
        baseLocation({ user: { _id: 'user-outro' } })
      );

      const res = makeRes();
      await LocationController.setPrimary(
        makeReq({}, { id: VALID_ID }),
        res
      );

      expect(res.status).toHaveBeenCalledWith(403);
    });

    

    it('desmarca outras locations como primárias antes de definir nova', async () => {
      Location.findById.mockResolvedValue(baseLocation());
      Location.updateMany.mockResolvedValue({ modifiedCount: 2 });
      Location.findByIdAndUpdate.mockResolvedValue(
        baseLocation({ isPrimary: true })
      );

      const res = makeRes();
      await LocationController.setPrimary(makeReq({}, { id: VALID_ID }), res);

      expect(Location.updateMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('delete — branches adicionais', () => {
    it('retorna 200 ao deletar location do próprio usuário', async () => {
      Location.findById.mockResolvedValue(baseLocation());
      Location.findByIdAndDelete.mockResolvedValue(true);

      const res = makeRes();
      await LocationController.delete(makeReq({}, { id: VALID_ID }), res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.any(String) })
      );
    });

    it('retorna 403 quando a location pertence a outro usuário', async () => {
      Location.findById.mockResolvedValue(
        baseLocation({ user: { _id: 'user-outro' } })
      );

      const res = makeRes();
      await LocationController.delete(makeReq({}, { id: VALID_ID }), res);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    
  });

  describe('Cenários combinados', () => {
    it('o fluxo create → update → setPrimary → delete não vaza mocks entre etapas', async () => {
      Location.prototype.save = jest.fn().mockResolvedValue(baseLocation());
      const createRes = makeRes();
      await LocationController.create(
        makeReq({
          name: 'Casa',
          street: 'Rua A',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
        }),
        createRes
      );
      expect(createRes.status).toHaveBeenCalledWith(201);

      Location.findById.mockResolvedValue(baseLocation());
      Location.findByIdAndUpdate.mockResolvedValue(
        baseLocation({ name: 'Casa Editada' })
      );
      const updateRes = makeRes();
      await LocationController.update(
        makeReq(
          {
            name: 'Casa Editada',
            street: 'Rua A',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01234-567',
          },
          { id: VALID_ID }
        ),
        updateRes
      );
      expect(updateRes.status).toHaveBeenCalledWith(200);

      Location.updateMany.mockResolvedValue({ modifiedCount: 1 });
      Location.findByIdAndUpdate.mockResolvedValue(
        baseLocation({ isPrimary: true })
      );
      const setPrimaryRes = makeRes();
      await LocationController.setPrimary(
        makeReq({}, { id: VALID_ID }),
        setPrimaryRes
      );
      expect(setPrimaryRes.status).toHaveBeenCalledWith(200);

      Location.findByIdAndDelete.mockResolvedValue(true);
      const deleteRes = makeRes();
      await LocationController.delete(
        makeReq({}, { id: VALID_ID }),
        deleteRes
      );
      expect(deleteRes.status).toHaveBeenCalledWith(200);
    });
  });
});