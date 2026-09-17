import { setToken, removeToken } from '../utils/storage';

// Temporary Mock Sign Up Service for Frontend Testing
export const registerUser = async (userData) => {
  try {
    // Simulate network latency (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response payload containing a token
    const mockResponse = {
      token: 'mock-jwt-token-sunshine-security-12345',
      user: {
        email: userData.email,
        fullName: userData.fullName || 'Security Guard',
      },
    };

    const token = mockResponse.token;
    if (token) {
      await setToken(token);
    }
    return mockResponse;
  } catch (error) {
    console.error('Mock Register Error:', error);
    throw { message: 'Registration failed' };
  }
};

// Temporary Mock Sign In Service for Frontend Testing
export const loginUser = async (credentials) => {
  try {
    // Simulate network latency (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Basic validation check for testing
    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    // Mock successful response payload containing a token
    const mockResponse = {
      token: 'mock-jwt-token-sunshine-security-12345',
      user: {
        email: credentials.email,
        role: 'Field Guard',
      },
    };

    const token = mockResponse.token;
    if (token) {
      await setToken(token);
    }
    return mockResponse;
  } catch (error) {
    console.error('Mock Login Error:', error);
    throw { message: error.message || 'Login failed' };
  }
};

// Sign Out Service
export const logoutUser = async () => {
  try {
    await removeToken();
  } catch (error) {
    console.error('Logout error:', error);
  }
};