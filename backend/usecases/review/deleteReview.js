async function deleteReview({ id, user, ReviewRepository }) {
  const review = await ReviewRepository.findById(id);
  if (!review) {
    return { success: false, status: 404, errors: ['Avaliação não encontrada!'] };
  }

  if (String(review.reviewer._id) !== String(user._id)) {
    return {
      success: false,
      status: 403,
      errors: ['Apenas o autor pode remover essa avaliação!'],
    };
  }

  await ReviewRepository.delete(id);
  return { success: true, status: 200, message: 'Avaliação removida!' };
}

module.exports = { deleteReview };