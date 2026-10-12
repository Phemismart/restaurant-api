package models

import "gorm.io/gorm"

type Dish struct {
	gorm.Model
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Price       float64 `json:"price"`
	IsAvailable bool    `json:"is_available"`
}
