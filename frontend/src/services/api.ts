import axios from 'axios';
import type { Task } from '../types/task';

// Backend server URL and port
// Note: The backend routes are at the root level, not under /api
const API_URL = 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || '');
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to log responses and handle authentication errors
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('Response error:', error.response || error);
    
    // Handle authentication errors (401 Unauthorized)
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, redirecting to login page');
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export const TaskService = {
  // Get all tasks
  getAllTasks: async (): Promise<Task[]> => {
    try {
      console.log('Fetching all tasks...');
      const response = await api.get('/tasks');
      console.log('Tasks fetched successfully:', response.data);
      
      // Ensure consistent field naming for frontend use
      const normalizedTasks = response.data.map((task: Task) => ({
        ID: task.ID || task.id,
        Title: task.Title || task.title,
        Description: task.Description || task.description,
        Status: task.Status || task.status,
        Priority: task.Priority || task.priority,
        DueDate: task.DueDate || task.due_date,
        CreatedAt: task.CreatedAt || task.created_at,
        UpdatedAt: task.UpdatedAt || task.updated_at,
        user_id: task.user_id
      }));
      
      console.log('Normalized tasks:', normalizedTasks);
      return normalizedTasks;
    } catch (error: any) {
      console.error('Error fetching tasks:', error.response?.data || error.message || error);
      throw error;
    }
  },

  // Get a single task by ID
  getTaskById: async (id: number): Promise<Task> => {
    try {
      console.log(`Fetching task ${id}...`);
      const response = await api.get(`/tasks/${id}`);
      const task = response.data;
      
      // Normalize task data for frontend use
      const normalizedTask = {
        ID: task.ID || task.id,
        Title: task.Title || task.title,
        Description: task.Description || task.description,
        Status: task.Status || task.status,
        Priority: task.Priority || task.priority,
        DueDate: task.DueDate || task.due_date,
        CreatedAt: task.CreatedAt || task.created_at,
        UpdatedAt: task.UpdatedAt || task.updated_at,
        user_id: task.user_id
      };
      
      console.log(`Task ${id} normalized:`, normalizedTask);
      return normalizedTask;
    } catch (error: any) {
      console.error(`Error fetching task ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },

  // Create a new task
  createTask: async (taskInput: Omit<Task, 'ID' | 'CreatedAt' | 'UpdatedAt' | 'DeletedAt'>): Promise<Task> => {
    try {
      // Log the token to verify it's being sent
      const token = localStorage.getItem('token');
      console.log('Token available:', !!token);
      
      // Format the date properly for the backend
      let formattedDueDate = taskInput.DueDate;
      
      // If we have a date, ensure it's in the correct format
      if (formattedDueDate) {
        try {
          // Try to parse the date and format it for the backend
          const date = new Date(formattedDueDate);
          if (!isNaN(date.getTime())) {
            // Use ISO format for the backend
            formattedDueDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error formatting date:', error);
          // Keep the original format if parsing fails
        }
      }
      
      // Create a task object that matches the backend's TaskRequest struct
      // Field names must match exactly what the backend expects (lowercase first letter)
      const taskPayload: {
        title: string;
        description: string;
        status: string;
        priority: string;
        due_date: string;
      } = {
        title: taskInput.Title || '',
        description: taskInput.Description || '',
        status: taskInput.Status || 'Pending',
        priority: taskInput.Priority || 'Medium',
        due_date: formattedDueDate || '',
        // Note: user_id is set by the backend based on the token
      };
      
      // Log the task data being sent
      console.log('Creating task with data:', JSON.stringify(taskPayload, null, 2));
      
      // Log the full request URL
      console.log('Request URL:', `${API_URL}/tasks`);
      
      // Make the API call with the properly formatted payload
      const response = await api.post<any>('/tasks', taskPayload);
      
      console.log('Task creation response:', response.status);
      console.log('Task created successfully:', response.data);
      
      // Normalize the response data for frontend use
      const responseData = response.data;
      const normalizedTask: Task = {
        ID: responseData.ID || responseData.id,
        Title: responseData.title || responseData.Title || '',
        Description: responseData.description || responseData.Description || '',
        Status: responseData.status || responseData.Status || 'Pending',
        Priority: responseData.priority || responseData.Priority || 'Medium',
        DueDate: responseData.due_date || responseData.DueDate || '',
        CreatedAt: responseData.created_at || responseData.CreatedAt,
        UpdatedAt: responseData.updated_at || responseData.UpdatedAt,
        user_id: responseData.user_id
      };
      
      console.log('Normalized created task:', normalizedTask);
      return normalizedTask;
    } catch (error: any) {
      console.error('Error creating task:');
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      throw error;
    }
  },

  // Update an existing task
  updateTask: async (id: number, taskInput: Partial<Task>): Promise<Task> => {
    try {
      // Create a task object that matches the backend's TaskRequest struct
      // Format the date properly for the backend
      let formattedDueDate = taskInput.DueDate;
      
      // If we have a date, ensure it's in the correct format
      if (formattedDueDate) {
        try {
          // Try to parse the date and format it for the backend
          const date = new Date(formattedDueDate);
          if (!isNaN(date.getTime())) {
            // Use ISO format for the backend
            formattedDueDate = date.toISOString().split('T')[0];
          }
        } catch (error) {
          console.error('Error formatting date:', error);
          // Keep the original format if parsing fails
        }
      }
      
      const taskPayload: {
        title?: string;
        description?: string;
        status?: string;
        priority?: string;
        due_date?: string;
      } = {
        title: taskInput.Title,
        description: taskInput.Description || '',
        status: taskInput.Status,
        priority: taskInput.Priority,
        due_date: formattedDueDate,
        // Note: user_id is set by the backend based on the token
      };
      
      console.log(`Updating task ${id} with data:`, taskPayload);
      const response = await api.put<any>(`/tasks/${id}`, taskPayload);
      console.log('Task updated successfully:', response.data);
      
      // Normalize the response data for frontend use
      const responseData = response.data;
      const normalizedTask: Task = {
        ID: responseData.ID || responseData.id,
        Title: responseData.title || responseData.Title || '',
        Description: responseData.description || responseData.Description || '',
        Status: responseData.status || responseData.Status || 'Pending',
        Priority: responseData.priority || responseData.Priority || 'Medium',
        DueDate: responseData.due_date || responseData.DueDate || '',
        CreatedAt: responseData.created_at || responseData.CreatedAt,
        UpdatedAt: responseData.updated_at || responseData.UpdatedAt,
        user_id: responseData.user_id
      };
      
      console.log('Normalized updated task:', normalizedTask);
      return normalizedTask;
    } catch (error: any) {
      console.error(`Error updating task ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id: number): Promise<void> => {
    try {
      console.log(`Deleting task ${id}`);
      await api.delete(`/tasks/${id}`);
      console.log(`Task ${id} deleted successfully`);
    } catch (error: any) {
      console.error(`Error deleting task ${id}:`, error.response?.data || error.message || error);
      throw error;
    }
  },
};

export default api;
