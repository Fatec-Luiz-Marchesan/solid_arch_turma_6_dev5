const VALID_ACTIONS = ['promote', 'demote', 'delete', 'bootstrap'];

async function logAdminAction({ action, performedBy, targetUser, details, AdminRepository }) {
  if (!action || !VALID_ACTIONS.includes(action)) {
    return { success: false, status: 422, errors: ['Ação inválida!'] };
  }

  if (!performedBy || !performedBy._id) {
    return { success: false, status: 422, errors: ['Executor da ação é obrigatório!'] };
  }

  if (!targetUser || !targetUser._id) {
    return { success: false, status: 422, errors: ['Usuário alvo é obrigatório!'] };
  }

  const log = await AdminRepository.createLog({
    action,
    performedBy: { _id: performedBy._id, name: performedBy.name },
    targetUser: { _id: targetUser._id, name: targetUser.name },
    details: details || '',
  });

  return { success: true, status: 201, log };
}

module.exports = { logAdminAction };