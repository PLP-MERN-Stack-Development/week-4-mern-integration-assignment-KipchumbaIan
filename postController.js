const Post = require('../models/Post');
const Category = require('../models/Category');
const { validatePost } = require('../validation/postValidation');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  
  let query = {};
  
  // Search functionality
  if (req.query.search) {
    query.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { content: { $regex: req.query.search, $options: 'i' } }
    ];
  }
  
  // Filter by category
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  // Filter by status
  if (req.query.status) {
    query.status = req.query.status;
  } else {
    query.status = 'published'; // Default to published posts
  }
  
  const total = await Post.countDocuments(query);
  
  const posts = await Post.find(query)
    .populate('author', 'username email')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(startIndex);
  
  const pagination = {
    current: page,
    total: Math.ceil(total / limit),
    hasNext: page < Math.ceil(total / limit),
    hasPrev: page > 1
  };
  
  res.status(200).json({
    success: true,
    count: posts.length,
    total,
    pagination,
    data: posts
  });
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'username email avatar')
    .populate('category', 'name slug')
    .populate('comments.author', 'username avatar');
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  // Increment views
  post.views += 1;
  await post.save();
  
  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Create new post
// @route   POST /api/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const { error } = validatePost(req.body);
  if (error) {
    return next(new ErrorResponse(error.details[0].message, 400));
  }
  
  // Check if category exists
  const category = await Category.findById(req.body.category);
  if (!category) {
    return next(new ErrorResponse('Category not found', 404));
  }
  
  req.body.author = req.user.id;
  
  if (req.file) {
    req.body.featuredImage = `/uploads/${req.file.filename}`;
  }
  
  const post = await Post.create(req.body);
  
  const populatedPost = await Post.findById(post._id)
    .populate('author', 'username email')
    .populate('category', 'name slug');
  
  res.status(201).json({
    success: true,
    data: populatedPost
  });
});

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  let post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  // Check ownership
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this post', 403));
  }
  
  const { error } = validatePost(req.body);
  if (error) {
    return next(new ErrorResponse(error.details[0].message, 400));
  }
  
  if (req.file) {
    req.body.featuredImage = `/uploads/${req.file.filename}`;
  }
  
  post = await Post.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  }).populate('author', 'username email').populate('category', 'name slug');
  
  res.status(200).json({
    success: true,
    data: post
  });
});

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  // Check ownership
  if (post.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this post', 403));
  }
  
  await post.deleteOne();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add comment to post
// @route   POST /api/posts/:id/comments
// @access  Private
exports.addComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  const comment = {
    author: req.user.id,
    content: req.body.content
  };
  
  post.comments.push(comment);
  await post.save();
  
  const updatedPost = await Post.findById(req.params.id)
    .populate('comments.author', 'username avatar');
  
  res.status(201).json({
    success: true,
    data: updatedPost.comments
  });
});

// @desc    Delete comment
// @route   DELETE /api/posts/:id/comments/:commentId
// @access  Private
exports.deleteComment = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  const comment = post.comments.id(req.params.commentId);
  
  if (!comment) {
    return next(new ErrorResponse('Comment not found', 404));
  }
  
  // Check ownership
  if (comment.author.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this comment', 403));
  }
  
  comment.deleteOne();
  await post.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Like/Unlike post
// @route   POST /api/posts/:id/like
// @access  Private
exports.likePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  
  if (!post) {
    return next(new ErrorResponse('Post not found', 404));
  }
  
  const likeIndex = post.likes.indexOf(req.user.id);
  
  if (likeIndex === -1) {
    post.likes.push(req.user.id);
  } else {
    post.likes.splice(likeIndex, 1);
  }
  
  await post.save();
  
  res.status(200).json({
    success: true,
    data: {
      likes: post.likes.length,
      isLiked: likeIndex === -1
    }
  });
});