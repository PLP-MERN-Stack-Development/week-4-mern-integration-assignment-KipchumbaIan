const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { validateRegister, validateLogin } = require('../validation/authValidation');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { error } = validateRegister(req.body);
  if (error) {
    return next(new ErrorResponse(error.details[0].message, 400));
  }

  const { username, email, password } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    return next(new ErrorResponse('User already exists', 400));
  }

  // Create user
  const user = await User.create({
    username,
    email,
    password,
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { error } = validateLogin(req.body);
  if (error) {
    return next(new ErrorResponse(error.details[0].message, 400));
  }

  const { email, password } = req.body;

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  const token = generateToken(user._id);

  res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    email: req.body.email,