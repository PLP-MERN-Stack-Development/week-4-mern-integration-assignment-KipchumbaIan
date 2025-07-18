import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Search, Filter, Calendar, User, Eye, Heart } from 'lucide-react';
import { format } from 'date-fns';
import LoadingSpinner from '../UI/LoadingSpinner';
import Pagination from '../UI/Pagination';

const PostList = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  
  const { get } = useApi();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, [currentPage, searchTerm, selectedCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 6,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
      });
      
      const response = await get(`/posts?${params}`);
      setPosts(response.data);
      setTotalPages(response.pagination.total);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search and Filter Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </form>
          
          <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {posts.map((post) => (
          <article key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {post.featuredImage && (
              <img
                src={post.featuredImage}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
            )}
            
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                  {post.category.name}
                </span>
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(post.createdAt), 'MMM dd, yyyy')}</span>
              </div>
              
              <h2 className="text-xl font-semibold mb-2 line-clamp-2">
                <Link
                  to={`/posts/${post._id}`}
                  className="hover:text-blue-600 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              
              <p className="text-gray-600 mb-4 line-clamp-3">
                {post.excerpt}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span>{post.author.username}</span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    <span>{post.views}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>{post.likes.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default PostList;