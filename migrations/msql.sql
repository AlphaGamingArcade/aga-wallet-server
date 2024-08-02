CREATE TABLE blockchain_user (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    user_email VARCHAR(128) NOT NULL UNIQUE,
    user_password VARCHAR(128) NOT NULL,
    user_name VARCHAR(128) NOT NULL,
    user_services TEXT,
    user_role CHAR(1) NOT NULL,
    user_picture TEXT,
    user_created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blockchain_wallet (
    wallet_id INT IDENTITY(1, 1) PRIMARY KEY,
    wallet_user_id INT NOT NULL,
    wallet_account VARCHAR(12) NOT NULL UNIQUE,
    wallet_alias VARCHAR(128) NULL,
    wallet_status CHAR(1) NOT NULL, -- A for active, I for inactive
    wallet_mnemonic VARCHAR(256) NOT NULL UNIQUE, -- Increased size for mnemonic
    wallet_address VARCHAR(256) NOT NULL UNIQUE,
    wallet_password VARCHAR(256) NOT NULL, -- Increased size for password
    wallet_created_at DATETIME DEFAULT GETDATE(),
    wallet_updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE blockchain_transaction(
    tx_id INT IDENTITY(1, 1) PRIMARY KEY,
    tx_wallet_sender_address VARCHAR(256) NOT NULL,
    tx_wallet_recipient_address VARCHAR(256) NOT NULL,
    tx_amount DECIMAL(100, 4) NOT NULL,
    tx_status CHAR(1) NOT NULL,
    tx_hash VARCHAR(256) NOT NULL,
    tx_created_at DATETIME DEFAULT GETDATE(),
    tx_updated_at DATETIME DEFAULT GETDATE()
)

CREATE TABLE blockchain_token(
    token_id INT IDENTITY(1, 1) PRIMARY KEY,
    token_user_id INT NOT NULL,
    token VARCHAR(258) NOT NULL,
    token_user_email VARCHAR(258) NOT NULL,
    token_expires DATETIME
)

CREATE TABLE blockchain_password_reset_token(
    password_reset_token_id INT IDENTITY(1, 1) PRIMARY KEY,
    password_reset_token VARCHAR(258) NOT NULL,
    password_reset_token_user_id INT NOT NULL,
    password_reset_token_user_email VARCHAR(258) NOT NULL,
    password_reset_token_expires DATETIME 
)