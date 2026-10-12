package controllers

import (
	"net/http"
	"restaurant-api/config"
	"restaurant-api/models"

	"github.com/gin-gonic/gin"
)

// GetMenu fetches all dishes from the database
func GetMenu(c *gin.Context) {
	var dishes []models.Dish
	config.DB.Find(&dishes)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   dishes,
	})
}

// CreateDish adds a new food item to the menu
func CreateDish(c *gin.Context) {
	var dish models.Dish

	// Bind incoming JSON to the Dish struct
	if err := c.ShouldBindJSON(&dish); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config.DB.Create(&dish)
	c.JSON(http.StatusCreated, gin.H{
		"message": "Dish created successfully!",
		"data":    dish,
	})
}
