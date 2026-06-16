const Message = require('../models/Message');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

const { createMessage } = require('../usecases/message/createMessage');
const { listMessages } = require('../usecases/message/listMessages');
const { getMessageById } = require('../usecases/message/getMessageById');
const { updateMessage } = require('../usecases/message/updateMessage');
const { deleteMessage } = require('../usecases/message/deleteMessage');
const { markAsRead } = require('../usecases/message/markAsRead');
const { listConversation } = require('../usecases/message/listConversation');

const MessageRepository = {
  create: (data) => new Message(data).save(),
  findByUser: (userId, { skip = 0, limit = 20 } = {}) =>
    Message.find({
      $or: [{ 'sender._id': userId }, { 'receiver._id': userId }],
    })
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
  countByUser: (userId) =>
    Message.countDocuments({
      $or: [{ 'sender._id': userId }, { 'receiver._id': userId }],
    }),
  findById: (id) => Message.findById(id),
  update: (id, data) => Message.findByIdAndUpdate(id, data, { new: true }),
  delete: (id) => Message.findByIdAndDelete(id),
  findConversation: ({ userId, otherUserId, petId }) =>
    Message.find({
      'pet._id': petId,
      $or: [
        { 'sender._id': userId, 'receiver._id': otherUserId },
        { 'sender._id': otherUserId, 'receiver._id': userId },
      ],
    }).sort('createdAt'),
};

function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor!' });
}

module.exports = class MessageController {
  static async create(req, res) {
    try {
      const token = getToken(req);
      const sender = await getUserByToken(token);

      const result = await createMessage({
        data: req.body,
        sender,
        MessageRepository,
      });

      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(result.status).json({
        message: 'Mensagem enviada!',
        data: result.message,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async list(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await listMessages({
        user,
        page,
        limit,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({
        messages: result.messages,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async getById(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await getMessageById({
        id: req.params.id,
        user,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({ message: result.message });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async update(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await updateMessage({
        id: req.params.id,
        data: req.body,
        user,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({
        message: 'Mensagem atualizada!',
        data: result.message,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async delete(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await deleteMessage({
        id: req.params.id,
        user,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({ message: result.message });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async markAsRead(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await markAsRead({
        id: req.params.id,
        user,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({
        message: 'Mensagem marcada como lida!',
        data: result.message,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async conversation(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await listConversation({
        user,
        otherUserId: req.params.userId,
        petId: req.params.petId,
        MessageRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({ messages: result.messages });
    } catch (err) {
      return handleError(res, err);
    }
  }
};