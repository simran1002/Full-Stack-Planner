
import { useState, useEffect, useRef } from 'react';
import type { Task } from '../types/task';
import { TaskCard } from './TaskCard';
import { staggerItems, slideIn } from '../utils/animations';
import { useTheme } from '../contexts/ThemeContext';

interface TaskListProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: number) => void;
  onUpdateTaskStatus?: (taskId: number, newStatus: string) => void;
  filterStatus?: string;
  filterDueDate?: string;
}

export function TaskList({ tasks, onEditTask, onDeleteTask, onUpdateTaskStatus, filterStatus, filterDueDate }: TaskListProps) {
  const { isDarkMode } = useTheme();
  const [columns, setColumns] = useState<{
    [key: string]: { 
      title: string; 
      items: Task[]; 
      color: string;
      icon: string;
      bgGradient: string;
    }
  }>({
    'Pending': { 
      title: 'Pending', 
      items: [], 
      color: isDarkMode ? 'text-amber-400' : 'text-amber-500',
      icon: '⏳',
      bgGradient: isDarkMode 
        ? 'from-amber-900/10 to-amber-800/5 border-amber-700/30' 
        : 'from-amber-50 to-amber-100/50 border-amber-200'
    },
    'In-Progress': { 
      title: 'In Progress', 
      items: [], 
      color: isDarkMode ? 'text-blue-400' : 'text-blue-500',
      icon: '🔄',
      bgGradient: isDarkMode 
        ? 'from-blue-900/10 to-blue-800/5 border-blue-700/30' 
        : 'from-blue-50 to-blue-100/50 border-blue-200'
    },
    'Completed': { 
      title: 'Completed', 
      items: [], 
      color: isDarkMode ? 'text-emerald-400' : 'text-emerald-500',
      icon: '✅',
      bgGradient: isDarkMode 
        ? 'from-emerald-900/10 to-emerald-800/5 border-emerald-700/30' 
        : 'from-emerald-50 to-emerald-100/50 border-emerald-200'
    },
  });
  
  const listRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement[]>([]);
  
  const setColumnRef = (el: HTMLDivElement | null, index: number) => {
    if (el && columnsRef.current) {
      columnsRef.current[index] = el;
    }
  };
  
  useEffect(() => {
    let filteredTasks = [...tasks];
    
    if (filterStatus) {
      filteredTasks = filteredTasks.filter(task => task.Status === filterStatus);
    }
    
    if (filterDueDate) {
      filteredTasks = filteredTasks.filter(task => {
        if (!task.DueDate) return false;
        try {
          const taskDate = new Date(task.DueDate).toDateString();
          const filterDate = new Date(filterDueDate).toDateString();
          return taskDate === filterDate;
        } catch (error) {
          console.error('Error comparing dates:', error);
          return false;
        }
      });
    }
    
    filteredTasks.sort((a, b) => {
      const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
      const aPriority = a.Priority || 'Medium';
      const bPriority = b.Priority || 'Medium';
      return (priorityOrder[aPriority as keyof typeof priorityOrder] || 1) - 
             (priorityOrder[bPriority as keyof typeof priorityOrder] || 1);
    });
    
    const newColumns = {
      'Pending': { 
        title: 'Pending', 
        items: filteredTasks.filter(task => task.Status === 'Pending'),
        color: isDarkMode ? 'text-amber-400' : 'text-amber-500',
        icon: '⏳',
        bgGradient: isDarkMode 
          ? 'from-amber-900/10 to-amber-800/5 border-amber-700/30' 
          : 'from-amber-50 to-amber-100/50 border-amber-200'
      },
      'In-Progress': { 
        title: 'In Progress', 
        items: filteredTasks.filter(task => task.Status === 'In-Progress'),
        color: isDarkMode ? 'text-blue-400' : 'text-blue-500',
        icon: '🔄',
        bgGradient: isDarkMode 
          ? 'from-blue-900/10 to-blue-800/5 border-blue-700/30' 
          : 'from-blue-50 to-blue-100/50 border-blue-200'
      },
      'Completed': { 
        title: 'Completed', 
        items: filteredTasks.filter(task => task.Status === 'Completed'),
        color: isDarkMode ? 'text-emerald-400' : 'text-emerald-500',
        icon: '✅',
        bgGradient: isDarkMode 
          ? 'from-emerald-900/10 to-emerald-800/5 border-emerald-700/30' 
          : 'from-emerald-50 to-emerald-100/50 border-emerald-200'
      },
    };
    
    setColumns(newColumns);
    
    setTimeout(() => {
      if (listRef.current) {
        const taskCards = listRef.current.querySelectorAll('.task-card');
        if (taskCards.length > 0) {
          staggerItems(Array.from(taskCards), 400, 30);
        }
      }
    }, 100);
    
    setTimeout(() => {
      columnsRef.current.forEach((column, index) => {
        if (column) {
          slideIn(column, 'right', 30, 600, index * 100);
        }
      });
    }, 200);
  }, [tasks, filterStatus, filterDueDate, isDarkMode]);
  
  const [draggedElement, setDraggedElement] = useState<HTMLElement | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const draggedTaskInitialStatus = useRef<string | null>(null);
  
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(task));
    
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    
    setDraggedElement(e.currentTarget as HTMLElement);
    draggedTaskInitialStatus.current = task.Status || null;
    
    const anime = (window as any).anime;
    if (anime && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
      ghost.style.position = 'fixed';
      ghost.style.top = `${rect.top}px`;
      ghost.style.left = `${rect.left}px`;
      ghost.style.width = `${rect.width}px`;
      ghost.style.height = `${rect.height}px`;
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.8';
      ghost.style.pointerEvents = 'none';
      ghost.style.transform = 'scale(1.05)';
      ghost.style.transition = 'none';
      ghost.classList.add('task-dragging');
      document.body.appendChild(ghost);
      
      const img = new Image();
      img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      e.dataTransfer.setDragImage(img, 0, 0);
      
      const updateGhostPosition = (moveEvent: MouseEvent) => {
        const dx = moveEvent.clientX - dragStartPos.current.x;
        const dy = moveEvent.clientY - dragStartPos.current.y;
        ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
      };
      
      const removeGhost = () => {
        document.body.removeChild(ghost);
        document.removeEventListener('mousemove', updateGhostPosition);
        document.removeEventListener('dragend', removeGhost);
      };
      
      document.addEventListener('mousemove', updateGhostPosition);
      document.addEventListener('dragend', removeGhost);
      
      anime({
        targets: e.currentTarget,
        scale: 0.95,
        opacity: 0.5,
        duration: 200,
        easing: 'easeOutQuad'
      });
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
      
      const columnElement = e.currentTarget;
      columnElement.classList.add('column-highlight');
      
      document.querySelectorAll('.column-container').forEach(col => {
        if (col !== columnElement) {
          col.classList.remove('column-highlight');
        }
      });
    }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      e.currentTarget.classList.remove('column-highlight');
      setDragOverColumn(null);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('column-highlight');
    
    try {
      const taskData = e.dataTransfer.getData('text/plain');
      const task = JSON.parse(taskData) as Task;
      
      if (task.Status !== columnId && task.ID !== undefined) {
        const destinationColumn = e.currentTarget;
        
        destinationColumn.classList.add('column-highlight');
        
        const anime = (window as any).anime;
        if (anime) {
          const particleCount = 15;
          const particles: HTMLElement[] = [];
          const particleContainer = document.createElement('div');
          particleContainer.style.position = 'absolute';
          particleContainer.style.pointerEvents = 'none';
          particleContainer.style.zIndex = '50';
          destinationColumn.appendChild(particleContainer);
          
          let particleColor = '#4ade80'; 
          if (columnId === 'Pending') particleColor = '#fbbf24';
          if (columnId === 'In-Progress') particleColor = '#60a5fa';
          if (columnId === 'Completed') particleColor = '#34d399';
          
          for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '8px';
            particle.style.height = '8px';
            particle.style.backgroundColor = particleColor;
            particle.style.borderRadius = '50%';
            particle.style.opacity = '0';
            particleContainer.appendChild(particle);
            particles.push(particle);
          }
          
          anime({
            targets: particles,
            translateX: () => anime.random(-100, 100),
            translateY: () => anime.random(-100, 100),
            scale: [0, 1],
            opacity: [1, 0],
            easing: 'easeOutExpo',
            duration: 1000,
            delay: anime.stagger(10),
            complete: () => {
              destinationColumn.removeChild(particleContainer);
            }
          });
          
          anime({
            targets: destinationColumn,
            scale: [1, 1.02, 1],
            boxShadow: [
              '0 0 0 rgba(0,0,0,0)', 
              '0 0 20px rgba(var(--primary-rgb), 0.5)', 
              '0 0 0 rgba(0,0,0,0)'
            ],
            duration: 800,
            easing: 'easeOutElastic(1, .6)',
            complete: () => {
              destinationColumn.classList.remove('column-highlight');
            }
          });
          
          if (draggedElement) {
            anime({
              targets: draggedElement,
              scale: 1,
              opacity: 1,
              duration: 300,
              easing: 'easeOutQuad'
            });
          }
        }
        
        if (onUpdateTaskStatus) {
          onUpdateTaskStatus(task.ID, columnId);
        }
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
    
    setDraggedElement(null);
    setDragOverColumn(null);
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    document.querySelectorAll('.column-container').forEach(col => {
      col.classList.remove('column-highlight');
    });
    
    if (draggedElement) {
      const anime = (window as any).anime;
      if (anime) {
        anime({
          targets: draggedElement,
          scale: 1,
          opacity: 1,
          duration: 300,
          easing: 'easeOutQuad'
        });
      }
    }
    
    setDraggedElement(null);
    setDragOverColumn(null);
  };
  
  const handleStatusChange = (taskId: number, newStatus: string) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, newStatus);
    }
  };
  
  const hasAnyTasks = Object.values(columns).some(column => column.items.length > 0);
  
  return (
    <div ref={listRef} className="w-full">
      {hasAnyTasks ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {!filterStatus && Object.entries(columns).map(([columnId, column]) => (
              <div 
                key={columnId} 
                className="flex flex-col h-full"
                ref={(el) => setColumnRef(el, Object.keys(columns).indexOf(columnId))}
              >
                <h3 className={`text-xl font-semibold mb-4 flex items-center ${column.color}`}>
                  <span className="mr-2 text-xl">{column.icon}</span>
                  {column.title} 
                  <span className="ml-2 px-2 py-0.5 text-sm font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    {column.items.length}
                  </span>
                </h3>
                <div
                  onDragOver={(e) => handleDragOver(e, columnId)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, columnId)}
                  data-droppable-id={columnId}
                  className={`column-container min-h-[70vh] p-4 rounded-xl border bg-gradient-to-b ${column.bgGradient} 
                    backdrop-blur-sm transition-all duration-300 flex-grow 
                    ${dragOverColumn === columnId ? 'shadow-lg scale-[1.02]' : 'shadow-md'}`}
                >
                  {column.items.length > 0 ? (
                    column.items.map((task, index) => (
                      <div 
                        key={task.ID} 
                        className="task-card mb-4 last:mb-0"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <TaskCard
                          task={task}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          index={index}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                      <div className="text-6xl mb-4 opacity-50">{column.icon}</div>
                      <p className={`text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                        Drop tasks here
                      </p>
                      <p className="text-sm text-gray-400 mt-2">
                        Drag and drop to organize your workflow
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* If filtered by status, show only matching tasks */}
            {filterStatus && (
              <div className="col-span-1 lg:col-span-3">
                <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                  {filterStatus} Tasks
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(columns)
                    .flatMap(column => column.items)
                    .filter(task => task.Status === filterStatus)
                    .map((task, index) => (
                      <div 
                        key={task.ID} 
                        className="task-card"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        onDragEnd={handleDragEnd}
                      >
                        <TaskCard
                          task={task}
                          onEdit={onEditTask}
                          onDelete={onDeleteTask}
                          index={index}
                          onStatusChange={handleStatusChange}
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
            </div>
        </>
      ) : (
        <div className={`text-center py-16 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <h3 className={`text-xl font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            No tasks found
          </h3>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {filterStatus || filterDueDate 
              ? 'Try changing your filters or create a new task.'
              : 'Create a new task to get started!'}
          </p>
        </div>
      )}
    </div>
  );
}
