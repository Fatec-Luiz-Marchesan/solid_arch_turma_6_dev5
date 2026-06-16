async function listMessages({ user, page, limit, MessageRepository }) {
  if (!user || !user._id) {
    return { success: false, status: 401, errors: ['Usuário não autenticado!'] };
  }

  const safePage = typeof page === 'number' ? page : 1;
  const safeLimit = typeof limit === 'number' ? limit : 20;

  if (safePage < 1) {
    return { success: false, status: 422, errors: ['Página deve ser maior que 0!'] };
  }

  if (safeLimit > 100) {
    return { success: false, status: 422, errors: ['Limite máximo é 100 por página!'] };
  }

  const skip = (safePage - 1) * safeLimit;

  const [messages, total] = await Promise.all([
    MessageRepository.findByUser(user._id, { skip, limit: safeLimit }),
    MessageRepository.countByUser(user._id),
  ]);

  return {
    success: true,
    status: 200,
    messages,
    total,
    page: safePage,
    totalPages: Math.ceil(total / safeLimit),
  };
}

module.exports = { listMessages };