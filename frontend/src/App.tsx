import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import type { Task } from './types/task';
import { TaskService } from './services/api';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import WebSocketService from './services/websocket';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { fadeIn, fadeOut, pulseAnimation } from './utils/animations';
import { MoonIcon, SunIcon } from 'lucide-react';

function TaskManagerContent() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | undefined>(undefined);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterDueDate, setFilterDueDate] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  const { token, user, logout } = useAuth();
  const [_ws, setWs] = useState<WebSocketService | null>(null);
  const { isDarkMode, toggleTheme } = useTheme();

  // Initialize WebSocket connection
  useEffect(() => {
    let wsInstance: WebSocketService | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    
    const setupWebSocket = () => {
      if (!token) {
        console.warn('No token available for WebSocket connection');
        return;
      }
      
      try {
        console.log('Initializing WebSocket connection with token...', token ? 'Token available' : 'No token');
        
        // Clean up any existing WebSocket connection
        if (_ws) {
          console.log('Closing existing WebSocket connection before creating a new one');
          _ws.close();
        }
        
        // Create a new WebSocket service with the current token
        const ws = new WebSocketService(token);
        wsInstance = ws;
        
        // Set up message handler
        ws.onMessage((message: string) => {
          console.log('WebSocket message received:', message);
          
          if (message === 'update') {
            console.log('Received update notification, refreshing tasks...');
            fetchTasks();
          }
        });
        
        // Set up connection handler
        ws.onOpen(() => {
          console.log('WebSocket connection established');
          setWs(ws);
        });
        
        // Set up error handler
        ws.onError((error: Event) => {
          console.error('WebSocket error:', error);
          
          // Clean up and try to reconnect
          if (wsInstance) {
            wsInstance.close();
            wsInstance = null;
          }
          
          // Set up reconnection
          if (reconnectTimer) {
            clearTimeout(reconnectTimer);
          }
          
          reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            setupWebSocket();
          }, 5000);
        });
        
        // Set up close handler
        ws.onClose((event: CloseEvent) => {
          console.log('WebSocket connection closed:', event);
          
          // Clean up
          if (wsInstance) {
            wsInstance = null;
          }
          
          // Set up reconnection
          if (reconnectTimer) {  
            clearTimeout(reconnectTimer);
          }
          
          reconnectTimer = setTimeout(() => {
            console.log('Attempting to reconnect WebSocket...');
            setupWebSocket();
          }, 5000);
        });
      } catch (error) {
        console.error('Error setting up WebSocket:', error);
      }
    };
    
    // Initialize WebSocket connection
    setupWebSocket();
    
    // Fetch tasks on component mount
    fetchTasks();
    
    // Clean up WebSocket connection on component unmount
    return () => {
      console.log('Cleaning up WebSocket connection...');
      
      if (wsInstance) {
        wsInstance.close();
        wsInstance = null;
      }
      
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };
  }, [token]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching tasks...');
      const data = await TaskService.getAllTasks();
      
      if (data) {
        console.log('Tasks fetched successfully:', data.length);
        setTasks(data);
      } else {
        console.warn('No tasks data returned from API');
        setTasks([]);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      
      // Handle authentication errors
      if (error.response && error.response.status === 401) {
        console.error('Authentication error, logging out...');
        logout();
        return;
      }
      
      // Handle other status codes
      if (error.response) {
        if (error.response.status === 404) {
          setError('No tasks found. Create a new task to get started.');
          return;
        }
      }
      
      // Generic error message
      setError('Failed to load tasks. Please try again later.');
      
      // Show toast notification for error
      toast({
        title: 'Error',
        description: 'Failed to load tasks. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData: Partial<Task>) => {
    try {
      // Validate task data
      if (!taskData.Title?.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Task title is required',
          variant: 'destructive',
        });
        return;
      }
      
      // Ensure we have a token and user ID
      if (!token || !user?.id) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create tasks',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        setLoading(true);
        // Format the due date
        const dueDate = taskData.DueDate ? new Date(taskData.DueDate) : new Date();
        let formattedDueDate = '';
        
        try {
          // Ensure the date is valid
          if (isNaN(dueDate.getTime())) {
            throw new Error('Invalid date');
          }
          
          // Format the date as ISO string
          formattedDueDate = dueDate.toISOString();
          console.log('Formatted DueDate:', formattedDueDate);
        } catch (dateError) {
          console.error('Error with provided date, using current date:', dateError);
          const now = new Date();
          formattedDueDate = now.toISOString();
          console.log('Using current date and time for DueDate:', formattedDueDate);
        }
        
        // Create the task with proper date formatting
        const taskToCreate = { ...taskData, DueDate: formattedDueDate };
        console.log('Creating task with data:', taskToCreate);
        
        // Store current tasks count for debugging
        const currentTaskCount = tasks.length;
        console.log('Current tasks before API call:', currentTaskCount);
        
        const createdTask = await TaskService.createTask(taskToCreate);
        console.log('Task created successfully:', createdTask);
      
        // Update the task list immediately without waiting for WebSocket
        // This ensures we keep all existing tasks and just add the new one
        setTasks(prevTasks => {
          console.log('Adding new task to existing tasks. Current count:', prevTasks.length);
          const updatedTasks = [...prevTasks, createdTask];
          console.log('New tasks count after adding:', updatedTasks.length);
          return updatedTasks;
        });
      
        // Close the form
        setIsFormOpen(false);
        
        // Clear the date filter after task creation
        setFilterDueDate(undefined);
      
        // Show success toast
        toast({
          title: 'Success',
          description: 'Task created successfully',
        });
        
        // Force a refresh of all tasks to ensure consistency
        // This is needed because the WebSocket notification might not be working correctly
        setTimeout(() => {
          console.log('Forcing task refresh after creation');
          TaskService.getAllTasks().then(data => {
            console.log('Fetched all tasks after creation:', data?.length || 0);
            if (data && data.length > 0) {
              // Compare with current tasks to avoid unnecessary updates
              if (data.length !== tasks.length) {
                console.log('Task count mismatch, updating task list');
                // Update tasks without changing filter state
                setTasks(data);
              } else {
                console.log('Task count matches, no update needed');
              }
            }
          }).catch(error => {
            console.error('Error fetching tasks after creation:', error);
          });
        }, 300);
      } catch (error) {
        console.error('Error creating task:', error);
        
        // Show error toast
        toast({
          title: 'Error',
          description: 'Failed to create task. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to create task. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTask = async (taskData: Partial<Task>) => {
    if (!taskData.ID) {
      throw new Error('Task ID is required for updating');
    }
    
    try {
      setLoading(true);
      const updatedTask = await TaskService.updateTask(taskData.ID, taskData);
      console.log('Task updated successfully:', updatedTask);
      
      // Update the task in the list immediately without waiting for WebSocket
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.ID === updatedTask.ID ? updatedTask : task
        )
      );
      
      // Close the form
      setIsFormOpen(false);
      setCurrentTask(undefined);
      setIsEditing(false);
      
      // Show success toast
      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });
    } catch (error) {
      console.error('Error updating task:', error);
      
      // Show error toast
      toast({
        title: 'Error',
        description: 'Failed to update task. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      // Find the task element to animate
      const taskElement = document.querySelector(`[data-task-id="${id}"]`);
      
      // Check if token exists before attempting to delete
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to delete tasks',
          variant: 'destructive',
        });
        return;
      }
      
      if (taskElement) {
        // Animate the task being deleted
        const fadeOutPromise = fadeOut(taskElement, 400, 0);
        
        // Handle the animation completion
        if (fadeOutPromise) {
          try {
            await fadeOutPromise;
            // After animation completes, delete the task
            await TaskService.deleteTask(id);
            // Update the tasks state only after successful deletion
            setTasks(prevTasks => prevTasks.filter(task => task.ID !== id));
            toast({
              title: 'Success',
              description: 'Task deleted successfully',
            });
          } catch (deleteError) {
            console.error('Error during task deletion after animation:', deleteError);
            // Restore the task visibility since deletion failed
            if (taskElement instanceof HTMLElement) {
              taskElement.style.opacity = '1';
              taskElement.style.height = 'auto';
            }
            throw deleteError; // Rethrow to be caught by the outer catch block
          }
        } else {
          // Fallback if animation fails
          await TaskService.deleteTask(id);
          setTasks(prevTasks => prevTasks.filter(task => task.ID !== id));
          toast({
            title: 'Success',
            description: 'Task deleted successfully',
          });
        }
      } else {
        // If element not found, just delete without animation
        await TaskService.deleteTask(id);
        setTasks(prevTasks => prevTasks.filter(task => task.ID !== id));
        toast({
          title: 'Success',
          description: 'Task deleted successfully',
        });
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete task. Please try again or refresh the page.',
        variant: 'destructive',
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setCurrentTask(task);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleFormSubmit = (taskData: Partial<Task>) => {
    if (isEditing && currentTask) {
      handleUpdateTask(taskData);
    } else {
      handleCreateTask(taskData);
    }
  };

  const handleOpenForm = () => {
    // Save the current tasks in a ref before opening the form
    console.log('Current tasks before opening form:', tasks.length);
    setCurrentTask(undefined);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleFilterChange = (status: string | undefined) => {
    // Animate filter change
    const taskListElement = document.querySelector('.task-list-container');
    if (taskListElement) {
      pulseAnimation(taskListElement);
    }
    setFilterStatus(status);
  };
  
  const handleDueDateFilterChange = (date: string | undefined) => {
    // Animate filter change
    const taskListElement = document.querySelector('.task-list-container');
    if (taskListElement) {
      pulseAnimation(taskListElement);
    }
    setFilterDueDate(date);
  };
  
  const handleUpdateTaskStatus = async (taskId: number, newStatus: "Pending" | "In-Progress" | "Completed") => {
    try {
      // Find the task to update
      const taskToUpdate = tasks.find(task => task.ID === taskId);
      
      if (!taskToUpdate) {
        console.error('Task not found:', taskId);
        return;
      }
      
      // Create updated task data
      const updatedTaskData: Partial<Task> = {
        ...taskToUpdate,
        Status: newStatus
      };
      
      // Update the task
      await TaskService.updateTask(taskId, updatedTaskData);
      
      // Update local state
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.ID === taskId ? { ...task, Status: newStatus } as Task : task
        )
      );
      
      // Show success toast
      toast({
        title: 'Status Updated',
        description: `Task moved to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating task status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update task status',
        variant: 'destructive',
      });
    }
  };

  // Reference for animations
  const appRef = useRef<HTMLDivElement>(null);
  
  // Apply animation when component mounts
  useEffect(() => {
    if (appRef.current) {
      fadeIn(appRef.current, 800, 0);
    }
  }, []);

  return (
    <div 
      ref={appRef} 
      className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'} p-4 md:p-8`}
    >
      <div className="container mx-auto">
        <header className="mb-8">
          <div className="flex justify-between items-center mb-6"> 
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                Task Manager
              </span>
            </h1>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                onClick={toggleTheme} 
                className="rounded-full w-10 h-10"
              >
                {isDarkMode ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
              </Button>
              <Button 
                onClick={logout} 
                variant="outline" 
                className={`transition-all duration-200 hover:scale-105 ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : ''}`}
              >
                Logout
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant={filterStatus === undefined ? 'default' : 'outline'}
                onClick={() => handleFilterChange(undefined)}
                className={`transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
              >
                All
              </Button>
              <Button 
                variant={filterStatus === 'Pending' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('Pending')}
                className={`transition-all duration-200 ${filterStatus === 'Pending' 
                  ? (isDarkMode ? 'bg-amber-600 hover:bg-amber-700' : 'bg-yellow-500 hover:bg-yellow-600') 
                  : ''}`}
              >
                Pending
              </Button>
              <Button 
                variant={filterStatus === 'In-Progress' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('In-Progress')}
                className={`transition-all duration-200 ${filterStatus === 'In-Progress' 
                  ? (isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600') 
                  : ''}`}
              >
                In Progress
              </Button>
              <Button 
                variant={filterStatus === 'Completed' ? 'default' : 'outline'}
                onClick={() => handleFilterChange('Completed')}
                className={`transition-all duration-200 ${filterStatus === 'Completed' 
                  ? (isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-green-500 hover:bg-green-600') 
                  : ''}`}
              >
                Completed
              </Button>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className={`px-3 py-2 border rounded transition-colors duration-200 ${isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white' 
                    : 'bg-white border-gray-300'}`}
                  value={filterDueDate || ''}
                  onChange={(e) => handleDueDateFilterChange(e.target.value || undefined)}
                />
                {filterDueDate && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDueDateFilterChange(undefined)}
                    className="transition-all duration-200 hover:scale-105"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <Button 
              onClick={() => handleOpenForm()} 
              className="transition-all duration-200 hover:scale-105 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Add New Task
            </Button>
          </div>
        </header>

        <main>
          {loading ? (
            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p>Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <div className="task-list-container">
              <TaskList 
                tasks={tasks} 
                onEditTask={handleEditTask} 
                onDeleteTask={handleDeleteTask}
                onUpdateTaskStatus={(taskId, newStatus) => {
                  if (newStatus === 'Pending' || newStatus === 'In-Progress' || newStatus === 'Completed') {
                    handleUpdateTaskStatus(taskId, newStatus);
                  }
                }}
                filterStatus={filterStatus}
                filterDueDate={filterDueDate}
              />
            </div>
          )}
        </main>

        <TaskForm
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          initialData={currentTask}
          isEditing={isEditing}
        />
      </div>
      
      <Toaster />
    </div>
  );
}

function TaskManager() {
  // Wrap in a div to ensure proper rendering
  return (
    <div className="task-manager-container">
      <TaskManagerContent />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tasks" element={<TaskManager />} />
          </Route>
          
          {/* Root route - check token directly */}
          <Route path="/" element={
            localStorage.getItem('token') ? 
              <Navigate to="/tasks" replace /> : 
              <Navigate to="/login" replace />
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
