const VALID_ACTIONS = ['promote', 'demote', 'delete', 'bootstrap'];

async function listAdminLogs({ action, AdminRepository }) {
  if (action) {
    if (!VALID_ACTIONS.includes(action)) {
      return { success: false, status: 422, errors: ['Filtro de ação inválido!'] };
    }
    const logs = await AdminRepository.findLogsByAction(action);
    return { success: true, status: 200, logs };
  }

  const logs = await AdminRepository.findAllLogs();
  return { success: true, status: 200, logs };
}

module.exports = { listAdminLogs };