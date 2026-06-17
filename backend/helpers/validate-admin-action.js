const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function validateAdminAction(data) {
  const errors = [];

  if (!data.targetId) {
    errors.push('O ID do usuário é obrigatório!');
  } else if (typeof data.targetId !== 'string') {
    errors.push('O ID do usuário deve ser uma string!');
  } else if (!OBJECT_ID_REGEX.test(data.targetId)) {
    errors.push('ID em formato inválido!');
  }

  if (
    data.actorId &&
    data.targetId &&
    OBJECT_ID_REGEX.test(String(data.actorId)) &&
    OBJECT_ID_REGEX.test(String(data.targetId)) &&
    String(data.actorId) === String(data.targetId)
  ) {
    errors.push('Você não pode executar essa ação em si mesmo!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateAdminAction };