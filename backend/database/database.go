package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jinzhu/gorm"
	_ "github.com/lib/pq"
	"taskmanager/models"
)

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

var DB *gorm.DB

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

func InitDB() {
	config := DefaultConfig()
	InitDBWithConfig(config)
}

func InitDBWithConfig(config Config) {
	dsn := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		config.Host, config.Port, config.User, config.Password, config.DBName, config.SSLMode)
	
	log.Println("Connecting to PostgreSQL database...")
	
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

	DB.DB().SetMaxIdleConns(10)
	DB.DB().SetMaxOpenConns(100)
	DB.DB().SetConnMaxLifetime(time.Hour)

	DB.LogMode(true)

	DB.AutoMigrate(&models.Task{})
	log.Println("PostgreSQL database initialized successfully")
}

func GetDB() *gorm.DB {
	return DB
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
