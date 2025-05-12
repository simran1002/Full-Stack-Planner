# Full-Stack Task Manager

A comprehensive task management application built with a Golang backend and React TypeScript frontend.

## Project Overview

This Task Manager application allows users to create, view, update, and delete tasks. It features:

- **Backend**: RESTful API built with Go and Gin framework
- **Database**: PostgreSQL database for reliable data storage
- **Frontend**: React with TypeScript and shadcn UI components

## Features

- Create, view, update, and delete tasks
- Filter tasks by status (Pending, In-Progress, Completed)
- Responsive UI design
- Form validation
- Toast notifications for user feedback

## Project Structure

```plaintext
Full_Stack_Task_Manager/
├── backend/              
│   ├── api/               
│   ├── database/          
│   ├── models/           
│   └── services/          
├── frontend/              
│   ├── public/           
│   └── src/               
│       ├── components/    
│       ├── lib/           
│       ├── services/     
│       └── types/         
```

## Getting Started

### Prerequisites

- Go 1.16+
- Node.js 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install Go dependencies:

   ```bash
   go mod tidy
   ```

3. Configure your database:
   - The application uses PostgreSQL for data storage
   - Ensure PostgreSQL is installed and running

4. Run the backend server:

   ```bash
   go run main.go
   ```

The API server will start on [http://localhost:8080](http://localhost:8080).

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

The frontend application will be available at [http://localhost:5173](http://localhost:5173).

## API Endpoints

- `GET /api/tasks`: Get all tasks
- `GET /api/tasks/:id`: Get a specific task
- `POST /api/tasks`: Create a new task
- `PUT /api/tasks/:id`: Update an existing task
- `DELETE /api/tasks/:id`: Delete a task

## Database Configuration

The application uses PostgreSQL for data storage:

1. Create a PostgreSQL database:

   ```sql
   CREATE DATABASE taskmanager;
   ```

2. Configure the connection in your environment:

   ```env
   DB_DIALECT=postgres
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_NAME=taskmanager
   DB_SSLMODE=disable
   ```

3. Run the application:

   ```powershell
   .\start.ps1
   ```

## Future Enhancements

- User authentication
- Task categories and tags
- Due date reminders
- Search functionality
- Drag-and-drop task reordering
