const { validateReview } = require('../../helpers/validate-review');

async function updateReview({ id, data, user, ReviewRepository }) {
  const review = await ReviewRepository.findById(id);
  if (!review) {
    return { success: false, status: 404, errors: ['Avaliação não encontrada!'] };
  }

  if (String(review.reviewer._id) !== String(user._id)) {
    return {
      success: false,
      status: 403,
      errors: ['Apenas o autor pode editar essa avaliação!'],
    };
  }

  const validation = validateReview(data);
  if (!validation.isValid) {
    return { success: false, status: 422, errors: validation.errors };
  }

  const updated = await ReviewRepository.update(id, {
    rating: data.rating,
    comment: data.comment.trim(),
  });

  return { success: true, status: 200, review: updated };
}

module.exports = { updateReview };