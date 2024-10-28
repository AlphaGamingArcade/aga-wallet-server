CREATE TABLE wallet_user (
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

CREATE TABLE wallet_wallet (
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

CREATE TABLE wallet_transaction(
    tx_id INT IDENTITY(1, 1) PRIMARY KEY,
    tx_wallet_sender_address VARCHAR(256) NOT NULL,
    tx_wallet_recipient_address VARCHAR(256) NOT NULL,
    tx_amount DECIMAL(38, 4) NOT NULL,
    tx_status CHAR(1) NOT NULL,
    tx_hash VARCHAR(256) NOT NULL,
    tx_block_hash VARCHAR(256) NOT NULL,
    tx_type char(1) NOT NULL,
    tx_created_at DATETIME DEFAULT GETDATE(),
    tx_updated_at DATETIME DEFAULT GETDATE()
)

CREATE TABLE wallet_token(
    token_id INT IDENTITY(1, 1) PRIMARY KEY,
    token_user_id INT NOT NULL,
    token VARCHAR(258) NOT NULL,
    token_user_email VARCHAR(258) NOT NULL,
    token_expires DATETIME
)

CREATE TABLE wallet_password_reset_token(
    password_reset_token_id INT IDENTITY(1, 1) PRIMARY KEY,
    password_reset_token VARCHAR(258) NOT NULL,
    password_reset_token_user_id INT NOT NULL,
    password_reset_token_user_email VARCHAR(258) NOT NULL,
    password_reset_token_expires DATETIME 
)

create table wallet_log(
	log_id int IDENTITY(1, 1) PRIMARY KEY NOT NULL,
	log_text varchar(250),
	log_url varchar(250),
    log_status char(1),
    log_ip varchar(39),
    log_created_at DATETIME DEFAULT GETDATE(),
    log_updated_at DATETIME DEFAULT GETDATE()
)

CREATE TABLE wallet_asset(
    asset_id int IDENTITY(1, 1) PRIMARY KEY NOT NULL,
    asset_account_id int NOT NULL,
    asset_network_id int NOT NULL,
    asset_name varchar(50) NOT NULL,
    asset_symbol varchar(20) NOT NULL,
    asset_decimal int NOT NULL,
    asset_native char(1) NOT NULL, -- If native is 'y'
    asset_contract varchar(250) -- Can be null if native is y
);

CREATE TABLE wallet_liquidity_pool(
    lp_id int IDENTITY(1, 1) PRIMARY KEY NOT NULL,
    lp_account_id int NOT NULL,
    lp_name varchar(50) NOT NULL,
    lp_symbol varchar(20) NOT NULL,
    lp_decimal int NOT NULL,
    asset_contract varchar(250) -- Can be null if native is y
);

CREATE TABLE wallet_notification (
    notification_id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    notification_user_id INT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    notification_message VARCHAR(250) NOT NULL,
    notification_status VARCHAR(50) CHECK (notification_status IN ('unread', 'read', 'dismissed', 'archived', 'action_taken')) NOT NULL,
    notification_created_at DATETIME DEFAULT GETDATE(),
    notification_updated_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE wallet_game (
    game_id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    game_name VARCHAR(50) NOT NULL,
    game_image VARCHAR(250) NOT NULL,
    game_url VARCHAR(250) NOT NULL,
    game_status CHAR(1) NOT NULL,
    game_players INT NOT NULL,
    game_genre NVARCHAR(50) NOT NULL,
    game_created_at DATETIME DEFAULT GETDATE(),
    game_updated_at DATETIME DEFAULT GETDATE()
)

CREATE TABLE wallet_messaging (
    messaging_id INT IDENTITY(1,1) PRIMARY KEY NOT NULL,
    messaging_user_id INT NOT NULL,
    messaging_token VARCHAR(250) NOT NULL UNIQUE,
    messaging_status CHAR(1) NOT NULL,
    messaging_created_at DATETIME DEFAULT GETDATE(),
    messaging_updated_at DATETIME DEFAULT GETDATE()
)

CREATE TABLE wallet_account (
    account_id INT IDENTITY(1, 1) PRIMARY KEY,
    account_user_id INT NOT NULL,
    account_code VARCHAR(128) NULL,
    account_status CHAR(1) NOT NULL, -- A for active, I for inactive
    account_mnemonic VARCHAR(256) NOT NULL, -- Increased size for mnemonic
    account_password VARCHAR(256) NOT NULL, -- Increased size for password
    account_created_at DATETIME DEFAULT GETDATE(),
    account_updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT UQ_account_user_id UNIQUE (account_user_id), -- for checking duplicate error handling
    CONSTRAINT UQ_account_code UNIQUE (account_code), -- for checking duplicate error handling
    CONSTRAINT UQ_account_mnemonic UNIQUE (account_mnemonic) -- for checking duplicate error handling
);

CREATE TABLE wallet_qr_room (
    qr_room_id INT IDENTITY(1, 1) PRIMARY KEY,      -- Auto-increment primary key
    qr_room_user_id INT,                   -- Ensure this column is not null if it's required
    qr_room_signed CHAR(1) DEFAULT 'n',             -- Use CHAR for y and n
    qr_room_token VARCHAR(256),    
    qr_room_client_id VARCHAR(256) NOT NULL,
    qr_room_status CHAR(1) DEFAULT 'a',             -- Single character column, default to 'a'
    qr_room_expires_at DATETIME                     -- Expiration timestamp
);