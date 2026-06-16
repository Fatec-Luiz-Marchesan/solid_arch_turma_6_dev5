async function getUserAverageRating({ userId, ReviewRepository }) {
  if (!userId || !/^[a-fA-F0-9]{24}$/.test(userId)) {
    return { success: false, status: 422, errors: ['ID inválido!'] };
  }

  const reviews = await ReviewRepository.findByReviewedId(userId);

  if (reviews.length === 0) {
    return { success: true, status: 200, average: 0, total: 0 };
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = Math.round((sum / reviews.length) * 100) / 100;

  return {
    success: true,
    status: 200,
    average,
    total: reviews.length,
  };
}

module.exports = { getUserAverageRating };