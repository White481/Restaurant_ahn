-- Restaurant OMS schema (MySQL)
-- Entities: employee, sys_user, customer, dining_table, table_session, reservation,
--           orders, order_item, menu_item, menu_item_ingredient, ingredient
-- TODO: define tables (see docs/ ER diagram)
-- =====================================================================
-- Restaurant Order Management System - Physical Schema (MySQL 8+)
-- Group 10
-- Source: docs/ ER Diagram + Database Design (see docs/er-diagram.png)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS restaurant_oms
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE restaurant_oms;

SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- customer
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS customer;
CREATE TABLE customer (
  customer_id   INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  phone         VARCHAR(15),
  address       VARCHAR(255)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- employee
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS employee;
CREATE TABLE employee (
  employee_id   INT AUTO_INCREMENT PRIMARY KEY,
  first_name    VARCHAR(50),
  last_name     VARCHAR(50),
  position      VARCHAR(50),
  phone         VARCHAR(15),
  email         VARCHAR(100),
  hire_date     DATE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- sys_user  (login account, 1:1 with employee)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS sys_user;
CREATE TABLE sys_user (
  user_id       INT AUTO_INCREMENT PRIMARY KEY,
  employee_id   INT NOT NULL UNIQUE,
  username      VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin', 'chef', 'waiter', 'cashier') NOT NULL,
  CONSTRAINT fk_sysuser_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- dining_table
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS dining_table;
CREATE TABLE dining_table (
  table_id      INT AUTO_INCREMENT PRIMARY KEY,
  table_number  VARCHAR(10) NOT NULL UNIQUE,
  capacity      INT,
  status        ENUM('available', 'occupied', 'reserved', 'inactive')
                  NOT NULL DEFAULT 'available'
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- table_session  (created when a QR code is scanned at a table)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS table_session;
CREATE TABLE table_session (
  session_id    INT AUTO_INCREMENT PRIMARY KEY,
  table_id      INT NOT NULL,
  qr_token      VARCHAR(255) NOT NULL UNIQUE,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    TIMESTAMP NULL,
  status        ENUM('active', 'closed', 'expired') NOT NULL DEFAULT 'active',
  CONSTRAINT fk_session_table
    FOREIGN KEY (table_id) REFERENCES dining_table(table_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- reservation
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS reservation;
CREATE TABLE reservation (
  reservation_id    INT AUTO_INCREMENT PRIMARY KEY,
  customer_id       INT NOT NULL,
  table_id          INT NOT NULL,
  reservation_date  DATE NOT NULL,
  reservation_time  TIME NOT NULL,
  party_size        INT,
  status            ENUM('pending', 'confirmed', 'cancelled', 'completed')
                      NOT NULL DEFAULT 'pending',
  CONSTRAINT fk_reservation_customer
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_reservation_table
    FOREIGN KEY (table_id) REFERENCES dining_table(table_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- menu_item
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS menu_item;
CREATE TABLE menu_item (
  menu_item_id  INT AUTO_INCREMENT PRIMARY KEY,
  item_name     VARCHAR(100) NOT NULL,
  category      VARCHAR(50),
  price         DECIMAL(10,2) NOT NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- ingredient
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS ingredient;
CREATE TABLE ingredient (
  ingredient_id     INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name   VARCHAR(100) NOT NULL,
  quantity_in_stock INT NOT NULL DEFAULT 0,
  unit              VARCHAR(20)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- menu_item_ingredient  (bridge: recipe for each menu item)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS menu_item_ingredient;
CREATE TABLE menu_item_ingredient (
  menu_item_id    INT NOT NULL,
  ingredient_id   INT NOT NULL,
  quantity_needed INT NOT NULL,
  unit            VARCHAR(20),
  PRIMARY KEY (menu_item_id, ingredient_id),
  CONSTRAINT fk_mii_menu_item
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mii_ingredient
    FOREIGN KEY (ingredient_id) REFERENCES ingredient(ingredient_id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS orders;
CREATE TABLE orders (
  order_id        INT AUTO_INCREMENT PRIMARY KEY,
  table_id        INT NOT NULL,
  session_id      INT,
  customer_id     INT,
  employee_id     INT,
  order_type      ENUM('dine_in', 'take_away') NOT NULL,
  order_date      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_price     DECIMAL(10,2) NOT NULL DEFAULT 0,
  special_request TEXT,
  payment_method  ENUM('cash', 'card', 'qr', 'other'),
  status          ENUM('placed', 'preparing', 'ready', 'served',
                        'completed', 'cancelled') NOT NULL DEFAULT 'placed',
  CONSTRAINT fk_orders_table
    FOREIGN KEY (table_id) REFERENCES dining_table(table_id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_session
    FOREIGN KEY (session_id) REFERENCES table_session(session_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_orders_employee
    FOREIGN KEY (employee_id) REFERENCES employee(employee_id)
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- order_item
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS order_item;
CREATE TABLE order_item (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  menu_item_id  INT NOT NULL,
  quantity      INT NOT NULL DEFAULT 1,
  subtotal      DECIMAL(10,2) NOT NULL,
  CONSTRAINT fk_orderitem_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_orderitem_menuitem
    FOREIGN KEY (menu_item_id) REFERENCES menu_item(menu_item_id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Helpful indexes (beyond PK/FK/UNIQUE auto-indexes)
-- ---------------------------------------------------------------------
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_order_date  ON orders(order_date);
CREATE INDEX idx_ingredient_stock   ON ingredient(quantity_in_stock);
CREATE INDEX idx_reservation_date   ON reservation(reservation_date);

SET FOREIGN_KEY_CHECKS = 1;