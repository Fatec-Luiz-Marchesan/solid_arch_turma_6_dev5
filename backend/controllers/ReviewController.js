const Review = require('../models/Review');
const Pet = require('../models/Pet');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

const { createReview } = require('../usecases/review/createReview');
const { listReviewsByUser } = require('../usecases/review/listReviewsByUser');
const { listMyReviews } = require('../usecases/review/listMyReviews');
const { getReviewById } = require('../usecases/review/getReviewById');
const { updateReview } = require('../usecases/review/updateReview');
const { deleteReview } = require('../usecases/review/deleteReview');
const { getUserAverageRating } = require('../usecases/review/getUserAverageRating');

const ReviewRepository = {
  create: (data) => new Review(data).save(),
  findById: (id) => Review.findById(id),
  findPetById: (id) => Pet.findById(id),
  findByReviewedId: (userId) =>
    Review.find({ 'reviewed._id': userId }).sort('-createdAt'),
  findByReviewerId: (userId) =>
    Review.find({ 'reviewer._id': userId }).sort('-createdAt'),
  findExistingReview: ({ petId, reviewerId }) =>
    Review.findOne({ 'pet._id': petId, 'reviewer._id': reviewerId }),
  update: (id, data) => Review.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Review.findByIdAndDelete(id),
};

module.exports = class ReviewController {
  static async create(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const result = await createReview({
      data: req.body,
      user,
      ReviewRepository,
    });

    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(result.status).json({
      message: 'Avaliação criada!',
      data: result.review,
    });
  }

  static async listByUser(req, res) {
    const result = await listReviewsByUser({
      userId: req.params.userId,
      ReviewRepository,
    });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({ reviews: result.reviews });
  }

  static async listMine(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const result = await listMyReviews({ user, ReviewRepository });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({ reviews: result.reviews });
  }

  static async getById(req, res) {
    const result = await getReviewById({
      id: req.params.id,
      ReviewRepository,
    });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({ review: result.review });
  }

  static async update(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const result = await updateReview({
      id: req.params.id,
      data: req.body,
      user,
      ReviewRepository,
    });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({
      message: 'Avaliação atualizada!',
      data: result.review,
    });
  }

  static async delete(req, res) {
    const token = getToken(req);
    const user = await getUserByToken(token);

    const result = await deleteReview({
      id: req.params.id,
      user,
      ReviewRepository,
    });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({ message: result.message });
  }

  static async average(req, res) {
    const result = await getUserAverageRating({
      userId: req.params.userId,
      ReviewRepository,
    });
    if (!result.success) {
      return res.status(result.status).json({ message: result.errors[0] });
    }
    return res.status(200).json({
      average: result.average,
      total: result.total,
    });
  }
};