CREATE DATABASE IF NOT EXISTS videogamedb;
USE videogamedb;

CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE Store (
    store_id INT AUTO_INCREMENT PRIMARY KEY,
    address VARCHAR(255),
    city VARCHAR(255),
    state VARCHAR(255),
    country VARCHAR(255),
    zipcode VARCHAR(10)
);

CREATE TABLE Employee (
    employee_id INT AUTO_INCREMENT PRIMARY KEY,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    business_email VARCHAR(100) UNIQUE NOT NULL,
    store_id INT,
    phone_number VARCHAR(15),
    FOREIGN KEY (store_id) REFERENCES Store(store_id)
);

CREATE TABLE Game (
    game_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    price DECIMAL(5,2),
    availability BOOLEAN,
    platform_name VARCHAR(255),
    release_year YEAR,
    maturity_rating VARCHAR(10),
    genre VARCHAR(255),
    image_url VARCHAR(500),
    description VARCHAR(1000)
);

CREATE TABLE Inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    store_id INT NOT NULL,
    available_copies INT NOT NULL,
    FOREIGN KEY(game_id) REFERENCES Game(game_id),
    FOREIGN KEY(store_id) REFERENCES Store(store_id),
    UNIQUE (game_id, store_id)
);

CREATE TABLE Reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    game_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK(rating BETWEEN 1 AND 5),
    review VARCHAR(255),
    creation_date DATE,
    FOREIGN KEY(game_id) REFERENCES Game(game_id),
    FOREIGN KEY(customer_id) REFERENCES Customer(customer_id)
);

CREATE TABLE Reserve (
    reserve_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    game_id INT NOT NULL,
    store_id INT NOT NULL,
    inventory_id INT NOT NULL,
    employee_id INT NOT NULL,
    status BOOLEAN,
    rental_date DATE,
    return_date DATE,
    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (game_id) REFERENCES Game(game_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id),
    FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);