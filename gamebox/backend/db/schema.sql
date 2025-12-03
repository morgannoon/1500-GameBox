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
    employee_id INT NULL,

    status ENUM('waiting_for_pickup', 'picked_up', 'returned', 'late') DEFAULT 'waiting_for_pickup',

    rental_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    
    -- return_date automatically becomes 4 days after rental_date
    return_date DATE AS (DATE_ADD(rental_date, INTERVAL 4 DAY)) STORED,

    FOREIGN KEY (customer_id) REFERENCES Customer(customer_id),
    FOREIGN KEY (game_id) REFERENCES Game(game_id),
    FOREIGN KEY (store_id) REFERENCES Store(store_id),
    FOREIGN KEY (inventory_id) REFERENCES Inventory(inventory_id),
    FOREIGN KEY (employee_id) REFERENCES Employee(employee_id)
);


INSERT INTO Store (address, city, state, country, zipcode)
VALUES
('123 Uptown St', 'Pittsburgh', 'PA', 'USA', '15213'),
('456 Downtown Ave', 'Pittsburgh', 'PA', 'USA', '15222');

-- Insert Customers
INSERT INTO Customer (password, first_name, last_name, email) VALUES
('pass123', 'Alice', 'Johnson', 'alice.johnson@example.com'),
('pass123', 'Bob', 'Smith', 'bob.smith@example.com'),
('pass123', 'Charlie', 'Brown', 'charlie.brown@example.com'),
('pass123', 'Diana', 'Prince', 'diana.prince@example.com'),
('pass123', 'Evan', 'Taylor', 'evan.taylor@example.com'),
('pass123', 'Fiona', 'Davis', 'fiona.davis@example.com'),
('pass123', 'George', 'Miller', 'george.miller@example.com'),
('pass123', 'Hannah', 'Wilson', 'hannah.wilson@example.com'),
('pass123', 'Ian', 'Moore', 'ian.moore@example.com'),
('pass123', 'Julia', 'Anderson', 'julia.anderson@example.com');

-- Insert Employees
INSERT INTO Employee (password, first_name, last_name, business_email, store_id, phone_number) VALUES
('emp123', 'Tom', 'Hanks', 'tom.hanks@gamebox.com', 1, '412-555-0101'),
('emp123', 'Sara', 'Connor', 'sara.connor@gamebox.com', 2, '412-555-0102'),
('emp123', 'Mike', 'Tyson', 'mike.tyson@gamebox.com', 1, '412-555-0103'),
('emp123', 'Linda', 'Lee', 'linda.lee@gamebox.com', 2, '412-555-0104'),
('emp123', 'James', 'Bond', 'james.bond@gamebox.com', 1, '412-555-0105'),
('emp123', 'Rachel', 'Green', 'rachel.green@gamebox.com', 2, '412-555-0106'),
('emp123', 'Ross', 'Geller', 'ross.geller@gamebox.com', 1, '412-555-0107'),
('emp123', 'Monica', 'Geller', 'monica.geller@gamebox.com', 2, '412-555-0108'),
('emp123', 'Chandler', 'Bing', 'chandler.bing@gamebox.com', 1, '412-555-0109'),
('emp123', 'Phoebe', 'Buffay', 'phoebe.buffay@gamebox.com', 2, '412-555-0110');

-- Insert Games
INSERT INTO Game (title, price, availability, platform_name, release_year, maturity_rating, genre, image_url, description) VALUES
('Super Mario Odyssey', 59.99, TRUE, 'Switch', 2017, 'E', 'Platformer', 'https://example.com/mario.jpg', 'Join Mario on a massive, globe-trotting 3D adventure!'),
('The Legend of Zelda: Breath of the Wild', 69.99, TRUE, 'Switch', 2017, 'E', 'Action-Adventure', 'https://example.com/zelda.jpg', 'Explore the wilds of Hyrule in this open-world adventure.'),
('Halo Infinite', 59.99, TRUE, 'Xbox', 2021, 'T', 'Shooter', 'https://example.com/halo.jpg', 'Master Chief returns in the next chapter of the Halo saga.'),
('God of War', 49.99, TRUE, 'PlayStation', 2018, 'M', 'Action', 'https://example.com/gow.jpg', 'Kratos journeys with his son through Norse mythology.'),
('Minecraft', 26.95, TRUE, 'PC', 2011, 'E', 'Sandbox', 'https://example.com/minecraft.jpg', 'Build and explore infinite worlds with friends.'),
('Fortnite', 0.00, TRUE, 'PC', 2017, 'T', 'Battle Royale', 'https://example.com/fortnite.jpg', 'Join the battle royale and be the last one standing.'),
('FIFA 23', 59.99, TRUE, 'PC', 2022, 'E', 'Sports', 'https://example.com/fifa23.jpg', 'Experience the world\'s most popular soccer game.'),
('Call of Duty: Modern Warfare', 59.99, TRUE, 'PC', 2019, 'M', 'Shooter', 'https://example.com/cod.jpg', 'Engage in modern military combat missions.'),
('Animal Crossing: New Horizons', 59.99, TRUE, 'Switch', 2020, 'E', 'Simulation', 'https://example.com/acnh.jpg', 'Create your perfect island paradise.'),
('Cyberpunk 2077', 49.99, TRUE, 'PC', 2020, 'M', 'RPG', 'https://example.com/cyberpunk.jpg', 'Explore the dystopian Night City.'),
('Elden Ring', 59.99, TRUE, 'PC', 2022, 'M', 'RPG', 'https://example.com/eldenring.jpg', 'Embark on a journey through the Lands Between.'),
('Grand Theft Auto V', 29.99, TRUE, 'PC', 2013, 'M', 'Action', 'https://example.com/gta5.jpg', 'Experience the sprawling city of Los Santos.'),
('Red Dead Redemption 2', 59.99, TRUE, 'PC', 2018, 'M', 'Action', 'https://example.com/rdr2.jpg', 'An epic tale of life in America\'s unforgiving heartland.'),
('Among Us', 4.99, TRUE, 'PC', 2018, 'E', 'Party', 'https://example.com/amongus.jpg', 'Work together to find the imposter aboard the spaceship.'),
('The Witcher 3: Wild Hunt', 39.99, TRUE, 'PC', 2015, 'M', 'RPG', 'https://example.com/witcher3.jpg', 'Hunt monsters and uncover a dark fantasy world.'),
('Overwatch', 39.99, TRUE, 'PC', 2016, 'T', 'Shooter', 'https://example.com/overwatch.jpg', 'Team-based shooter with unique heroes.');

-- Insert Inventory (random stock)
INSERT INTO Inventory (game_id, store_id, available_copies) VALUES
(1, 1, 10),
(2, 1, 8),
(3, 2, 12),
(4, 2, 7),
(5, 1, 15),
(6, 2, 20),
(7, 1, 5),
(8, 2, 10),
(9, 1, 6),
(10, 2, 9);

-- Insert Reviews
INSERT INTO Reviews (game_id, customer_id, rating, review, creation_date) VALUES
(1, 1, 5.0, 'Amazing game!', '2025-11-01'),
(2, 2, 4.5, 'Loved the adventure!', '2025-11-02'),
(3, 3, 4.0, 'Pretty good.', '2025-11-03'),
(4, 4, 3.5, 'Not bad.', '2025-11-04'),
(5, 5, 5.0, 'My favorite!', '2025-11-05'),
(6, 6, 4.0, 'Fun to play.', '2025-11-06'),
(7, 7, 3.0, 'Could be better.', '2025-11-07'),
(8, 8, 4.5, 'Really enjoyed it!', '2025-11-08'),
(9, 9, 5.0, 'Excellent!', '2025-11-09'),
(10, 10, 4.0, 'Good game.', '2025-11-10');