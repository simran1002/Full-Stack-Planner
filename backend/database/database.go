package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq" // PostgreSQL driver
	"taskmanager/models"
)

// Config holds database configuration
type Config struct {
	Host     string
	Port     string
	User     string
	Password string
	DBName   string
	SSLMode  string
	MaxRetries int
	RetryInterval time.Duration
}

// DB is the database connection
var DB *gorm.DB

// DefaultConfig returns a default configuration
func DefaultConfig() Config {
	return Config{
		Host:     getEnv("DB_HOST", "localhost"),
		Port:     getEnv("DB_PORT", "5432"),
		User:     getEnv("DB_USER", "postgres"),
		Password: getEnv("DB_PASSWORD", "postgres"),
		DBName:   getEnv("DB_NAME", "taskmanager"),
		SSLMode:  getEnv("DB_SSLMODE", "disable"),
		MaxRetries: 5,
		RetryInterval: 3 * time.Second,
	}
}

// InitDB initializes the database connection
func InitDB() {
	config := DefaultConfig()
	InitDBWithConfig(config)
}

// InitDBWithConfig initializes the database with the provided configuration
func InitDBWithConfig(config Config) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode)
	
	log.Println("Connecting to PostgreSQL database...")
	
	// Attempt to connect with retries
	var err error
	for i := 0; i < config.MaxRetries; i++ {
		DB, err = gorm.Open("postgres", dsn)
		if err == nil {
			break
		}
		
		log.Printf("Failed to connect to database (attempt %d/%d): %v", i+1, config.MaxRetries, err)
		if i < config.MaxRetries-1 {
			log.Printf("Retrying in %v...", config.RetryInterval)
			time.Sleep(config.RetryInterval)
		}
	}
	
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL database after %d attempts: %v", config.MaxRetries, err)
	}

	// Set connection pool settings for production
	DB.DB().SetMaxIdleConns(10)
	// Increased for better performance under load
	DB.DB().SetMaxOpenConns(100)
	// Set connection lifetime
	DB.DB().SetConnMaxLifetime(time.Hour)

	// Enable logging for development
	DB.LogMode(true)

	// Auto migrate the schema
	DB.AutoMigrate(&models.Task{})
	log.Println("PostgreSQL database initialized successfully")
}

// GetDB returns the database connection
func GetDB() *gorm.DB {
	return DB
}

// CloseDB closes the database connection
func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

// Helper function to get environment variable with a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
