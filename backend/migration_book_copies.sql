-- ============================================================
-- MIGRATION: Add Book Copies (Per-Copy Tracking)
-- Each physical copy gets its own unique code
-- ============================================================

-- 1. Create book_copies table
CREATE TABLE IF NOT EXISTS book_copies (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    book_id     UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    copy_code   VARCHAR(50) UNIQUE NOT NULL,
    status      VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'issued', 'lost')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copies_book   ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_copies_code   ON book_copies(copy_code);
CREATE INDEX IF NOT EXISTS idx_copies_status ON book_copies(status);

-- 2. Add trigger for book_copies updated_at
CREATE TRIGGER trg_copies_updated_at BEFORE UPDATE ON book_copies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Add copy_id and copy_code columns to issued_books
ALTER TABLE issued_books ADD COLUMN IF NOT EXISTS copy_id UUID REFERENCES book_copies(id) ON DELETE SET NULL;
ALTER TABLE issued_books ADD COLUMN IF NOT EXISTS copy_code VARCHAR(50);

-- 4. Generate individual copies for each existing book
--    Book "MATH" with 3 copies -> MATH-001, MATH-002, MATH-003
DO $$
DECLARE
  rec RECORD;
  i INT;
BEGIN
  FOR rec IN SELECT id, book_code, total_copies FROM books ORDER BY created_at LOOP
    FOR i IN 1..rec.total_copies LOOP
      INSERT INTO book_copies (book_id, copy_code, status)
      VALUES (rec.id, rec.book_code || '-' || LPAD(i::TEXT, 3, '0'), 'available');
    END LOOP;
  END LOOP;
END $$;

-- 5. Mark copies that are currently issued
UPDATE book_copies bc
SET status = 'issued'
FROM issued_books ib
WHERE ib.book_id = bc.book_id
  AND ib.is_returned = FALSE
  AND bc.status = 'available'
  AND bc.id IN (
    SELECT bc2.id FROM book_copies bc2
    WHERE bc2.book_id = ib.book_id AND bc2.status = 'available'
    ORDER BY bc2.copy_code
    LIMIT 1
  );
