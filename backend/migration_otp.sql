-- Migration: one-time-passcodes for Gmail-based password reset
CREATE TABLE IF NOT EXISTS otp_codes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email            VARCHAR(150) NOT NULL,
    otp_hash         VARCHAR(64) NOT NULL,
    purpose          VARCHAR(30) NOT NULL DEFAULT 'password_reset',
    expires_at       TIMESTAMPTZ NOT NULL,
    attempts         INT NOT NULL DEFAULT 0,
    consumed         BOOLEAN NOT NULL DEFAULT FALSE,
    verified_at      TIMESTAMPTZ,
    reset_token      VARCHAR(64),
    reset_expires_at TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);
