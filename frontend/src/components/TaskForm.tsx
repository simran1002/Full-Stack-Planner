import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import type { Task } from '../types/task';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (task: Partial<Task>) => void;
  initialData?: Task;
  isEditing: boolean;
}

export function TaskForm({ 
  open, 
  onOpenChange, 
  onSubmit, 
  initialData, 
  isEditing 
}: TaskFormProps) {
  const [task, setTask] = useState<Partial<Task>>({
    Title: '',
    Description: '',
    Status: 'Pending' as "Pending" | "In-Progress" | "Completed",
    Priority: 'Medium' as "Low" | "Medium" | "High" | "Critical",
    DueDate: '',
  });
  
  useEffect(() => {
    console.log('TaskForm open state changed:', open);
  }, [open]);

  useEffect(() => {
    if (initialData) {
      console.log('Editing task with initial data:', initialData);
      try {
        setTask({
          ...initialData,
          DueDate: initialData.DueDate ? format(new Date(initialData.DueDate), 'yyyy-MM-dd') : '',
        });
      } catch (error) {
        console.error('Error formatting date:', error);
        setTask({
          ...initialData,
          DueDate: '',
        });
      }
    } else if (!isEditing) {
      setTask({
        Title: '',
        Description: '',
        Status: 'Pending',
        Priority: 'Medium',
        DueDate: format(new Date(), 'yyyy-MM-dd'),
      });
    }
  }, [initialData, isEditing, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTask((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (value: "Pending" | "In-Progress" | "Completed") => {
    setTask((prev) => ({ ...prev, Status: value }));
  };

  const handlePriorityChange = (value: "Low" | "Medium" | "High" | "Critical") => {
    setTask((prev) => ({ ...prev, Priority: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!task.Title?.trim()) {
      alert('Task title is required');
      return;
    }
    
    const formattedTask = { 
      ...task,
      Status: task.Status || 'Pending',
      Priority: task.Priority || 'Medium'
    };
    
    if (task.DueDate) {
      try {
        const dueDate = new Date(task.DueDate);
        
        if (isNaN(dueDate.getTime())) {
          throw new Error('Invalid date');
        }
       
        formattedTask.DueDate = task.DueDate;
      } catch (error) {
        console.error('Date parsing error:', error);
        alert('Please enter a valid due date');
        return;
      }
    } else {
      formattedTask.DueDate = format(new Date(), 'yyyy-MM-dd');
    }
    
    console.log('Submitting task:', formattedTask);
    onSubmit(formattedTask);
    
    onOpenChange(false);
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        console.log('Dialog open state changing to:', newOpen);
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              name="Title"
              value={task.Title}
              onChange={handleChange}
              placeholder="Task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="Description"
              value={task.Description}
              onChange={handleChange}
              placeholder="Task description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <Select
              value={task.Status}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="In-Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium">
              Priority
            </label>
            <Select
              value={task.Priority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Low">Low</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="dueDate" className="text-sm font-medium">
              Due Date
            </label>
            <Input
              id="dueDate"
              name="DueDate"
              type="date"
              value={task.DueDate}
              onChange={handleChange}
            />
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
