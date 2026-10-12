# Basic Restaurant API 🍔

A lightweight RESTful backend API built with **Go**, the **Gin framework**, **GORM**, and **SQLite**. This API manages a restaurant's menu items and customer orders.

---

## 📂 Project Architecture

```text
restaurant-api/
│
├── main.go               # Entry point: Connects DB, auto-migrates tables, & starts Gin server
├── go.mod                # Tracks Go modules and dependencies
├── restaurant.db         # Local SQLite database file (auto-generated)
│
├── config/               # Database configuration layer
│   └── database.go       # Establishes connection to SQLite
│
├── models/               # Data structures (Database models)
│   ├── dish.go           # Struct defining menu items
│   └── order.go          # Struct defining customer orders
│
├── controllers/          # Business logic
│   ├── menu_controller.go  # Handles fetching and creating menu items
│   └── order_controller.go # Handles placing orders and preloading dish data
│
└── routes/               # API endpoints
    └── routes.go         # Registers the /api routing group
```

---

## 🚀 Getting Started

### Prerequisites
* Go (version 1.18 or higher) installed on your machine.

### Installation & Running
1. Clone or open your project folder in your terminal.
2. Download dependencies:
   ```bash
   go mod tidy
   ```
3. Run the server:
   ```bash
   go run main.go
   ```
4. The server will start on **`http://localhost:8080`**.

---

## 📡 API Endpoints Documentation

### 1. Menu Endpoints

#### **Get All Menu Items**
* **URL:** `GET /api/menu`
* **Description:** Retrieves a list of all available food items on the menu.
* **Success Response (`200 OK`):**
  ```json
  {
      "status": "success",
      "data": [
          {
              "ID": 1,
              "CreatedAt": "2026-10-12T...",
              "UpdatedAt": "2026-10-12T...",
              "DeletedAt": null,
              "name": "Jollof Rice & Chicken",
              "description": "Party jollof with fried plantain",
              "price": 3500,
              "is_available": true
          }
      ]
  }
  ```

#### **Add a New Dish**
* **URL:** `POST /api/menu`
* **Description:** Adds a new food item to the menu database.
* **Request Body (JSON):**
  ```json
  {
      "name": "Fried Rice & Beef",
      "description": "Special fried rice served with diced beef",
      "price": 4000.00,
      "is_available": true
  }
  ```

---

### 2. Order Endpoints

#### **Place an Order**
* **URL:** `POST /api/orders`
* **Description:** Creates a new customer order linked to a menu dish.
* **Request Body (JSON):**
  ```json
  {
      "customer_name": "Adeniyi",
      "dish_id": 1,
      "quantity": 2
  }
  ```

#### **Get All Orders**
* **URL:** `GET /api/orders`
* **Description:** Retrieves all customer orders along with their preloaded dish details.
* **Success Response (`200 OK`):**
  ```json
  {
      "status": "success",
      "data": [
          {
              "ID": 1,
              "CreatedAt": "2026-10-12T...",
              "UpdatedAt": "2026-10-12T...",
              "DeletedAt": null,
              "customer_name": "Adeniyi",
              "dish_id": 1,
              "dish": {
                  "ID": 1,
                  "name": "Jollof Rice & Chicken",
                  "description": "Party jollof with fried plantain",
                  "price": 3500,
                  "is_available": true
              },
              "quantity": 2,
              "status": "Pending"
          }
      ]
  }
  ```