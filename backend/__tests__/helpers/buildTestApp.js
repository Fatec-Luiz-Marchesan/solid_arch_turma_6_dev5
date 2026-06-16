const express = require('express');

function buildTestApp({ paymentRepository, breedRepository, reportRepository, dietRepository, adminRepository, adminUser, currentUser } = {}) {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    if (currentUser) {
      req.testUser = currentUser;
    }
    next();
  });

  if (paymentRepository) {
    const PaymentController = require('../../controllers/PaymentController');
    PaymentController.setRepository(paymentRepository);

    const router = express.Router();
    router.post('/', PaymentController.create);
    router.get('/', PaymentController.list);
    router.get('/:id', PaymentController.getById);
    router.patch('/:id/status', PaymentController.updateStatus);
    router.delete('/:id', PaymentController.delete);

    app.use('/payments', router);
  }

  if (breedRepository) {
    const BreedController = require('../../controllers/BreedController');
    BreedController.setRepository(breedRepository);

    const router = express.Router();
    router.post('/', BreedController.create);
    router.get('/', BreedController.list);
    router.get('/:id', BreedController.getById);
    router.patch('/:id', BreedController.update);
    router.delete('/:id', BreedController.delete);

    app.use('/breeds', router);
  }

  if (reportRepository) {
    const ReportController = require('../../controllers/ReportController');
    ReportController.setRepository(reportRepository);

    const router = express.Router();
    router.post('/', ReportController.create);
    router.get('/', ReportController.list);
    router.get('/:id', ReportController.getById);
    router.patch('/:id/status', ReportController.updateStatus);
    router.delete('/:id', ReportController.delete);

    app.use('/reports', router);
  }

  if (dietRepository) {
    const DietController = require('../../controllers/DietController');
    DietController.setRepository(dietRepository);

    const router = express.Router();
    router.post('/', DietController.create);
    router.get('/', DietController.list);
    router.get('/:id', DietController.getById);
    router.patch('/:id', DietController.update);
    router.delete('/:id', DietController.delete);

    app.use('/diets', router);
  }

  if (adminRepository) {
    const AdminController = require('../../controllers/AdminController');
    AdminController.setRepository(adminRepository);

    const fakeAdmin = adminUser || { _id: '507f1f77bcf86cd799439011', role: 'admin', name: 'Admin' };
    const router = express.Router();
    router.use((req, res, next) => {
      req.user = fakeAdmin;
      next();
    });
    router.post('/bootstrap', AdminController.bootstrap);
    router.get('/users', AdminController.listUsers);
    router.get('/users/:id', AdminController.getUser);
    router.patch('/users/:id/promote', AdminController.promote);
    router.patch('/users/:id/demote', AdminController.demote);
    router.delete('/users/:id', AdminController.deleteUser);
    router.get('/stats', AdminController.stats);

    app.use('/admin', router);
  }

  return app;
}

module.exports = { buildTestApp };