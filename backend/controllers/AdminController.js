const User = require('../models/User');
const Pet = require('../models/Pet');
const Message = require('../models/Message');
const AdminLog = require('../models/AdminLog');

const OBJECT_ID_REGEX = /^[a-fA-F0-9]{24}$/;

const DefaultRepo = {
  findAll: () => User.find().select('-password').sort('-createdAt'),
  findById: (id) => User.findById(id).select('-password'),
  countAdmins: () => User.countDocuments({ role: 'admin' }),
  countUsers: () => User.countDocuments(),
  countPets: () => Pet.countDocuments(),
  countMessages: () => Message.countDocuments(),
  findByIdAndUpdate: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true }).select('-password'),
  update: (id, data) =>
    User.findByIdAndUpdate(id, data, { new: true }).select('-password'),
  promote: (id) =>
    User.findByIdAndUpdate(id, { role: 'admin' }, { new: true }).select('-password'),
  demote: (id) =>
    User.findByIdAndUpdate(id, { role: 'user' }, { new: true }).select('-password'),
  delete: (id) => User.findByIdAndDelete(id),
  logAdminAction: async () => ({}),
  findAllLogs: () => AdminLog.find().sort('-createdAt').limit(100),
  countLogs: () => AdminLog.countDocuments(),
};

let repo = { ...DefaultRepo };

function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor!' });
}

function getActorId(req) {
  if (!req || !req.user) return null;
  return req.user._id || req.user.id || null;
}

function safeLog(params) {
  try {
    if (repo.logAdminAction && typeof repo.logAdminAction === 'function') {
      const result = repo.logAdminAction(params);
      if (result && typeof result.catch === 'function') {
        result.catch(() => {});
      }
    }
  } catch (_) {}
}

async function doPromote(id) {
  if (typeof repo.promote === 'function') {
    return await repo.promote(id, { role: 'admin' });
  }
  if (typeof repo.update === 'function') {
    return await repo.update(id, { role: 'admin' });
  }
  if (typeof repo.findByIdAndUpdate === 'function') {
    return await repo.findByIdAndUpdate(id, { role: 'admin' });
  }
  throw new Error('Repositório sem método de promoção');
}

async function doDemote(id) {
  if (typeof repo.demote === 'function') {
    return await repo.demote(id, { role: 'user' });
  }
  if (typeof repo.update === 'function') {
    return await repo.update(id, { role: 'user' });
  }
  if (typeof repo.findByIdAndUpdate === 'function') {
    return await repo.findByIdAndUpdate(id, { role: 'user' });
  }
  throw new Error('Repositório sem método de rebaixamento');
}

module.exports = class AdminController {
  static setRepository(r) {
    if (!r) {
      repo = { ...DefaultRepo };
    } else {
      repo = r;
    }
  }

  static resetRepository() {
    repo = { ...DefaultRepo };
  }

  static async bootstrap(req, res) {
    try {
      const adminCount = await repo.countAdmins();
      if (adminCount > 0) {
        return res.status(403).json({ message: 'Um admin já existe no sistema.' });
      }

      const actorId = getActorId(req);
      const targetId = (req.body && req.body.userId) || actorId;

      const promoted = await doPromote(targetId);
      if (!promoted) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      safeLog({ action: 'bootstrap', userId: targetId });

      return res.status(200).json({
        message: 'Primeiro admin criado com sucesso!',
        user: promoted,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async listUsers(req, res) {
    try {
      const users = await repo.findAll();
      const total = Array.isArray(users) ? users.length : 0;
      return res.status(200).json({ users, total });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async getUser(req, res) {
    try {
      const id = req.params.id;
      if (!id || !OBJECT_ID_REGEX.test(id)) {
        return res.status(422).json({ message: 'ID em formato inválido!' });
      }

      const user = await repo.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      return res.status(200).json({ user });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async promote(req, res) {
    try {
      const id = req.params.id;
      if (!id || !OBJECT_ID_REGEX.test(id)) {
        return res.status(422).json({ message: 'ID em formato inválido!' });
      }

      const user = await repo.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      if (user.role === 'admin') {
        return res.status(422).json({ message: 'O usuário já é administrador!' });
      }

      const promoted = await doPromote(id);

      safeLog({ action: 'promote', userId: id });

      return res.status(200).json({
        message: 'Usuário promovido a administrador!',
        user: promoted,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async demote(req, res) {
    try {
      const id = req.params.id;
      if (!id || !OBJECT_ID_REGEX.test(id)) {
        return res.status(422).json({ message: 'ID em formato inválido!' });
      }

      const user = await repo.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      if (user.role !== 'admin') {
        return res.status(422).json({ message: 'O usuário não é administrador!' });
      }

      const adminCount = await repo.countAdmins();
      if (adminCount <= 1) {
        return res.status(422).json({ message: 'Não é possível rebaixar o último administrador!' });
      }

      const demoted = await doDemote(id);

      safeLog({ action: 'demote', userId: id });

      return res.status(200).json({
        message: 'Administrador rebaixado a usuário comum!',
        user: demoted,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async deleteUser(req, res) {
    try {
      const id = req.params.id;
      if (!id || !OBJECT_ID_REGEX.test(id)) {
        return res.status(422).json({ message: 'ID em formato inválido!' });
      }

      const actorId = getActorId(req);
      if (actorId && String(actorId) === String(id)) {
        return res.status(422).json({ message: 'Não é possível deletar a si mesmo!' });
      }

      const user = await repo.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado!' });
      }

      if (user.role === 'admin') {
        return res.status(422).json({ message: 'Não é possível deletar administrador!' });
      }

      await repo.delete(id);

      safeLog({ action: 'delete', userId: id });

      return res.status(200).json({ message: 'Usuário deletado com sucesso!' });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async stats(req, res) {
    try {
      const totalUsers = await repo.countUsers();
      const totalAdmins = await repo.countAdmins();
      const totalPets = await repo.countPets();
      const totalMessages = repo.countMessages ? await repo.countMessages() : 0;
      return res.status(200).json({
        stats: { totalUsers, totalAdmins, totalPets, totalMessages },
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async listLogs(req, res) {
    try {
      const logs = await repo.findAllLogs();
      const total = Array.isArray(logs) ? logs.length : await repo.countLogs();
      return res.status(200).json({ logs, total });
    } catch (err) {
      return handleError(res, err);
    }
  }
};