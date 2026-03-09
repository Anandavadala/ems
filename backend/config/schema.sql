-- ============================================================
-- EMS - Enterprise Employee Management System
-- PostgreSQL Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ROLES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('owner', 'Super Admin with full access'),
  ('admin', 'Administrator with broad access'),
  ('hr', 'Human Resources manager'),
  ('manager', 'Team/Department Manager'),
  ('employee', 'Regular Employee')
ON CONFLICT (name) DO NOTHING;

-- ============================================================
-- DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  parent_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  head_employee_id INTEGER,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEES TABLE (Master Profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relation VARCHAR(100),
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  role_id INTEGER REFERENCES roles(id) ON DELETE SET NULL,
  designation VARCHAR(150),
  manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  location VARCHAR(200),
  date_of_joining DATE,
  probation_end_date DATE,
  confirmation_date DATE,
  employment_type VARCHAR(50) DEFAULT 'full-time', -- full-time, contract, intern
  work_mode VARCHAR(50) DEFAULT 'office', -- office, remote, hybrid
  status VARCHAR(30) DEFAULT 'active', -- active, inactive, exited
  exit_date DATE,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EMPLOYEE DOCUMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS employee_documents (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL, -- id_proof, address_proof, offer_letter, nda, bank_details
  doc_name VARCHAR(255),
  file_path VARCHAR(500),
  expiry_date DATE,
  expiry_alert_days INTEGER DEFAULT 30,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id INTEGER,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  punch_in TIMESTAMPTZ,
  punch_out TIMESTAMPTZ,
  work_hours NUMERIC(5,2),
  status VARCHAR(30) DEFAULT 'present', -- present, absent, half_day, late, wfh, holiday, weekend
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  wfh BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- ============================================================
-- LEAVE TYPES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  max_days_per_year INTEGER DEFAULT 0,
  carry_forward BOOLEAN DEFAULT FALSE,
  max_carry_forward INTEGER DEFAULT 0,
  encashable BOOLEAN DEFAULT FALSE,
  paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO leave_types (name, code, max_days_per_year, carry_forward, paid) VALUES
  ('Casual Leave', 'CL', 12, FALSE, TRUE),
  ('Sick Leave', 'SL', 12, FALSE, TRUE),
  ('Earned Leave', 'EL', 15, TRUE, TRUE),
  ('Comp-Off', 'CO', 5, FALSE, TRUE),
  ('Maternity Leave', 'ML', 180, FALSE, TRUE),
  ('Paternity Leave', 'PL', 15, FALSE, TRUE),
  ('Unpaid Leave', 'UL', 365, FALSE, FALSE)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- LEAVE BALANCES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  allocated INTEGER DEFAULT 0,
  used INTEGER DEFAULT 0,
  carried_forward INTEGER DEFAULT 0,
  balance INTEGER GENERATED ALWAYS AS (allocated + carried_forward - used) STORED,
  UNIQUE(employee_id, leave_type_id, year)
);

-- ============================================================
-- LEAVE REQUESTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested NUMERIC(5,1) NOT NULL,
  reason TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected, cancelled
  approved_by INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  approval_notes TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYROLL TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC(12,2) DEFAULT 0,
  hra NUMERIC(12,2) DEFAULT 0,
  allowances NUMERIC(12,2) DEFAULT 0,
  variable_pay NUMERIC(12,2) DEFAULT 0,
  gross_salary NUMERIC(12,2) DEFAULT 0,
  pf_deduction NUMERIC(12,2) DEFAULT 0,
  esi_deduction NUMERIC(12,2) DEFAULT 0,
  tax_deduction NUMERIC(12,2) DEFAULT 0,
  advance_deduction NUMERIC(12,2) DEFAULT 0,
  other_deductions NUMERIC(12,2) DEFAULT 0,
  total_deductions NUMERIC(12,2) DEFAULT 0,
  net_salary NUMERIC(12,2) DEFAULT 0,
  working_days INTEGER,
  days_present INTEGER,
  days_absent INTEGER,
  status VARCHAR(30) DEFAULT 'draft', -- draft, processed, paid
  payslip_generated BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, month, year)
);

-- ============================================================
-- SALARY STRUCTURE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS salary_structures (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  basic_salary NUMERIC(12,2) NOT NULL,
  hra_percent NUMERIC(5,2) DEFAULT 40,
  allowances NUMERIC(12,2) DEFAULT 0,
  variable_pay NUMERIC(12,2) DEFAULT 0,
  pf_percent NUMERIC(5,2) DEFAULT 12,
  esi_percent NUMERIC(5,2) DEFAULT 0.75,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PERFORMANCE REVIEWS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  reviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  review_period VARCHAR(50), -- Q1-2026, Annual-2025
  review_type VARCHAR(50) DEFAULT 'annual', -- annual, quarterly, pip
  goals JSONB DEFAULT '[]',
  self_rating NUMERIC(3,1),
  manager_rating NUMERIC(3,1),
  final_rating NUMERIC(3,1),
  self_feedback TEXT,
  manager_feedback TEXT,
  status VARCHAR(30) DEFAULT 'pending', -- pending, self_submitted, manager_reviewed, finalized
  review_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RECRUITMENT - JOB OPENINGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS job_openings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
  location VARCHAR(200),
  employment_type VARCHAR(50),
  positions INTEGER DEFAULT 1,
  status VARCHAR(30) DEFAULT 'open', -- open, closed, on_hold
  description TEXT,
  requirements TEXT,
  posted_date DATE DEFAULT CURRENT_DATE,
  closing_date DATE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  job_opening_id INTEGER REFERENCES job_openings(id) ON DELETE SET NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  resume_path VARCHAR(500),
  source VARCHAR(100),
  stage VARCHAR(50) DEFAULT 'applied', -- applied, screening, interview, offer, hired, rejected
  interviewer_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  offer_given BOOLEAN DEFAULT FALSE,
  offer_accepted BOOLEAN,
  expected_joining DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ASSETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  asset_tag VARCHAR(100) UNIQUE NOT NULL,
  asset_type VARCHAR(100) NOT NULL, -- laptop, mobile, id_card, access_card
  brand VARCHAR(100),
  model VARCHAR(200),
  serial_number VARCHAR(200),
  condition VARCHAR(50) DEFAULT 'good',
  status VARCHAR(30) DEFAULT 'available', -- available, issued, maintenance, retired
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  issue_date DATE,
  return_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IT ACCESS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS it_access (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  access_type VARCHAR(100) NOT NULL, -- email, vpn, software, system
  access_name VARCHAR(200) NOT NULL,
  status VARCHAR(30) DEFAULT 'active', -- active, revoked
  granted_date DATE,
  revoked_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXIT RECORDS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS exit_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  resignation_date DATE,
  last_working_date DATE,
  notice_period_days INTEGER DEFAULT 30,
  reason_category VARCHAR(100),
  resignation_letter TEXT,
  exit_interview_done BOOLEAN DEFAULT FALSE,
  exit_interview_notes TEXT,
  assets_returned BOOLEAN DEFAULT FALSE,
  it_access_revoked BOOLEAN DEFAULT FALSE,
  clearance_hr BOOLEAN DEFAULT FALSE,
  clearance_finance BOOLEAN DEFAULT FALSE,
  clearance_it BOOLEAN DEFAULT FALSE,
  clearance_manager BOOLEAN DEFAULT FALSE,
  final_settlement_amount NUMERIC(12,2),
  final_settlement_date DATE,
  settlement_status VARCHAR(30) DEFAULT 'pending',
  status VARCHAR(30) DEFAULT 'pending', -- pending, in_progress, completed
  initiated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINING TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS training (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  trainer VARCHAR(200),
  start_date DATE,
  end_date DATE,
  mandatory BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) DEFAULT 'planned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRAINING NOMINATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS training_nominations (
  id SERIAL PRIMARY KEY,
  training_id INTEGER NOT NULL REFERENCES training(id) ON DELETE CASCADE,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status VARCHAR(30) DEFAULT 'nominated',
  completion_date DATE,
  certificate_path VARCHAR(500),
  UNIQUE(training_id, employee_id)
);

-- ============================================================
-- HOLIDAY CALENDAR TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  date DATE NOT NULL UNIQUE,
  type VARCHAR(50) DEFAULT 'public',
  year INTEGER GENERATED ALWAYS AS (EXTRACT(YEAR FROM date)::INTEGER) STORED
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_month ON payroll(employee_id, month, year);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name, record_id);

-- ============================================================
-- DEFAULT DEPARTMENTS
-- ============================================================
INSERT INTO departments (name, description) VALUES
  ('Human Resources', 'HR Department'),
  ('Engineering', 'Software Engineering'),
  ('Finance', 'Finance & Accounting'),
  ('Operations', 'Business Operations'),
  ('Marketing', 'Marketing & Communications'),
  ('Sales', 'Sales Department'),
  ('Management', 'Executive Management')
ON CONFLICT (name) DO NOTHING;
