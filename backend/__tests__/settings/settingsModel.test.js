const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => require('mongoose'));

const Settings = require('../../models/Settings');

const validData = {
  user: { _id: 'u1', name: 'Ana' },
};

describe('Settings Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('aceita dados válidos (só user)', () => {
      expect(new Settings(validData).validateSync()).toBeUndefined();
    });

    it('rejeita sem user', () => {
      const s = new Settings({});
      expect(s.validateSync().errors.user).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('theme default system', () => {
      expect(new Settings(validData).theme).toBe('system');
    });

    it('language default pt-BR', () => {
      expect(new Settings(validData).language).toBe('pt-BR');
    });

    it('timezone default America/Sao_Paulo', () => {
      expect(new Settings(validData).timezone).toBe('America/Sao_Paulo');
    });

    it('dateFormat default DD/MM/YYYY', () => {
      expect(new Settings(validData).dateFormat).toBe('DD/MM/YYYY');
    });

    it('timeFormat default 24h', () => {
      expect(new Settings(validData).timeFormat).toBe('24h');
    });

    it('notifications.email default true', () => {
      expect(new Settings(validData).notifications.email).toBe(true);
    });

    it('notifications.push default true', () => {
      expect(new Settings(validData).notifications.push).toBe(true);
    });

    it('notifications.sms default false', () => {
      expect(new Settings(validData).notifications.sms).toBe(false);
    });

    it('quietHours.enabled default false', () => {
      expect(new Settings(validData).notifications.quietHours.enabled).toBe(false);
    });

    it('quietHours.start default 22:00', () => {
      expect(new Settings(validData).notifications.quietHours.start).toBe('22:00');
    });

    it('quietHours.end default 08:00', () => {
      expect(new Settings(validData).notifications.quietHours.end).toBe('08:00');
    });

    it('accessibility.fontSize default medium', () => {
      expect(new Settings(validData).accessibility.fontSize).toBe('medium');
    });

    it('accessibility.highContrast default false', () => {
      expect(new Settings(validData).accessibility.highContrast).toBe(false);
    });

    it('deletedAt default null', () => {
      expect(new Settings(validData).deletedAt).toBeNull();
    });
  });

  describe('enums', () => {
    it('rejeita theme fora do enum', () => {
      expect(new Settings({ ...validData, theme: 'neon' }).validateSync()).toBeDefined();
    });

    it('aceita theme dark', () => {
      expect(new Settings({ ...validData, theme: 'dark' }).validateSync()).toBeUndefined();
    });

    it('aceita theme light', () => {
      expect(new Settings({ ...validData, theme: 'light' }).validateSync()).toBeUndefined();
    });

    it('rejeita language fora do enum', () => {
      expect(new Settings({ ...validData, language: 'fr-FR' }).validateSync()).toBeDefined();
    });

    it('aceita language en-US', () => {
      expect(new Settings({ ...validData, language: 'en-US' }).validateSync()).toBeUndefined();
    });

    it('aceita language es-ES', () => {
      expect(new Settings({ ...validData, language: 'es-ES' }).validateSync()).toBeUndefined();
    });

    it('rejeita dateFormat fora do enum', () => {
      expect(new Settings({ ...validData, dateFormat: 'YYYY/DD/MM' }).validateSync()).toBeDefined();
    });

    it('aceita dateFormat MM/DD/YYYY', () => {
      expect(new Settings({ ...validData, dateFormat: 'MM/DD/YYYY' }).validateSync()).toBeUndefined();
    });

    it('rejeita timeFormat fora do enum', () => {
      expect(new Settings({ ...validData, timeFormat: '48h' }).validateSync()).toBeDefined();
    });

    it('aceita timeFormat 12h', () => {
      expect(new Settings({ ...validData, timeFormat: '12h' }).validateSync()).toBeUndefined();
    });

    it('rejeita fontSize fora do enum', () => {
      const s = new Settings(validData);
      s.accessibility.fontSize = 'huge';
      expect(s.validateSync()).toBeDefined();
    });

    it('aceita fontSize small', () => {
      const s = new Settings(validData);
      s.accessibility.fontSize = 'small';
      expect(s.validateSync()).toBeUndefined();
    });
  });

  describe('trim', () => {
    it('aplica trim no timezone', () => {
      expect(new Settings({ ...validData, timezone: '  UTC  ' }).timezone).toBe('UTC');
    });
  });

  describe('getDefaults static', () => {
    it('retorna objeto com todos os defaults', () => {
      const d = Settings.getDefaults();
      expect(d.theme).toBe('system');
      expect(d.language).toBe('pt-BR');
      expect(d.timezone).toBe('America/Sao_Paulo');
      expect(d.dateFormat).toBe('DD/MM/YYYY');
      expect(d.timeFormat).toBe('24h');
      expect(d.notifications.email).toBe(true);
      expect(d.notifications.sms).toBe(false);
      expect(d.notifications.quietHours.enabled).toBe(false);
      expect(d.accessibility.fontSize).toBe('medium');
      expect(d.accessibility.highContrast).toBe(false);
    });
  });
});