-- ============================================================
-- MIGRATION: Add Book Code (Unique Copy Identifier)
-- Run this to enable per-copy book tracking in the LMS
-- ============================================================

-- 1. Add book_code column to books table (unique identifier per book entry)
ALTER TABLE books ADD COLUMN IF NOT EXISTS book_code VARCHAR(50);

-- 2. Populate existing books with auto-generated codes
DO $$
DECLARE
  rec RECORD;
  counter INT := 1;
BEGIN
  FOR rec IN SELECT id FROM books ORDER BY created_at LOOP
    UPDATE books SET book_code = 'BK-' || LPAD(counter::TEXT, 4, '0') WHERE id = rec.id;
    counter := counter + 1;
  END LOOP;
END $$;

-- 3. Make book_code NOT NULL and UNIQUE after backfilling
ALTER TABLE books ALTER COLUMN book_code SET NOT NULL;
ALTER TABLE books ADD CONSTRAINT books_book_code_unique UNIQUE (book_code);

-- 4. Add index for book_code searches
CREATE INDEX IF NOT EXISTS idx_books_code ON books(book_code);

-- 5. Add book_code column to issued_books table (tracks which book copy was issued)
ALTER TABLE issued_books ADD COLUMN IF NOT EXISTS book_code VARCHAR(50);
