-- Create index on id field in dummy_db.users table
-- ClickHouse syntax for creating indexes

-- Option 1: Create a minmax index (most common for numeric fields)
ALTER TABLE dummy_db.users ADD INDEX idx_users_id id TYPE minmax GRANULARITY 1;

-- Option 2: If you want a set index for exact lookups
-- ALTER TABLE dummy_db.users ADD INDEX idx_users_id_set id TYPE set(100) GRANULARITY 1;

-- Option 3: If you want a bloom filter index
-- ALTER TABLE dummy_db.users ADD INDEX idx_users_id_bloom id TYPE bloom_filter GRANULARITY 1;

-- Verify the index was created
SHOW CREATE TABLE dummy_db.users;

-- Check existing indexes
SELECT
    table,
    name,
    type,
    expr
FROM system.data_skipping_indices
WHERE database = 'dummy_db' AND table = 'users';
