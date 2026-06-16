async function markAsRead({ id, user, MessageRepository }) {
  if (!id) {
    return { success: false, status: 422, errors: ['ID inválido!'] };
  }

  const message = await MessageRepository.findById(id);
  if (!message) {
    return { success: false, status: 404, errors: ['Mensagem não encontrada!'] };
  }

  if (String(message.receiver._id) !== String(user._id)) {
    return {
      success: false,
      status: 403,
      errors: ['Apenas o destinatário pode marcar como lida!'],
    };
  }

  const updated = await MessageRepository.update(id, { read: true });
  return { success: true, status: 200, message: updated };
}

module.exports = { markAsRead };