-- Migration 003: Cleanup Invalid Category IDs
-- This script removes categories with invalid UUID format (like "1", "2", etc.)

-- Step 1: Delete expense_categories entries that reference invalid category IDs
DELETE FROM expense_categories
WHERE category_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 2: Delete categories with invalid UUID format
DELETE FROM categories
WHERE id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Step 3: Verify cleanup
SELECT 'Categories cleaned up successfully' as message;
SELECT COUNT(*) as remaining_categories FROM categories;
