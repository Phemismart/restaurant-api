package routes

import (
	"restaurant-api/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Group routes under /api prefix
	api := r.Group("/api")
	{
		// Menu endpoints
		api.GET("/menu", controllers.GetMenu)
		api.POST("/menu", controllers.CreateDish)

		// Order endpoints
		api.GET("/orders", controllers.GetOrders)
		api.POST("/orders", controllers.CreateOrder)
	}

	return r
}
