-- Create dummy_db database
CREATE DATABASE IF NOT EXISTS dummy_db;

-- Use the dummy_db database
USE dummy_db;

-- Create users table with id field
CREATE TABLE IF NOT EXISTS users (
    id UInt32,
    name String,
    email String,
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY id;

-- Create index on id field
-- Note: In ClickHouse, the primary key automatically creates an index
-- Since we're ordering by id, it's already indexed
-- If you want an additional index, you can create a secondary index:

-- Create a secondary index on id field (if needed for specific query patterns)
CREATE INDEX IF NOT EXISTS idx_users_id ON users (id) TYPE minmax GRANULARITY 1;

-- Insert some sample data
INSERT INTO dummy_db.users (id, name, email) VALUES
    (1, 'John Doe', 'john.doe@example.com'),
    (2, 'Jane Smith', 'jane.smith@example.com'),
    (3, 'Bob Johnson', 'bob.johnson@example.com'),
    (4, 'Alice Brown', 'alice.brown@example.com'),
    (5, 'Charlie Wilson', 'charlie.wilson@example.com');

-- Verify the index was created
SHOW CREATE TABLE dummy_db.users;
