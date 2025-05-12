package handlers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"

	"taskmanager/database"
	"taskmanager/models"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true 
	},
}

var clients = make(map[uint][]*websocket.Conn)

func notifyTaskUpdate(userID uint) {
	log.Printf("Attempting to notify user %d about task update", userID)
	
	if connections, ok := clients[userID]; ok {
		log.Printf("Found %d active connections for user %d", len(connections), userID)
		
		for i, conn := range connections {
			message := []byte("update")
			if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
				log.Printf("Error sending update to connection %d: %v", i, err)
				conn.Close()
			} else {
				log.Printf("Successfully sent update to connection %d", i)
			}
		}
	} else {
		log.Printf("No active connections found for user %d", userID)
	}
}

func TaskWebSocket(c *gin.Context) {
	userID := c.GetUint("userID")
	token := c.Query("token")
	
	log.Printf("WebSocket connection attempt from user %d with token: %s", userID, token)
	
	upgrader.CheckOrigin = func(r *http.Request) bool {
		return true 
	}
	
	ws, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	if clients[userID] == nil {
		clients[userID] = make([]*websocket.Conn, 0)
	}
	clients[userID] = append(clients[userID], ws)
	
	if err := ws.WriteMessage(websocket.TextMessage, []byte("update")); err != nil {
		log.Printf("Error sending test message: %v", err)
	} else {
		log.Printf("Test message sent successfully to user %d", userID)
	}

	log.Printf("WebSocket connection established for user %d", userID)
	
	ws.SetPingHandler(func(string) error {
		log.Printf("Received ping from user %d", userID)
		return ws.WriteControl(websocket.PongMessage, []byte{}, time.Now().Add(time.Second))
	})

	go func() {
		for {
			messageType, message, err := ws.ReadMessage()
			if err != nil {
				log.Printf("Error reading message from user %d: %v", userID, err)
				break
			}
			log.Printf("Received message from user %d: %s", userID, string(message))
			
			if err := ws.WriteMessage(messageType, message); err != nil {
				log.Printf("Error echoing message to user %d: %v", userID, err)
				break
			}
		}
		
		clients[userID] = removeConnection(clients[userID], ws)
		ws.Close()
		log.Printf("WebSocket read loop ended for user %d", userID)
	}()

	go func() {
		<-c.Done()
		clients[userID] = removeConnection(clients[userID], ws)
		ws.Close()
		log.Printf("WebSocket connection closed for user %d", userID)
	}()
}

func removeConnection(connections []*websocket.Conn, conn *websocket.Conn) []*websocket.Conn {
	for i, c := range connections {
		if c == conn {
			return append(connections[:i], connections[i+1:]...)
		}
	}
	return connections
}

func GetTasks(c *gin.Context) {
	userID := c.GetUint("userID")
	status := c.Query("status")
	priority := c.Query("priority")
	dueDateStr := c.Query("due_date")

	query := database.DB.Where("user_id = ?", userID)

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if priority != "" {
		query = query.Where("priority = ?", priority)
	}
	if dueDateStr != "" {
		dueDate, err := time.Parse("2006-01-02", dueDateStr)
		if err == nil {
			query = query.Where("due_date <= ?", dueDate)
		}
	}

	var tasks []models.Task
	if err := query.Find(&tasks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

type TaskRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"required,oneof=Pending In-Progress Completed"`
	Priority    string `json:"priority" binding:"required,oneof=Low Medium High Critical"`
	DueDate     string `json:"due_date"` 
}

func CreateTask(c *gin.Context) {
	userID := c.GetUint("userID")

	var taskReq TaskRequest
	if err := c.ShouldBindJSON(&taskReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var dueDate time.Time
	var err error
	if taskReq.DueDate != "" {
		log.Printf("Attempting to parse date: '%s'", taskReq.DueDate)
		
		if len(taskReq.DueDate) == 10 && taskReq.DueDate[4] == '-' && taskReq.DueDate[7] == '-' {
			dueDate, err = time.Parse("2006-01-02", taskReq.DueDate)
			if err == nil {
				log.Printf("Successfully parsed date as YYYY-MM-DD: %v", dueDate)
			} else {
				log.Printf("Failed to parse as YYYY-MM-DD: %v", err)
			}
		} else {
			formats := []string{
				"2006-01-02",           
				"2006-01-02T15:04:05Z",  
				"2006-01-02T15:04:05",  
				"01/02/2006",           
				"02-01-2006",           
				time.RFC3339,            
			}

			parsed := false
			for _, format := range formats {
				dueDate, err = time.Parse(format, taskReq.DueDate)
				if err == nil {
					parsed = true
					log.Printf("Successfully parsed date with format %s: %v", format, dueDate)
					break
				}
			}

			if !parsed {
				if len(taskReq.DueDate) > 10 {
					datePart := taskReq.DueDate[:10] 
					dueDate, err = time.Parse("2006-01-02", datePart)
					if err == nil {
						parsed = true
						log.Printf("Parsed date using first 10 chars: %v", dueDate)
					}
				}
				
				if !parsed {
					log.Printf("Error parsing date '%s': %v", taskReq.DueDate, err)
					log.Printf("Using current date instead")
					dueDate = time.Now()
				}
			}
		}
	} else {
		dueDate = time.Now()
	}

	task := models.Task{
		UserID:      userID,
		Title:       taskReq.Title,
		Description: taskReq.Description,
		Status:      taskReq.Status,
		Priority:    taskReq.Priority,
		DueDate:     dueDate,
	}

	if err := database.DB.Create(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	notifyTaskUpdate(userID)
	c.JSON(http.StatusCreated, task)
}

func UpdateTask(c *gin.Context) {
	userID := c.GetUint("userID")
	taskID := c.Param("id")

	var existingTask models.Task
	result := database.DB.Where("id = ? AND user_id = ?", taskID, userID).First(&existingTask)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found or you don't have permission"})
		return
	}

	var taskReq TaskRequest
	if err := c.ShouldBindJSON(&taskReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var dueDate time.Time
	var err error
	if taskReq.DueDate != "" {
		log.Printf("Attempting to parse date for update: '%s'", taskReq.DueDate)
		
		if len(taskReq.DueDate) == 10 && taskReq.DueDate[4] == '-' && taskReq.DueDate[7] == '-' {
			dueDate, err = time.Parse("2006-01-02", taskReq.DueDate)
			if err == nil {
				log.Printf("Successfully parsed date as YYYY-MM-DD: %v", dueDate)
			} else {
				log.Printf("Failed to parse as YYYY-MM-DD: %v", err)
			}
		} else {
			formats := []string{
				"2006-01-02",           
				"2006-01-02T15:04:05Z",  
				"2006-01-02T15:04:05",   
				"01/02/2006",           
				"02-01-2006",           
				time.RFC3339,            
			}

			parsed := false
			for _, format := range formats {
				dueDate, err = time.Parse(format, taskReq.DueDate)
				if err == nil {
					parsed = true
					log.Printf("Successfully parsed date with format %s: %v", format, dueDate)
					break
				}
			}

			if !parsed {
				if len(taskReq.DueDate) > 10 {
					datePart := taskReq.DueDate[:10] 
					dueDate, err = time.Parse("2006-01-02", datePart)
					if err == nil {
						parsed = true
						log.Printf("Parsed date using first 10 chars: %v", dueDate)
					}
				}
				
				if !parsed {
					log.Printf("Error parsing date '%s': %v", taskReq.DueDate, err)
					dueDate = existingTask.DueDate
					log.Printf("Using existing due date: %v", dueDate)
				}
			}
		}
	} else {
		dueDate = existingTask.DueDate
	}

	existingTask.Title = taskReq.Title
	existingTask.Description = taskReq.Description
	existingTask.Status = taskReq.Status
	existingTask.Priority = taskReq.Priority
	existingTask.DueDate = dueDate

	if err := database.DB.Save(&existingTask).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	notifyTaskUpdate(userID)
	c.JSON(http.StatusOK, existingTask)
}

func DeleteTask(c *gin.Context) {
	userID := c.GetUint("userID")
	taskID := c.Param("id")

	var task models.Task
	if err := database.DB.Where("id = ? AND user_id = ?", taskID, userID).First(&task).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	if err := database.DB.Delete(&task).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	notifyTaskUpdate(userID)
	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
