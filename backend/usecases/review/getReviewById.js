async function getReviewById({ id, ReviewRepository }) {
  if (!id || !/^[a-fA-F0-9]{24}$/.test(id)) {
    return { success: false, status: 422, errors: ['ID inválido!'] };
  }

  const review = await ReviewRepository.findById(id);
  if (!review) {
    return { success: false, status: 404, errors: ['Avaliação não encontrada!'] };
  }

  return { success: true, status: 200, review };
}

module.exports = { getReviewById };