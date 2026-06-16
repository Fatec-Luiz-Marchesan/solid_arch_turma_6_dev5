function validateMessageUpdate(data) {
  const errors = [];

  if (!data.content || typeof data.content !== 'string') {
    errors.push('O conteúdo da mensagem é obrigatório!');
  } else if (data.content.trim().length < 1) {
    errors.push('A mensagem não pode estar vazia!');
  } else if (data.content.length > 1000) {
    errors.push('A mensagem não pode ter mais de 1000 caracteres!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateMessageUpdate };