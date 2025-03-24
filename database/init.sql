-- Create 'bot' database
CREATE DATABASE IF NOT EXISTS bot CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create 'bot' user with password and grant privileges
CREATE USER IF NOT EXISTS 'bot'@'localhost' IDENTIFIED BY 'BOT8.father';
GRANT ALL PRIVILEGES ON bot.* TO 'bot'@'localhost';
FLUSH PRIVILEGES;

-- Use the bot database
USE bot;

-- Create messages table
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender` varchar(20) NOT NULL,
  `receiver` varchar(20) NOT NULL DEFAULT '60104325505',
  `message` text NOT NULL,
  `message_type` enum('text','image','video','audio','document') DEFAULT 'text',
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('received','sent','failed') DEFAULT 'received',
  `response` text,
  `media_url` varchar(255) DEFAULT NULL,
  `chat_id` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sender` (`sender`),
  KEY `idx_timestamp` (`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=1080 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Create message_queue table
CREATE TABLE `message_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sender` varchar(20) NOT NULL,
  `recipient` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `status` enum('pending','sent','failed') DEFAULT 'pending',
  `retries` int DEFAULT '0',
  `unique_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`unique_id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
