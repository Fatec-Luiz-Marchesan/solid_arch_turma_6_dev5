function validateLocation(data) {
  const errors = [];

  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 1) {
    errors.push('O nome da localização é obrigatório!');
  } else if (data.name.trim().length > 100) {
    errors.push('O nome da localização deve ter no máximo 100 caracteres!');
  }

  if (!data.street || typeof data.street !== 'string') {
    errors.push('A rua é obrigatória!');
  }

  if (data.complement !== undefined && data.complement !== null && data.complement !== '') {
    if (typeof data.complement !== 'string') {
      errors.push('O complemento deve ser um texto!');
    } else if (data.complement.trim().length > 100) {
      errors.push('O complemento deve ter no máximo 100 caracteres!');
    }
  }

  if (!data.city || typeof data.city !== 'string') {
    errors.push('A cidade é obrigatória!');
  }

  if (!data.state || typeof data.state !== 'string' || !/^[A-Z]{2}$/.test(data.state)) {
    errors.push('O estado deve estar no formato de 2 letras maiúsculas (ex: SP)!');
  }

  if (!data.zipCode || typeof data.zipCode !== 'string' || !/^\d{5}-?\d{3}$/.test(data.zipCode)) {
    errors.push('O CEP deve estar no formato válido (ex: 01310-100)!');
  }

  if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
    if (typeof data.phone !== 'string') {
      errors.push('O telefone deve ser um texto!');
    } else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(data.phone.trim())) {
      errors.push('O telefone deve estar em formato válido (ex: (11) 99999-9999)!');
    }
  }

  if (data.reference !== undefined && data.reference !== null && data.reference !== '') {
    if (typeof data.reference !== 'string') {
      errors.push('O ponto de referência deve ser um texto!');
    } else if (data.reference.trim().length > 200) {
      errors.push('O ponto de referência deve ter no máximo 200 caracteres!');
    }
  }

  if (data.latitude !== undefined && data.latitude !== null) {
    if (typeof data.latitude !== 'number' || data.latitude < -90 || data.latitude > 90) {
      errors.push('A latitude deve estar entre -90 e 90!');
    }
  }

  if (data.longitude !== undefined && data.longitude !== null) {
    if (typeof data.longitude !== 'number' || data.longitude < -180 || data.longitude > 180) {
      errors.push('A longitude deve estar entre -180 e 180!');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

module.exports = { validateLocation };
