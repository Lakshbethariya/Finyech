-- NextGen Credit Intelligence - MySQL Schema
-- Run this file to initialize the database

CREATE DATABASE IF NOT EXISTS nextgen_credit;
USE nextgen_credit;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    company VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Financial Data Table
CREATE TABLE IF NOT EXISTS financial_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    revenue DECIMAL(15, 2) NOT NULL,
    expenses DECIMAL(15, 2) NOT NULL,
    gst_status ENUM('active', 'inactive', 'pending') DEFAULT 'inactive',
    loan_history ENUM('no_default', 'minor_default', 'major_default') DEFAULT 'no_default',
    years_in_business INT DEFAULT 1,
    industry VARCHAR(100),
    annual_turnover DECIMAL(15, 2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Credit Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    financial_data_id INT,
    score INT NOT NULL,
    risk_level ENUM('Low', 'Medium', 'High') NOT NULL,
    decision ENUM('Approved', 'Risky', 'Rejected') NOT NULL,
    ai_summary TEXT,
    admin_notes TEXT,
    admin_decision ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (financial_data_id) REFERENCES financial_data(id) ON DELETE SET NULL
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    target_user_id INT,
    target_report_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Seed: Default Admin Account (password: Admin@123)
-- Password hash generated with bcrypt, 10 rounds
INSERT INTO users (name, email, password, role, company) VALUES
('System Admin', 'admin@nextgencredit.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'NextGen Credit Intelligence'),
('Demo User', 'demo@company.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', 'Demo Corp Ltd');



-- Note: Both accounts use password "password" for demo purposes
-- Change these in production!
