package routes

import (
	"restaurant-api/controllers"
	"restaurant-api/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	r := gin.Default()

	// CORS Setup...
	r.Static("/static", "./static")
	r.StaticFile("/", "./static/index.html")

	api := r.Group("/api")
	{
		// --- Public Auth Routes ---
		api.POST("/signup", controllers.Signup)
		api.POST("/login", controllers.Login)

		// --- Public Menu Route ---
		api.GET("/menu", controllers.GetMenu)

		// --- Protected Routes (Require JWT Token) ---
		protected := api.Group("/")
		protected.Use(middleware.RequireAuth)
		{
			protected.POST("/menu", controllers.CreateDish)
			protected.GET("/orders", controllers.GetOrders)
			protected.POST("/orders", controllers.CreateOrder)
		}
	}

	return r
}
