const mongoose = require('../db/conn')
const { Schema } = mongoose

const Review = mongoose.model(
  'Review',
  new Schema(
    {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        validate: {
          validator: Number.isInteger,
          message: 'A avaliação deve ser um número inteiro!',
        },
      },
      comment: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 1000,
        trim: true,
      },
      recommendation: {
        type: String,
        enum: ['yes', 'no', 'maybe'],
        default: null,
      },
      pet: {
        type: Object,
        required: true,
      },
      reviewer: {
        type: Object,
        required: true,
      },
      reviewed: {
        type: Object,
        required: true,
      },
    },
    { timestamps: true }
  )
)

module.exports = Review