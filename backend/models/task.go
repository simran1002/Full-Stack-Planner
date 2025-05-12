package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type Task struct {
	gorm.Model
	UserID      uint      `json:"user_id" gorm:"not null"`
	User        User      `json:"-" gorm:"foreignkey:UserID"`
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	Status      string    `json:"status" binding:"required,oneof=Pending In-Progress Completed"`
	Priority    string    `json:"priority" binding:"required,oneof=Low Medium High Critical"`
	DueDate     time.Time `json:"due_date"`
}
