import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Upload, X } from 'lucide-react';

const PostForm = ({ post = null, isEdit = false }) => {
  const [categories, setCategories] = useState([]);
  const [imagePreview, setImagePreview] = useState(post?.featuredImage || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      title: post?.title || '',
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      category: post?.category._id || '',
      tags: post?.tags?.join(', ') || '',
      status: post?.status || 'draft',
    },
  });
  
  const { user } = useAuth();
  const { get, post: apiPost, put } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview('');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    try {
      const formData = new FormData();
      
      // Add form fields
      Object.keys(data).forEach(key => {
        if (key === 'tags') {
          formData.append(key, JSON.stringify(data[key].split(',').map(tag => tag.trim()).filter(tag => tag)));
        } else {
          formData.append(key, data[key]);
        }
      });
      
      // Add image if selected
      if (selectedFile) {
        formData.append('featuredImage', selectedFile);
      }
      
      let response;
      if (isEdit) {
        response = await put(`/posts/${post._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        response = await apiPost('/posts', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      toast.success(`Post ${isEdit ? 'updated' : 'created'} successfully!`);
      navigate(`/posts/${response.data._id}`);
    } catch (error) {
      console.error('Error saving post:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">
          {isEdit ? 'Edit Post' : 'Create New Post'}
        </h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 3, message: 'Title must be at least 3 characters' },
                maxLength: { value: 100, message: 'Title cannot exceed 100 characters' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter post title"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
            )}
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-2">
                  <label className="cursor-pointer">
                    <span className="text-blue-600 hover:text-blue-500">Upload an image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              {...register('excerpt', {
                maxLength: { value: 200, message: 'Excerpt cannot exceed 200 characters' },
              })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the post (optional)"
            />
            {errors.excerpt && (
              <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            <textarea
              {...register('content', {
                required: 'Content is required',
                minLength: { value: 10, message: 'Content must be at least 10 characters' },
              })}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write your post content here..."
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              {...register('tags')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter tags separated by commas"
            />
            <p className="mt-1 text-sm text-gray-500">Separate tags with commas</p>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (isEdit ? 'Update Post' : 'Create Post')}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/posts')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostForm;