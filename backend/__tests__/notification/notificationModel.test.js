const { describe, it, expect } = require('@jest/globals');

jest.mock('../../db/conn', () => require('mongoose'));

const Notification = require('../../models/Notification');

const validData = {
  type: 'message_received',
  title: 'Nova mensagem',
  body: 'Você recebeu uma nova mensagem do sistema',
  recipient: { _id: 'u1', name: 'Ana' },
};

describe('Notification Model — schema', () => {
  describe('campos obrigatórios', () => {
    it('aceita dados válidos', () => {
      expect(new Notification(validData).validateSync()).toBeUndefined();
    });

    it('rejeita sem type', () => {
      const n = new Notification({ ...validData, type: undefined });
      expect(n.validateSync().errors.type).toBeDefined();
    });

    it('rejeita type fora do enum', () => {
      const n = new Notification({ ...validData, type: 'spam' });
      expect(n.validateSync()).toBeDefined();
    });

    it('rejeita sem title', () => {
      const n = new Notification({ ...validData, title: undefined });
      expect(n.validateSync().errors.title).toBeDefined();
    });

    it('rejeita title muito curto', () => {
      const n = new Notification({ ...validData, title: 'AB' });
      expect(n.validateSync()).toBeDefined();
    });

    it('rejeita sem body', () => {
      const n = new Notification({ ...validData, body: undefined });
      expect(n.validateSync().errors.body).toBeDefined();
    });

    it('rejeita body muito curto', () => {
      const n = new Notification({ ...validData, body: 'Curto' });
      expect(n.validateSync()).toBeDefined();
    });

    it('rejeita sem recipient', () => {
      const n = new Notification({ ...validData, recipient: undefined });
      expect(n.validateSync().errors.recipient).toBeDefined();
    });
  });

  describe('defaults', () => {
    it('sender default null', () => {
      expect(new Notification(validData).sender).toBeNull();
    });

    it('relatedEntity default null', () => {
      expect(new Notification(validData).relatedEntity).toBeNull();
    });

    it('status default unread', () => {
      expect(new Notification(validData).status).toBe('unread');
    });

    it('priority default normal', () => {
      expect(new Notification(validData).priority).toBe('normal');
    });

    it('channels default [in_app]', () => {
      expect(new Notification(validData).channels).toEqual(['in_app']);
    });

    it('metadata default {}', () => {
      expect(new Notification(validData).metadata).toEqual({});
    });

    it('retryCount default 0', () => {
      expect(new Notification(validData).retryCount).toBe(0);
    });

    it('actionUrl default null', () => {
      expect(new Notification(validData).actionUrl).toBeNull();
    });

    it('readAt default null', () => {
      expect(new Notification(validData).readAt).toBeNull();
    });

    it('archivedAt default null', () => {
      expect(new Notification(validData).archivedAt).toBeNull();
    });

    it('dismissedAt default null', () => {
      expect(new Notification(validData).dismissedAt).toBeNull();
    });

    it('expiresAt default null', () => {
      expect(new Notification(validData).expiresAt).toBeNull();
    });

    it('scheduledAt default null', () => {
      expect(new Notification(validData).scheduledAt).toBeNull();
    });

    it('deletedAt default null', () => {
      expect(new Notification(validData).deletedAt).toBeNull();
    });
  });

  describe('enums', () => {
    it('aceita todos os types válidos', () => {
      const types = [
        'message_received', 'payment_completed', 'payment_refunded',
        'pet_adopted', 'pet_interest', 'account_update', 'system',
      ];
      for (const type of types) {
        expect(new Notification({ ...validData, type }).validateSync()).toBeUndefined();
      }
    });

    it('rejeita status fora do enum', () => {
      expect(new Notification({ ...validData, status: 'pending' }).validateSync()).toBeDefined();
    });

    it('aceita status read', () => {
      expect(new Notification({ ...validData, status: 'read' }).validateSync()).toBeUndefined();
    });

    it('aceita status archived', () => {
      expect(new Notification({ ...validData, status: 'archived' }).validateSync()).toBeUndefined();
    });

    it('aceita status dismissed', () => {
      expect(new Notification({ ...validData, status: 'dismissed' }).validateSync()).toBeUndefined();
    });

    it('rejeita priority fora do enum', () => {
      expect(new Notification({ ...validData, priority: 'critical' }).validateSync()).toBeDefined();
    });

    it('aceita priority low', () => {
      expect(new Notification({ ...validData, priority: 'low' }).validateSync()).toBeUndefined();
    });

    it('aceita priority urgent', () => {
      expect(new Notification({ ...validData, priority: 'urgent' }).validateSync()).toBeUndefined();
    });
  });

  describe('channels validator', () => {
    it('rejeita channels vazio', () => {
      expect(new Notification({ ...validData, channels: [] }).validateSync()).toBeDefined();
    });

    it('rejeita canal inválido', () => {
      expect(new Notification({ ...validData, channels: ['sms'] }).validateSync()).toBeDefined();
    });

    it('aceita múltiplos canais válidos', () => {
      const n = new Notification({ ...validData, channels: ['in_app', 'email', 'push'] });
      expect(n.validateSync()).toBeUndefined();
    });
  });

  describe('actionUrl validator', () => {
    it('aceita URL https', () => {
      const n = new Notification({ ...validData, actionUrl: 'https://app.com/pets/1' });
      expect(n.validateSync()).toBeUndefined();
    });

    it('aceita caminho relativo', () => {
      expect(new Notification({ ...validData, actionUrl: '/messages/abc' }).validateSync()).toBeUndefined();
    });

    it('rejeita javascript:', () => {
      expect(new Notification({ ...validData, actionUrl: 'javascript:alert(1)' }).validateSync()).toBeDefined();
    });
  });

  describe('limites numéricos', () => {
    it('rejeita retryCount negativo', () => {
      expect(new Notification({ ...validData, retryCount: -1 }).validateSync()).toBeDefined();
    });

    it('aceita retryCount 0', () => {
      expect(new Notification({ ...validData, retryCount: 0 }).validateSync()).toBeUndefined();
    });
  });

  describe('trim', () => {
    it('aplica trim no title', () => {
      expect(new Notification({ ...validData, title: '  Nova mensagem  ' }).title).toBe('Nova mensagem');
    });

    it('aplica trim no body', () => {
      expect(new Notification({ ...validData, body: '  Mensagem longa do sistema aqui  ' }).body).toBe('Mensagem longa do sistema aqui');
    });

    it('aplica trim no actionUrl', () => {
      expect(new Notification({ ...validData, actionUrl: '  /test  ' }).actionUrl).toBe('/test');
    });
  });

  describe('virtuals', () => {
    it('isExpired retorna false quando sem expiresAt', () => {
      expect(new Notification(validData).isExpired).toBe(false);
    });

    it('isExpired retorna true quando expirado', () => {
      const n = new Notification({ ...validData, expiresAt: new Date('2020-01-01') });
      expect(n.isExpired).toBe(true);
    });

    it('isExpired retorna false quando não expirado', () => {
      const n = new Notification({ ...validData, expiresAt: new Date(Date.now() + 86400000) });
      expect(n.isExpired).toBe(false);
    });

    it('isRead retorna false quando readAt é null', () => {
      expect(new Notification(validData).isRead).toBe(false);
    });

    it('isRead retorna true quando readAt preenchido', () => {
      expect(new Notification({ ...validData, readAt: new Date() }).isRead).toBe(true);
    });
  });

  describe('múltiplas validações', () => {
    it('lista erros quando vários campos faltam', () => {
      const err = new Notification({}).validateSync();
      expect(err).toBeDefined();
      expect(err.errors.type).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.body).toBeDefined();
      expect(err.errors.recipient).toBeDefined();
    });
  });
});