const { describe, it, expect } = require('@jest/globals');
const { logAdminAction } = require('../../usecases/admin/logAdminAction');

describe('logAdminAction use case', () => {
  it('registra ação administrativa válida', async () => {
    const repo = {
      createLog: jest.fn(async (d) => ({ _id: 'log1', ...d })),
    };
    const r = await logAdminAction({
      action: 'promote',
      performedBy: { _id: 'admin1', name: 'Admin' },
      targetUser: { _id: 'u2', name: 'João' },
      details: 'Promovido a admin',
      AdminRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(repo.createLog).toHaveBeenCalled();
  });

  it('falha com ação inválida', async () => {
    const repo = { createLog: jest.fn() };
    const r = await logAdminAction({
      action: 'hackear',
      performedBy: { _id: 'admin1' },
      targetUser: { _id: 'u2' },
      AdminRepository: repo,
    });
    expect(r.success).toBe(false);
    expect(r.status).toBe(422);
    expect(repo.createLog).not.toHaveBeenCalled();
  });

  it('falha sem performedBy', async () => {
    const r = await logAdminAction({
      action: 'promote',
      performedBy: null,
      targetUser: { _id: 'u2' },
      AdminRepository: { createLog: jest.fn() },
    });
    expect(r.status).toBe(422);
  });

  it('falha sem targetUser', async () => {
    const r = await logAdminAction({
      action: 'promote',
      performedBy: { _id: 'admin1' },
      targetUser: null,
      AdminRepository: { createLog: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});