-- Migration: hold queue (reservations) for fully-issued books
CREATE TABLE IF NOT EXISTS holds (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id    UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id    UUID REFERENCES teachers(id) ON DELETE CASCADE,
    book_id       UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    requested_by  UUID NOT NULL REFERENCES users(id),
    status        VARCHAR(20) NOT NULL DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'notified', 'fulfilled', 'cancelled')),
    notified_at   TIMESTAMPTZ,
    email_sent    BOOLEAN DEFAULT FALSE,
    fulfilled_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT holds_one_borrower CHECK (
      (student_id IS NOT NULL AND teacher_id IS NULL) OR
      (student_id IS NULL AND teacher_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_holds_book   ON holds(book_id);
CREATE INDEX IF NOT EXISTS idx_holds_student ON holds(student_id);
CREATE INDEX IF NOT EXISTS idx_holds_teacher ON holds(teacher_id);
CREATE INDEX IF NOT EXISTS idx_holds_status ON holds(status);

DROP TRIGGER IF EXISTS trg_holds_updated_at ON holds;
CREATE TRIGGER trg_holds_updated_at BEFORE UPDATE ON holds
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
