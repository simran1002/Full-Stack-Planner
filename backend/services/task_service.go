package services

import (
	"errors"
	"taskmanager/database"
	"taskmanager/models"
)

func GetAllTasks() ([]models.Task, error) {
	var tasks []models.Task
	if err := database.GetDB().Find(&tasks).Error; err != nil {
		return nil, err
	}
	return tasks, nil
}

func GetTaskByID(id uint) (models.Task, error) {
	var task models.Task
	if err := database.GetDB().First(&task, id).Error; err != nil {
		return task, err
	}
	return task, nil
}

func CreateTask(task models.Task) (models.Task, error) {
	if err := database.GetDB().Create(&task).Error; err != nil {
		return task, err
	}
	return task, nil
}

func UpdateTask(id uint, updatedTask models.Task) (models.Task, error) {
	var task models.Task
	if err := database.GetDB().First(&task, id).Error; err != nil {
		return task, errors.New("task not found")
	}

	task.Title = updatedTask.Title
	task.Description = updatedTask.Description
	task.Status = updatedTask.Status
	task.DueDate = updatedTask.DueDate

	if err := database.GetDB().Save(&task).Error; err != nil {
		return task, err
	}
	return task, nil
}

func DeleteTask(id uint) error {
	var task models.Task
	if err := database.GetDB().First(&task, id).Error; err != nil {
		return errors.New("task not found")
	}

	if err := database.GetDB().Delete(&task).Error; err != nil {
		return err
	}
	return nil
}
