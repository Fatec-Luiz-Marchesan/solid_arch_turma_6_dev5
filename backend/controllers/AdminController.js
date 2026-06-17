const User = require('../models/User');
const Pet = require('../models/Pet');
const Message = require('../models/Message');
const AdminLog = require('../models/AdminLog');
const getToken = require('../helpers/get-token');
const getUserByToken = require('../helpers/get-user-by-token');

const { bootstrapAdmin } = require('../usecases/admin/bootstrapAdmin');
const { listAllUsers } = require('../usecases/admin/listAllUsers');
const { getUserDetails } = require('../usecases/admin/getUserDetails');
const { promoteUser } = require('../usecases/admin/promoteUser');
const { demoteUser } = require('../usecases/admin/demoteUser');
const { deleteUser } = require('../usecases/admin/deleteUser');
const { getSystemStats } = require('../usecases/admin/getSystemStats');
const { logAdminAction } = require('../usecases/admin/logAdminAction');
const { listAdminLogs } = require('../usecases/admin/listAdminLogs');

const DefaultAdminRepository = {
  findAll: () => User.find().select('-password').sort('-createdAt'),
  findById: (id) => User.findById(id).select('-password'),
  countAdmins: () => User.countDocuments({ role: 'admin' }),
  countUsers: () => User.countDocuments(),
  countPets: () => Pet.countDocuments(),
  countMessages: () => Message.countDocuments(),
  promote: (id) =>
    User.findByIdAndUpdate(id, { role: 'admin' }, { new: true }).select('-password'),
  demote: (id) =>
    User.findByIdAndUpdate(id, { role: 'user' }, { new: true }).select('-password'),
  delete: (id) => User.findByIdAndDelete(id),
  createLog: (data) => new AdminLog(data).save(),
  findAllLogs: () => AdminLog.find().sort('-createdAt').limit(100),
  findLogsByAction: (action) => AdminLog.find({ action }).sort('-createdAt').limit(100),
};

let AdminRepository = { ...DefaultAdminRepository };

function handleError(res, err) {
  console.error(err);
  return res.status(500).json({ message: 'Erro interno do servidor!' });
}

async function safeLog(params) {
  try {
    await logAdminAction(params);
  } catch (_) {}
}

module.exports = class AdminController {
  static setRepository(repo) {
    AdminRepository = {
      ...DefaultAdminRepository,
      ...repo,
      createLog: repo.createLog || (async () => ({})),
    };
  }
  static resetRepository() {
    AdminRepository = { ...DefaultAdminRepository };
  }

  static async bootstrap(req, res) {
    try {
      const token = getToken(req);
      const user = await getUserByToken(token);

      const result = await bootstrapAdmin({ user, AdminRepository });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }

      await safeLog({
        action: 'bootstrap',
        performedBy: user,
        targetUser: user,
        details: 'Primeiro admin do sistema',
        AdminRepository,
      });

      return res.status(200).json({
        message: 'Você agora é administrador!',
        data: result.user,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async listUsers(req, res) {
    try {
      const result = await listAllUsers({ AdminRepository });
      return res.status(200).json({ users: result.users });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async getUser(req, res) {
    try {
      const result = await getUserDetails({
        targetId: req.params.id,
        AdminRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({ user: result.user });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async promote(req, res) {
    try {
      const result = await promoteUser({
        targetId: req.params.id,
        actor: req.user || {},
        AdminRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }

      await safeLog({
        action: 'promote',
        performedBy: req.user || {},
        targetUser: result.user,
        details: (req.body && req.body.reason) || '',
        AdminRepository,
      });

      return res.status(200).json({
        message: 'Usuário promovido a administrador!',
        data: result.user,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async demote(req, res) {
    try {
      const result = await demoteUser({
        targetId: req.params.id,
        actor: req.user || {},
        AdminRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }

      await safeLog({
        action: 'demote',
        performedBy: req.user || {},
        targetUser: result.user,
        details: (req.body && req.body.reason) || '',
        AdminRepository,
      });

      return res.status(200).json({
        message: 'Administrador rebaixado a usuário comum!',
        data: result.user,
      });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async deleteUser(req, res) {
    try {
      const targetBefore = await AdminRepository.findById(req.params.id);

      const result = await deleteUser({
        targetId: req.params.id,
        actor: req.user || {},
        AdminRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }

      await safeLog({
        action: 'delete',
        performedBy: req.user || {},
        targetUser: targetBefore || { _id: req.params.id },
        details: (req.body && req.body.reason) || '',
        AdminRepository,
      });

      return res.status(200).json({ message: result.message });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async stats(req, res) {
    try {
      const result = await getSystemStats({ AdminRepository });
      return res.status(200).json({ stats: result.stats });
    } catch (err) {
      return handleError(res, err);
    }
  }

  static async logs(req, res) {
    try {
      const result = await listAdminLogs({
        action: req.query.action,
        AdminRepository,
      });
      if (!result.success) {
        return res.status(result.status).json({ message: result.errors[0] });
      }
      return res.status(200).json({ logs: result.logs });
    } catch (err) {
      return handleError(res, err);
    }
  }
};