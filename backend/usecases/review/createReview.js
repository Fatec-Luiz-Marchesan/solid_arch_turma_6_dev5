const { validateReview } = require('../../helpers/validate-review');

async function createReview({ data, user, ReviewRepository }) {
  const validation = validateReview(data);
  if (!validation.isValid) {
    return { success: false, status: 422, errors: validation.errors };
  }

  if (!user || !user._id) {
    return { success: false, status: 401, errors: ['Usuário não autenticado!'] };
  }

  const pet = await ReviewRepository.findPetById(data.petId);
  if (!pet) {
    return { success: false, status: 404, errors: ['Pet não encontrado!'] };
  }

  if (pet.status !== 'adopted') {
    return {
      success: false,
      status: 422,
      errors: ['Só é possível avaliar pets já adotados!'],
    };
  }

  if (!pet.adopter || String(pet.adopter._id) !== String(user._id)) {
    return {
      success: false,
      status: 403,
      errors: ['Apenas o adotante pode avaliar essa adoção!'],
    };
  }

  const existing = await ReviewRepository.findExistingReview({
    petId: data.petId,
    reviewerId: user._id,
  });
  if (existing) {
    return {
      success: false,
      status: 409,
      errors: ['Você já avaliou esse pet!'],
    };
  }

  const review = await ReviewRepository.create({
    rating: data.rating,
    comment: data.comment.trim(),
    recommendation: data.recommendation || null,
    pet: { _id: pet._id, name: pet.name },
    reviewer: { _id: user._id, name: user.name },
    reviewed: { _id: pet.user._id, name: pet.user.name },
  });

  return { success: true, status: 201, review };
}

module.exports = { createReview };