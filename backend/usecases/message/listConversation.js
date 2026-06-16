const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

async function listConversation({ user, otherUserId, petId, MessageRepository }) {
  if (!user || !user._id) {
    return { success: false, status: 401, errors: ['Usuário não autenticado!'] };
  }

  if (!otherUserId || !OBJECT_ID_REGEX.test(otherUserId)) {
    return { success: false, status: 422, errors: ['ID do outro usuário inválido!'] };
  }

  if (!petId || !OBJECT_ID_REGEX.test(petId)) {
    return { success: false, status: 422, errors: ['ID do pet inválido!'] };
  }

  const messages = await MessageRepository.findConversation({
    userId: user._id,
    otherUserId,
    petId,
  });

  return { success: true, status: 200, messages };
}

module.exports = { listConversation };