package models

import "gorm.io/gorm"

type Order struct {
	gorm.Model
	CustomerName string `json:"customer_name"`
	DishID       uint   `json:"dish_id"`
	Dish         Dish   `json:"dish"` // This joins the Dish details to the order automatically via GORM
	Quantity     int    `json:"quantity"`
	Status       string `json:"status"` // e.g., "Pending", "Completed"
}
