-- Create index on id field in dummy_db.users table
-- This assumes the table already exists

-- Option 1: If the table uses id as the ORDER BY key (most efficient)
-- The id field is already indexed since it's the primary sort key
-- No additional index needed

-- Option 2: Create a secondary index if needed for specific query patterns
CREATE INDEX IF NOT EXISTS idx_users_id ON dummy_db.users (id) TYPE minmax GRANULARITY 1;

-- Option 3: If you want a different index type for specific use cases
-- CREATE INDEX IF NOT EXISTS idx_users_id_set ON dummy_db.users (id) TYPE set(100) GRANULARITY 1;

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
