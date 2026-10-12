package controllers

import (
	"net/http"
	"restaurant-api/config"
	"restaurant-api/models"

	"github.com/gin-gonic/gin"
)

// GetOrders fetches all customer orders with their associated dish details
func GetOrders(c *gin.Context) {
	var orders []models.Order
	// Preload("Dish") brings in the food item details along with the order
	config.DB.Preload("Dish").Find(&orders)
	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   orders,
	})
}

// CreateOrder places a new food order
func CreateOrder(c *gin.Context) {
	var order models.Order

	if err := c.ShouldBindJSON(&order); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Set default status for a new order
	order.Status = "Pending"

	config.DB.Create(&order)

	// Fetch the created order with the dish details loaded for the response
	config.DB.Preload("Dish").First(&order, order.ID)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Order placed successfully!",
		"data":    order,
	})
}
