// src/controllers/admin.controller.js - Admin Controller

const User = require('../models/User');
const Invoice = require('../models/Invoice');
const Log = require('../models/Log');
const ocrService = require('../services/ocr.service');
const { AppError, NotFoundError } = require('../utils/errorTypes');
const logger = require('../utils/logger');

// @desc    Get all users
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, isActive, search } = req.query;

    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/v1/admin/users/:id
// @access  Private/Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Get user statistics
    const invoiceCount = await Invoice.countDocuments({ userId: user._id, isDeleted: false });
    const recentActivity = await Log.getUserActivity(user._id, 10);

    res.json({
      success: true,
      data: {
        user,
        statistics: {
          invoiceCount,
          recentActivity,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/v1/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'update_user',
      resource: 'user',
      resourceId: user._id,
      description: `Admin updated user: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User updated by admin: ${user._id}`);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/v1/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Don't allow deleting yourself
    if (user._id.toString() === req.user.id.toString()) {
      return next(new AppError('Cannot delete your own account', 400));
    }

    // Soft delete user's invoices
    await Invoice.updateMany(
      { userId: user._id },
      { isDeleted: true, deletedAt: new Date(), deletedBy: req.user.id }
    );

    // Delete user
    await user.deleteOne();

    // Log activity
    await Log.createLog({
      userId: req.user.id,
      action: 'delete_user',
      resource: 'user',
      resourceId: user._id,
      description: `Admin deleted user: ${user.email}`,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    logger.info(`User deleted by admin: ${user._id}`);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices (admin view)
// @route   GET /api/v1/admin/invoices
// @access  Private/Admin
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId, search } = req.query;

    const query = { isDeleted: false };
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('-rawText -completeText'),
      Invoice.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: invoices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get system statistics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getSystemStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalInvoices,
      todayInvoices,
      ocrHealth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Invoice.countDocuments({ isDeleted: false }),
      Invoice.countDocuments({
        isDeleted: false,
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
      }),
      ocrService.checkHealth(),
    ]);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        invoices: {
          total: totalInvoices,
          today: todayInvoices,
        },
        services: {
          ocr: ocrHealth,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get activity logs
// @route   GET /api/v1/admin/logs
// @access  Private/Admin
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, userId, resource } = req.query;

    const query = {};
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (resource) query.resource = resource;

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      Log.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Log.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

