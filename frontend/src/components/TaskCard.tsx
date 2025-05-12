import { format } from 'date-fns';
import { useRef, useEffect, useState } from 'react';
import type { Task } from '../types/task';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from "./ui/badge";
import { fadeIn, pulseAnimation } from '../utils/animations';
import { useTheme } from '../contexts/ThemeContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  index: number;
  onStatusChange?: (taskId: number, newStatus: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, index, onStatusChange }: TaskCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { isDarkMode } = useTheme();
  
  // Function to determine badge color based on status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return isDarkMode ? 'bg-amber-500/90 text-white' : 'bg-amber-500 text-white';
      case 'In-Progress':
        return isDarkMode ? 'bg-blue-600/90 text-white' : 'bg-blue-500 text-white';
      case 'Completed':
        return isDarkMode ? 'bg-emerald-600/90 text-white' : 'bg-emerald-500 text-white';
      default:
        return isDarkMode ? 'bg-gray-600/90 text-white' : 'bg-gray-500 text-white';
    }
  };
  
  // Function to determine priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return isDarkMode ? 'text-red-400' : 'text-red-500';
      case 'Medium':
        return isDarkMode ? 'text-orange-400' : 'text-orange-500';
      case 'Low':
        return isDarkMode ? 'text-blue-400' : 'text-blue-500';
      default:
        return isDarkMode ? 'text-gray-400' : 'text-gray-500';
    }
  };
  
  // Function to get priority icon
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return '🔴';
      case 'Medium':
        return '🟠';
      case 'Low':
        return '🔵';
      default:
        return '⚪';
    }
  };
  
  // State to track if the card is being dragged
  const [isDragging, setIsDragging] = useState(false);

  // Apply fade-in animation when component mounts
  useEffect(() => {
    if (cardRef.current) {
      fadeIn(cardRef.current, 600, index * 50);
    }
  }, [index]);
  
  // Handle card click for animation effect
  const handleCardClick = () => {
    if (cardRef.current && !isDragging) {
      pulseAnimation(cardRef.current);
    }
  };
  
  // Handle task completion with celebration animation
  const handleTaskCompletion = (taskId: number) => {
    if (cardRef.current) {
      // Use anime.js directly for a celebration animation
      const anime = (window as any).anime;
      if (anime) {
        // First create the confetti particles
        const confettiColors = ['#FF1461', '#18FF92', '#5A87FF', '#FBF38C'];
        const confettiContainer = document.createElement('div');
        confettiContainer.style.position = 'absolute';
        confettiContainer.style.left = '0';
        confettiContainer.style.top = '0';
        confettiContainer.style.width = '100%';
        confettiContainer.style.height = '100%';
        confettiContainer.style.pointerEvents = 'none';
        confettiContainer.style.zIndex = '50';
        document.body.appendChild(confettiContainer);
        
        // Create confetti particles
        const confettiCount = 30;
        const confettiParticles = [];
        
        for (let i = 0; i < confettiCount; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.width = '10px';
          particle.style.height = '10px';
          particle.style.backgroundColor = confettiColors[Math.floor(Math.random() * confettiColors.length)];
          particle.style.borderRadius = '50%';
          confettiContainer.appendChild(particle);
          confettiParticles.push(particle);
        }
        
        // Get the position of the card
        const rect = cardRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Animate the confetti
        anime({
          targets: confettiParticles,
          left: () => centerX + anime.random(-200, 200),
          top: () => centerY + anime.random(-200, 200),
          opacity: [1, 0],
          scale: [1, 0],
          duration: 1000,
          easing: 'easeOutExpo',
          delay: anime.stagger(10),
          complete: () => {
            // Clean up the confetti container
            document.body.removeChild(confettiContainer);
          }
        });
        
        // Animate the card
        anime({
          targets: cardRef.current,
          scale: [1, 1.1, 1],
          rotate: ['0deg', '2deg', '-2deg', '0deg'],
          duration: 800,
          easing: 'easeInOutQuad'
        });
      }
    }
    
    // Call the status change handler
    if (onStatusChange) {
      onStatusChange(taskId, 'Completed');
    }
  };
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      setIsDragging(false);
    };
  }, []);

  // Handle potential field name mismatches (backend uses lowercase, frontend uses uppercase)
  const title = task.Title || task.title || 'Untitled Task';
  const description = task.Description || task.description || '';
  const status = task.Status || task.status || 'Pending';
  const dueDate = task.DueDate || task.due_date;
  const createdAt = task.CreatedAt || task.created_at;
  
  // Format due date if it exists
  const formattedDueDate = dueDate 
    ? format(new Date(dueDate), 'PPP') 
    : 'No due date';
    
  // Format creation date if it exists
  const formattedCreatedAt = createdAt
    ? format(new Date(createdAt), 'PPP p') // Date and time format
    : 'Unknown';

  return (
    <div
      ref={cardRef}
      onClick={handleCardClick}
      data-task-id={task.ID}
      className="mb-4"
    >
      <Card 
        className={`w-full transition-all duration-300 ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border-gray-700/50' : 'bg-white/95 backdrop-blur-sm'} 
        ${isDragging ? 'shadow-xl scale-105 task-dragging' : 'hover:shadow-lg hover:-translate-y-1'}
        rounded-xl overflow-hidden`}
      >
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="flex justify-between items-center text-base">
            <span className="truncate font-medium">{title}</span>
            <Badge className={`${getStatusColor(status)} transition-all duration-300 shadow-sm px-3 py-1 rounded-full text-xs font-medium`}>
              {status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-3 pt-0">
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} whitespace-pre-wrap line-clamp-3 mb-4`}>
            {description || 'No description provided'}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mr-2">
                <span className="text-xs">📅</span>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Due Date</p>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>{formattedDueDate}</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mr-2">
                <span className="text-xs">{getPriorityIcon(task.Priority || task.priority || 'Medium')}</span>
              </div>
              <div>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Priority</p>
                <p className={`text-sm font-medium ${getPriorityColor(task.Priority || task.priority || 'Medium')}`}>
                  {task.Priority || task.priority || 'Medium'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col pt-2 pb-4 border-t border-gray-100 dark:border-gray-700/50">
          <div className="w-full mb-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Created: {formattedCreatedAt}
            </span>
          </div>
          <div className="flex justify-between w-full">
            <div className="flex space-x-2">
              {onStatusChange && task.ID !== undefined && (
                <div className="flex space-x-1">
                  {status !== 'Completed' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-emerald-500 border-emerald-200 dark:border-emerald-800/30 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full"
                      onClick={() => task.ID !== undefined && handleTaskCompletion(task.ID)}
                      title="Mark as Completed"
                    >
                      ✓
                    </Button>
                  )}
                  {status !== 'In-Progress' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-blue-500 border-blue-200 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                      onClick={() => task.ID !== undefined && onStatusChange(task.ID, 'In-Progress')}
                      title="Mark as In Progress"
                    >
                      ↻
                    </Button>
                  )}
                  {status !== 'Pending' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-amber-500 border-amber-200 dark:border-amber-800/30 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full"
                      onClick={() => task.ID !== undefined && onStatusChange(task.ID, 'Pending')}
                      title="Mark as Pending"
                    >
                      ⏱
                    </Button>
                  )}
                </div>
              )}
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 text-blue-500 border-blue-200 dark:border-blue-800/30 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full"
                onClick={() => onEdit(task)}
                title="Edit Task"
              >
                ✎
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-500 border-red-200 dark:border-red-800/30 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                onClick={() => task.ID !== undefined && onDelete(task.ID)}
                title="Delete Task"
              >
                ×
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
