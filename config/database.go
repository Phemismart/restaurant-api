package config

import (
	"fmt"
	"log"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	var err error
	// This opens or creates "restaurant.db" locally without needing a C compiler
	DB, err = gorm.Open(sqlite.Open("restaurant.db"), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	fmt.Println("Database connection successfully established with SQLite!")
}
