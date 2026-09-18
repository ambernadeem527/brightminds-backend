-- Step 1: Clean slate configuration. Clear historical structures to ensure seamless testing sweeps.
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tutors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create Master Accounts Sheet (Users Table)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('STUDENT', 'TUTOR', 'ADMIN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create Specialized Instructor Information Sheet (Tutors Table)
-- Each row here maps directly back to a parent credentials account row in the users table
CREATE TABLE tutors (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject_expertise VARCHAR(100) NOT NULL, -- e.g., '9th Grade Physics', '7th Grade Mathematics'
    bio TEXT NOT NULL,
    hourly_rate NUMERIC(10, 2) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE
);

-- Step 4: Create Operational Schedule Booking Sheet (Bookings Table)
-- Connects a student account with a verified tutor profile record
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    student_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutor_id INT NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    booking_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
