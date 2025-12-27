-- 1. Create ENUM types for data integrity
CREATE TYPE user_role AS ENUM ('admin', 'seller', 'scanner');
CREATE TYPE ticket_type AS ENUM ('student', 'student_guest', 'outsider');
CREATE TYPE ticket_status AS ENUM ('issued', 'checked-in');

-- 2. USERS Table
-- Stores Admin, Sellers, and Scanners
CREATE TABLE Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS Table (Master List)
-- A single list of students shared across all events.
CREATE TABLE Students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(100) UNIQUE NOT NULL, -- e.g. "S-1045"
    name VARCHAR(255) NOT NULL,
    current_class VARCHAR(100) NOT NULL, -- e.g. "Class 5"
    
    -- Soft delete: If they graduate, set to FALSE instead of deleting rows
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. EVENTS Table
-- Stores event details and time windows
CREATE TABLE Events (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_startdate TIMESTAMPTZ NOT NULL,
    event_enddate TIMESTAMPTZ NOT NULL,
    
    -- Pricing (Optional, set to 0 if free)
    student_price DECIMAL(10, 2) DEFAULT 0,
    other_price DECIMAL(10, 2) DEFAULT 0,

    -- Control Windows
    ticket_sale_start TIMESTAMPTZ NOT NULL,
    check_in_start TIMESTAMPTZ NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

    -- Constraint: Ensure logical timeline
    CONSTRAINT check_event_times CHECK (event_startdate <= event_enddate)
);

-- 5. TICKETS Table (The Core)
-- Handles Students, Guests, and Outsiders
CREATE TABLE Tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(), -- The QR Code content
    
    -- Relationships
    event_id INT NOT NULL REFERENCES Events(id),
    issued_by_user_id INT NOT NULL REFERENCES Users(id),
    
    -- LINK TO MASTER STUDENT (Nullable)
    -- If NULL, it means the ticket is for a generic "Outsider"
    student_id INT REFERENCES Students(id),
    
    -- Attendee Details (Snapshots)
    attendee_name VARCHAR(255) NOT NULL, 
    
    -- We save the CLASS here at the moment of purchase.
    -- This ensures history stays correct even if the student promotes next year.
    attendee_class VARCHAR(100), 
    
    -- Type & Status
    attendee_type ticket_type NOT NULL, -- 'student', 'student_guest', 'outsider'
    status ticket_status NOT NULL DEFAULT 'issued',

    -- Price
    price NUMERIC(10, 2) NOT NULL,
    
    -- Verification
    checked_in_at TIMESTAMPTZ,
    checked_in_by_user_id INT REFERENCES Users(id),
    
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
-- Seed Data (Users)
-- Plain text passwords as requested
INSERT INTO Users (name, email, password_hash, role) VALUES
    ('Admin User', 'admin@brick.school', 'admin123', 'admin'),
    ('Ticket Seller', 'seller@brick.school', 'seller123', 'seller'),
    ('Ticket Scanner', 'scanner@brick.school', 'scanner123', 'scanner')
ON CONFLICT (email) DO NOTHING;
