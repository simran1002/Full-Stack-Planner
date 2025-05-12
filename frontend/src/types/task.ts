export interface Task {
  // Support both uppercase (frontend) and lowercase (backend) field names
  // ID fields
  ID?: number;
  id?: number;
  
  // Timestamp fields
  CreatedAt?: string;
  created_at?: string;
  UpdatedAt?: string;
  updated_at?: string;
  DeletedAt?: string | null;
  deleted_at?: string | null;
  
  // Task data fields
  Title?: string;
  title?: string;
  Description?: string;
  description?: string;
  Status?: "Pending" | "In-Progress" | "Completed";
  status?: string;
  Priority?: "Low" | "Medium" | "High" | "Critical";
  priority?: string;
  DueDate?: string;
  due_date?: string;
  user_id?: number;
  
  // Tags field removed as it's causing SQL issues
}
