-- Drop types if they exist to avoid conflict on re-runs (be careful in prod!)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS ticket_type CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;

-- Drop tables if they exist to avoid conflict
DROP TABLE IF EXISTS Tickets CASCADE;
DROP TABLE IF EXISTS EventInvitees CASCADE;
DROP TABLE IF EXISTS Events CASCADE;
DROP TABLE IF EXISTS Users CASCADE;

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'scanner');
CREATE TYPE ticket_type AS ENUM ('student', 'guest');
CREATE TYPE ticket_status AS ENUM ('issued', 'checked-in');

-- Tables
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL
);

CREATE TABLE IF NOT EXISTS Events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    ticket_sales_start TIMESTAMPTZ NOT NULL,
    ticket_sales_end TIMESTAMPTZ NOT NULL,
    check_in_start TIMESTAMPTZ NOT NULL,
    check_in_end TIMESTAMPTZ NOT NULL,
    CONSTRAINT check_times CHECK (ticket_sales_end < check_in_start)
);

CREATE TABLE IF NOT EXISTS EventInvitees (
    id SERIAL PRIMARY KEY,
    event_id INT REFERENCES Events(id) ON DELETE CASCADE,
    student_identifier VARCHAR(100) NOT NULL, -- e.g. "S-101"
    name VARCHAR(255) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    has_been_issued BOOLEAN DEFAULT FALSE,
    UNIQUE(event_id, student_identifier)
);

CREATE TABLE IF NOT EXISTS Tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- The QR Code content
    event_id INT REFERENCES Events(id),
    associated_invitee_id INT REFERENCES EventInvitees(id), -- Links Guest to Student
    issued_by_user_id INT REFERENCES Users(id),
    attendee_name VARCHAR(255) NOT NULL,
    attendee_type ticket_type NOT NULL, -- 'student' or 'guest'
    status ticket_status DEFAULT 'issued',
    checked_in_at TIMESTAMPTZ,
    checked_in_by_user_id INT REFERENCES Users(id)
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Seed Data (Users)
-- Plain text passwords as requested
INSERT INTO Users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@brick.school', 'admin123', 'admin'),
    ('Ticket Seller', 'seller@brick.school', 'seller123', 'seller'),
    ('Ticket Scanner', 'scanner@brick.school', 'scanner123', 'scanner')
ON CONFLICT (email) DO NOTHING;
