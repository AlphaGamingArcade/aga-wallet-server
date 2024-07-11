CREATE TABLE blockchain_user (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    email VARCHAR(128) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    name VARCHAR(128) NOT NULL,
    services TEXT,
    role CHAR(1) NOT NULL,
    picture TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE blockchain_wallet (
    wallet_id INT IDENTITY(1, 1) PRIMARY KEY,
    wallet_user_id INT NOT NULL,
    wallet_account VARCHAR(12) NOT NULL UNIQUE,
    wallet_alias VARCHAR(128) NULL,
    wallet_status CHAR(1) NOT NULL, -- A for active, I for inactive
    wallet_mnemonic VARCHAR(256) NOT NULL UNIQUE, -- Increased size for mnemonic
    wallet_address VARCHAR(256) NOT NULL UNIQUE,
    wallet_password VARCHAR(20) NOT NULL, -- Increased size for password
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);