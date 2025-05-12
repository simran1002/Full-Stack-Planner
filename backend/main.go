package main

import (
	"log"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"

	"taskmanager/database"
	"taskmanager/handlers"
	"taskmanager/middleware"
	"taskmanager/models"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("config.postgres.env"); err != nil {
		log.Fatal("Error loading .env file")
	}

	// Initialize database
	dbConfig := database.Config{
		Host:          os.Getenv("DB_HOST"),
		Port:          os.Getenv("DB_PORT"),
		User:          os.Getenv("DB_USER"),
		Password:      os.Getenv("DB_PASSWORD"),
		DBName:        os.Getenv("DB_NAME"),
		SSLMode:       os.Getenv("DB_SSLMODE"),
		MaxRetries:    5,
		RetryInterval: 3 * time.Second,
	}

	database.InitDBWithConfig(dbConfig)
	defer database.CloseDB()

	// Auto-migrate the database
	database.DB.AutoMigrate(&models.User{}, &models.Task{})

	// Set up router
	r := gin.Default()

	// Enable CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Public routes
	r.POST("/register", handlers.Register)
	r.POST("/login", handlers.Login)

	// Protected routes
	protected := r.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		// Task routes
		protected.GET("/tasks", handlers.GetTasks)
		protected.POST("/tasks", handlers.CreateTask)
		protected.PUT("/tasks/:id", handlers.UpdateTask)
		protected.DELETE("/tasks/:id", handlers.DeleteTask)

		// WebSocket route for real-time updates
		protected.GET("/ws", handlers.TaskWebSocket)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
