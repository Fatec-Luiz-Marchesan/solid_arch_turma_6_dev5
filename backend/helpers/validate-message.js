const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

function validateMessage(data) {
  const errors = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('O conteúdo da mensagem é obrigatório!');
  } else if (data.content.trim().length < 1) {
    errors.push('A mensagem não pode estar vazia!');
  } else if (data.content.length > 1000) {
    errors.push('A mensagem não pode ter mais de 1000 caracteres!');
  }

  if (!data.receiverId) {
    errors.push('O destinatário é obrigatório!');
  } else if (typeof data.receiverId !== 'string' || !OBJECT_ID_REGEX.test(data.receiverId)) {
    errors.push('ID do destinatário inválido!');
  }

  if (!data.petId) {
    errors.push('O pet é obrigatório!');
  } else if (typeof data.petId !== 'string' || !OBJECT_ID_REGEX.test(data.petId)) {
    errors.push('ID do pet inválido!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateMessage };