async function listMyReviews({ user, ReviewRepository }) {
  if (!user || !user._id) {
    return { success: false, status: 401, errors: ['Usuário não autenticado!'] };
  }

  const reviews = await ReviewRepository.findByReviewerId(user._id);
  return { success: true, status: 200, reviews };
}

module.exports = { listMyReviews };