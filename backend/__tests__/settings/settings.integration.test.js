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

jest.mock('../../helpers/get-token', () => () => 'fake-token');

jest.mock('../../helpers/get-user-by-token', () =>
  jest.fn(async () => ({
    _id: '507f1f77bcf86cd799439011',
    name: 'Usuário Logado',
  }))
);

jest.mock('../../helpers/check-token', () => (req, res, next) => next());

const mockSettingsStore = new Map();
let mockSettingsSeq = 0;

function generateSettingsId() {
  return (++mockSettingsSeq).toString(16).padStart(24, '0');
}

jest.mock('../../models/Settings', () => {
  function SettingsMock(data) {
    Object.assign(this, data);
    this.save = jest.fn(async () => {
      const _id = (++mockSettingsSeq).toString(16).padStart(24, '0');
      const saved = { _id, ...data, createdAt: new Date() };
      mockSettingsStore.set(_id, saved);
      return saved;
    });
  }
  SettingsMock.findOne = jest.fn(async (query = {}) => {
    return (
      Array.from(mockSettingsStore.values()).find((s) => {
        const userMatches =
          !query['user._id'] || String(s.user._id) === String(query['user._id']);
        const notDeleted =
          query.deletedAt === undefined ||
          query.deletedAt === null
            ? !s.deletedAt
            : true;
        return userMatches && notDeleted;
      }) || null
    );
  });
  SettingsMock.findOneAndUpdate = jest.fn(async (query = {}, data = {}) => {
    const found = Array.from(mockSettingsStore.values()).find(
      (s) =>
        (!query['user._id'] || String(s.user._id) === String(query['user._id'])) &&
        !s.deletedAt
    );
    if (!found) return null;
    const updated = { ...found, ...data };
    mockSettingsStore.set(found._id, updated);
    return updated;
  });
  return SettingsMock;
});

const SettingsRouters = require('../../routers/SettingsRouters');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/settings', SettingsRouters);
  return app;
}

describe('Settings — testes de integração', () => {
  let app;

  beforeEach(() => {
    mockSettingsStore.clear();
    mockSettingsSeq = 0;
    app = buildApp();
  });

  afterAll(() => {
    jest.resetModules();
  });

  function seedSettings(overrides = {}) {
    const _id = overrides._id || generateSettingsId();
    const settings = {
      _id,
      user: { _id: USER_LOGGED_ID, name: 'Usuário Logado' },
      theme: 'system',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      notifications: {
        email: true,
        push: true,
        sms: false,
        quietHours: { enabled: false, start: '22:00', end: '08:00' },
      },
      accessibility: { fontSize: 'medium', highContrast: false },
      deletedAt: null,
      createdAt: new Date(),
      ...overrides,
    };
    mockSettingsStore.set(_id, settings);
    return settings;
  }

  describe('POST /settings', () => {
    it('cria configurações com payload mínimo (201)', async () => {
      const res = await request(app).post('/settings').send({});

      expect(res.status).toBe(201);
      expect(res.body.data).toHaveProperty('_id');
      expect(res.body.data.theme).toBe('system');
      expect(res.body.data.language).toBe('pt-BR');
    });

    it('cria configurações com todos os campos preenchidos (201)', async () => {
      const res = await request(app)
        .post('/settings')
        .send({
          theme: 'dark',
          language: 'en-US',
          timezone: 'UTC',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '12h',
          notifications: {
            email: false,
            push: true,
            sms: true,
            quietHours: { enabled: true, start: '23:00', end: '07:00' },
          },
          accessibility: { fontSize: 'large', highContrast: true },
        });

      expect(res.status).toBe(201);
      expect(res.body.data.theme).toBe('dark');
      expect(res.body.data.language).toBe('en-US');
      expect(res.body.data.notifications.sms).toBe(true);
      expect(res.body.data.accessibility.highContrast).toBe(true);
    });

    it('rejeita theme inválido (422)', async () => {
      const res = await request(app).post('/settings').send({ theme: 'colorful' });
      expect(res.status).toBe(422);
    });

    it('rejeita language inválida (422)', async () => {
      const res = await request(app).post('/settings').send({ language: 'fr-FR' });
      expect(res.status).toBe(422);
    });

    it('rejeita dateFormat inválido (422)', async () => {
      const res = await request(app).post('/settings').send({ dateFormat: 'DD-MM-YY' });
      expect(res.status).toBe(422);
    });

    it('rejeita timeFormat inválido (422)', async () => {
      const res = await request(app).post('/settings').send({ timeFormat: '36h' });
      expect(res.status).toBe(422);
    });

    it('rejeita quietHours.start fora do formato HH:MM (422)', async () => {
      const res = await request(app)
        .post('/settings')
        .send({
          notifications: { quietHours: { start: '25:99', end: '08:00' } },
        });
      expect(res.status).toBe(422);
    });

    it('rejeita notification key desconhecida (422)', async () => {
      const res = await request(app)
        .post('/settings')
        .send({ notifications: { whatsapp: true } });
      expect(res.status).toBe(422);
    });

    it('rejeita accessibility.fontSize inválido (422)', async () => {
      const res = await request(app)
        .post('/settings')
        .send({ accessibility: { fontSize: 'huge' } });
      expect(res.status).toBe(422);
    });

    it('rejeita accessibility.highContrast como string (422)', async () => {
      const res = await request(app)
        .post('/settings')
        .send({ accessibility: { highContrast: 'yes' } });
      expect(res.status).toBe(422);
    });

    it('rejeita criação duplicada para mesmo usuário (409)', async () => {
      seedSettings();
      const res = await request(app).post('/settings').send({ theme: 'dark' });
      expect(res.status).toBe(409);
    });

    it('aplica defaults quando campos opcionais não vêm', async () => {
      const res = await request(app).post('/settings').send({});

      expect(res.status).toBe(201);
      expect(res.body.data.timezone).toBe('America/Sao_Paulo');
      expect(res.body.data.dateFormat).toBe('DD/MM/YYYY');
      expect(res.body.data.timeFormat).toBe('24h');
      expect(res.body.data.notifications.email).toBe(true);
      expect(res.body.data.notifications.sms).toBe(false);
      expect(res.body.data.accessibility.fontSize).toBe('medium');
    });
  });

  describe('GET /settings', () => {
    it('retorna configurações existentes do usuário (200)', async () => {
      seedSettings({ theme: 'dark', language: 'en-US' });

      const res = await request(app).get('/settings');

      expect(res.status).toBe(200);
      expect(res.body.settings.theme).toBe('dark');
      expect(res.body.settings.language).toBe('en-US');
    });

    it('retorna 404 quando o usuário ainda não criou configurações', async () => {
      const res = await request(app).get('/settings');
      expect(res.status).toBe(404);
    });

    it('não retorna configurações de outro usuário (404)', async () => {
      seedSettings({
        user: { _id: '507f1f77bcf86cd799439099', name: 'Outro' },
      });

      const res = await request(app).get('/settings');
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /settings', () => {
    it('atualiza apenas o theme (200)', async () => {
      seedSettings();

      const res = await request(app).patch('/settings').send({ theme: 'dark' });

      expect(res.status).toBe(200);
      expect(res.body.data.theme).toBe('dark');
      expect(res.body.data.language).toBe('pt-BR');
    });

    it('atualiza apenas a language (200)', async () => {
      seedSettings();

      const res = await request(app).patch('/settings').send({ language: 'es-ES' });

      expect(res.status).toBe(200);
      expect(res.body.data.language).toBe('es-ES');
    });

    it('mescla notifications mantendo valores não enviados (200)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ notifications: { sms: true } });

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.sms).toBe(true);
      expect(res.body.data.notifications.email).toBe(true);
      expect(res.body.data.notifications.push).toBe(true);
    });

    it('mescla quietHours mantendo campos não enviados (200)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ notifications: { quietHours: { enabled: true } } });

      expect(res.status).toBe(200);
      expect(res.body.data.notifications.quietHours.enabled).toBe(true);
      expect(res.body.data.notifications.quietHours.start).toBe('22:00');
      expect(res.body.data.notifications.quietHours.end).toBe('08:00');
    });

    it('mescla accessibility mantendo campos não enviados (200)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ accessibility: { highContrast: true } });

      expect(res.status).toBe(200);
      expect(res.body.data.accessibility.highContrast).toBe(true);
      expect(res.body.data.accessibility.fontSize).toBe('medium');
    });

    it('retorna 404 quando o usuário ainda não tem configurações', async () => {
      const res = await request(app).patch('/settings').send({ theme: 'dark' });
      expect(res.status).toBe(404);
    });

    it('rejeita atualização com theme inválido (422)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ theme: 'colorful' });

      expect(res.status).toBe(422);
    });

    it('rejeita atualização com quietHours.end fora do formato (422)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ notifications: { quietHours: { end: '99:99' } } });

      expect(res.status).toBe(422);
    });

    it('rejeita atualização com fontSize inválido (422)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ accessibility: { fontSize: 'enorme' } });

      expect(res.status).toBe(422);
    });

    it('atualiza timezone trimando espaços (200)', async () => {
      seedSettings();

      const res = await request(app)
        .patch('/settings')
        .send({ timezone: '  America/New_York  ' });

      expect(res.status).toBe(200);
      expect(res.body.data.timezone).toBe('America/New_York');
    });
  });

  describe('DELETE /settings', () => {
    it('remove configurações existentes (200)', async () => {
      seedSettings();

      const res = await request(app).delete('/settings');

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removidas/i);
    });

    it('retorna 404 quando o usuário não tem configurações', async () => {
      const res = await request(app).delete('/settings');
      expect(res.status).toBe(404);
    });

    it('após delete, GET retorna 404', async () => {
      seedSettings();

      await request(app).delete('/settings');
      const res = await request(app).get('/settings');

      expect(res.status).toBe(404);
    });

    it('após delete, PATCH retorna 404', async () => {
      seedSettings();

      await request(app).delete('/settings');
      const res = await request(app).patch('/settings').send({ theme: 'dark' });

      expect(res.status).toBe(404);
    });

    it('após delete, segundo DELETE retorna 404', async () => {
      seedSettings();

      await request(app).delete('/settings');
      const res = await request(app).delete('/settings');

      expect(res.status).toBe(404);
    });
  });

  describe('Fluxo completo: criar → buscar → atualizar → remover', () => {
    it('executa ciclo de vida completo das configurações', async () => {
      const createRes = await request(app).post('/settings').send({
        theme: 'light',
        language: 'pt-BR',
      });
      expect(createRes.status).toBe(201);

      const getRes = await request(app).get('/settings');
      expect(getRes.status).toBe(200);
      expect(getRes.body.settings.theme).toBe('light');

      const patchRes = await request(app).patch('/settings').send({
        theme: 'dark',
        accessibility: { highContrast: true },
      });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.theme).toBe('dark');
      expect(patchRes.body.data.accessibility.highContrast).toBe(true);

      const deleteRes = await request(app).delete('/settings');
      expect(deleteRes.status).toBe(200);

      const finalGetRes = await request(app).get('/settings');
      expect(finalGetRes.status).toBe(404);
    });

    it('permite criar novamente após delete (201)', async () => {
      await request(app).post('/settings').send({});
      await request(app).delete('/settings');

      const res = await request(app).post('/settings').send({ theme: 'dark' });

      expect(res.status).toBe(201);
      expect(res.body.data.theme).toBe('dark');
    });
  });
});