// src/routes/admin.routes.js - Admin Routes

const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  getAllInvoices,
  getSystemStats,
  getActivityLogs,
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth');
const { userIdValidation, validate } = require('../middleware/validation');

// All routes require admin role
router.use(protect);
router.use(authorize('admin'));

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', userIdValidation, validate, getUser);
router.put('/users/:id', userIdValidation, validate, updateUser);
router.delete('/users/:id', userIdValidation, validate, deleteUser);

// Invoice management
router.get('/invoices', getAllInvoices);

// System stats and logs
router.get('/stats', getSystemStats);
router.get('/logs', getActivityLogs);

module.exports = router;
