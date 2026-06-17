const { describe, it, expect } = require('@jest/globals');
const { listAdminLogs } = require('../../usecases/admin/listAdminLogs');

describe('listAdminLogs use case', () => {
  it('lista todos os logs', async () => {
    const repo = {
      findAllLogs: jest.fn(async () => [{ _id: 'l1' }, { _id: 'l2' }]),
    };
    const r = await listAdminLogs({ AdminRepository: repo });
    expect(r.success).toBe(true);
    expect(r.logs).toHaveLength(2);
  });

  it('filtra por ação quando informada', async () => {
    const repo = {
      findLogsByAction: jest.fn(async () => [{ _id: 'l1', action: 'promote' }]),
    };
    const r = await listAdminLogs({
      action: 'promote',
      AdminRepository: repo,
    });
    expect(r.success).toBe(true);
    expect(repo.findLogsByAction).toHaveBeenCalledWith('promote');
  });

  it('rejeita filtro com ação inválida', async () => {
    const r = await listAdminLogs({
      action: 'hackear',
      AdminRepository: { findAllLogs: jest.fn() },
    });
    expect(r.status).toBe(422);
  });
});