package main

import (
	"restaurant-api/config"
	"restaurant-api/models"
	"restaurant-api/routes"
)

func main() {
	// 1. Establish connection to your SQLite database
	config.ConnectDB()

	// 2. Automatically create/update database tables based on your models
	config.DB.AutoMigrate(&models.Dish{}, &models.Order{}, &models.User{})

	// 3. Set up the Gin router and register all API routes
	r := routes.SetupRouter()

	// 4. Start the server on port 8080
	r.Run(":8080")
}
