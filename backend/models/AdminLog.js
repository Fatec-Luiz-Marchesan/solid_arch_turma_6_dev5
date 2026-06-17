const mongoose = require('../db/conn')
const { Schema } = mongoose

const AdminLog = mongoose.model(
  'AdminLog',
  new Schema(
    {
      action: {
        type: String,
        required: true,
        enum: ['promote', 'demote', 'delete', 'bootstrap'],
      },
      performedBy: {
        type: Object,
        required: true,
      },
      targetUser: {
        type: Object,
        required: true,
      },
      details: {
        type: String,
        trim: true,
        maxlength: 500,
      },
    },
    { timestamps: true }
  )
)

module.exports = AdminLog