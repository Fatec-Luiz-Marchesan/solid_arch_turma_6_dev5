const { validateMessageUpdate } = require('../../helpers/validate-message-update');

async function updateMessage({ id, data, user, MessageRepository }) {
  const message = await MessageRepository.findById(id);
  if (!message) {
    return { success: false, status: 404, errors: ['Mensagem não encontrada!'] };
  }

  if (message.deletedAt) {
    return { success: false, status: 404, errors: ['Mensagem não encontrada!'] };
  }

  if (String(message.sender._id) !== String(user._id)) {
    return {
      success: false,
      status: 403,
      errors: ['Apenas o remetente pode editar a mensagem!'],
    };
  }

  const validation = validateMessageUpdate(data);
  if (!validation.isValid) {
    return { success: false, status: 422, errors: validation.errors };
  }

  const normalizedContent = data.content.trim().replace(/\s+/g, ' ');

  const updated = await MessageRepository.update(id, {
    content: normalizedContent,
  });
  return { success: true, status: 200, message: updated };
}

module.exports = { updateMessage };