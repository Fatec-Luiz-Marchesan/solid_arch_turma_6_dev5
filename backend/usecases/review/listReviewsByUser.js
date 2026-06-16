async function listReviewsByUser({ userId, ReviewRepository }) {
  if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
    return { success: false, status: 422, errors: ['ID inválido!'] };
  }

  const reviews = await ReviewRepository.findByReviewedId(userId);
  return { success: true, status: 200, reviews };
}

module.exports = { listReviewsByUser };