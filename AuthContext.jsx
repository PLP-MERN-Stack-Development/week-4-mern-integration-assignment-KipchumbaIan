import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
    case 'REGISTER_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case 'LOGIN_FAILURE':
    case 'REGISTER_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null,
      };
    case 'LOAD_USER':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const { post } = useApi();

  // Load user from localStorage on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      dispatch({
        type: 'LOAD_USER',
        payload: {
          token,
          user: JSON.parse(user),
        },
      });
    }
  }, []);

  const login = async (credentials) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await post('/auth/login', credentials);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { token, user },
      });
      
      toast.success('Login successful!');
      return response;
    } catch (error) {
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.response?.data?.error || 'Login failed',
      });
      throw error;
    }
  };

  const register = async (userData) => {
    dispatch({ type: 'REGISTER_START' });
    
    try {
      const response = await post('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({
        type: 'REGISTER_SUCCESS',
        payload: { token, user },
      });
      
      toast.success('Registration successful!');
      return response;
    } catch (error) {
      dispatch({
        type: 'REGISTER_FAILURE',
        payload: error.response?.data?.error || 'Registration failed',
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully!');
  };

  const value = {
    ...state,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};