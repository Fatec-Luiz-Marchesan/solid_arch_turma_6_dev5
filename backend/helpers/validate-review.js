function validateReview(data) {
  const errors = [];

  if (data.rating === undefined || data.rating === null) {
    errors.push('A avaliação é obrigatória!');
  } else if (typeof data.rating !== 'number') {
    errors.push('A avaliação deve ser um número!');
  } else if (!Number.isInteger(data.rating)) {
    errors.push('A avaliação deve ser um número inteiro!');
  } else if (data.rating < 1 || data.rating > 5) {
    errors.push('A avaliação deve estar entre 1 e 5!');
  }

  if (!data.comment || typeof data.comment !== 'string') {
    errors.push('O comentário é obrigatório!');
  } else if (data.comment.trim().length < 10) {
    errors.push('O comentário deve ter pelo menos 10 caracteres!');
  } else if (data.comment.length > 1000) {
    errors.push('O comentário não pode ter mais de 1000 caracteres!');
  }

  if (!data.petId) {
    errors.push('O ID do pet é obrigatório!');
  } else if (typeof data.petId !== 'string' || !/^[a-fA-F0-9]{24}$/.test(data.petId)) {
    errors.push('ID do pet inválido!');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateReview };