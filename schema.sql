-- Payroll System SQL Database Schema with JWT Authentication, Roles, and pgcrypto Encryption
-- File: schema.sql

-- Enable pgcrypto extension for database-level AES-256 / PGP encryption of sensitive PII (national_id & iban)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 0. Companies Table (Multi-Tenant)
CREATE TABLE IF NOT EXISTS companies (
    id VARCHAR(50) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    cr_number VARCHAR(50),
    currency VARCHAR(10) DEFAULT 'SAR',
    currency_symbol VARCHAR(10) DEFAULT 'ر.س',
    chart_of_accounts JSONB NOT NULL,
    wps_config JSONB NOT NULL,
    accounting_api_config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE SET NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(50) NOT NULL REFERENCES roles(name) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    refresh_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    head_name VARCHAR(100),
    employee_count INT DEFAULT 0
);

-- 4. Employees Table with encrypted sensitive fields (national_id and iban) and company_id
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    employee_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    national_id VARCHAR(255), -- AES-256 encrypted using pgcrypto pgp_sym_encrypt() or application-level crypto
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    department VARCHAR(100) NOT NULL,
    position VARCHAR(100) NOT NULL,
    join_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    employment_type VARCHAR(30) DEFAULT 'full_time',
    bank_name VARCHAR(100),
    iban VARCHAR(255), -- AES-256 encrypted IBAN
    basic_salary NUMERIC(12, 2) NOT NULL,
    housing_allowance NUMERIC(12, 2) DEFAULT 0,
    transport_allowance NUMERIC(12, 2) DEFAULT 0,
    tax_exempt BOOLEAN DEFAULT FALSE,
    social_security_enrolled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_emp_code_per_company UNIQUE (company_id, employee_code)
);

-- pgcrypto Database-Level Encryption Helper Queries Example:
-- 1) Insert with pgcrypto:
--    INSERT INTO employees (id, employee_code, first_name, last_name, national_id, email, iban, basic_salary, join_date, department, position)
--    VALUES ('emp-101', 'EMP-001', 'Mohammed', 'Al-Ghamdi',
--            pgp_sym_encrypt('1010123456', 'apex-payroll-encryption-key'),
--            'm.alghamdi@apexpayroll.com',
--            pgp_sym_encrypt('SA0380000000608010101001', 'apex-payroll-encryption-key'),
--            18500, '2022-03-15', 'Software Engineering', 'Senior Engineer');
-- 2) Decrypt for WPS Bank File Generation:
--    SELECT employee_code, first_name, last_name,
--           pgp_sym_decrypt(national_id::bytea, 'apex-payroll-encryption-key') AS decrypted_national_id,
--           pgp_sym_decrypt(iban::bytea, 'apex-payroll-encryption-key') AS decrypted_iban
--    FROM employees WHERE id = 'emp-101';

-- 5. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) REFERENCES employees(id) ON DELETE CASCADE,
    period VARCHAR(7) NOT NULL, -- YYYY-MM
    working_days INT DEFAULT 30,
    present_days INT DEFAULT 30,
    unpaid_absence_days INT DEFAULT 0,
    overtime_hours NUMERIC(6, 2) DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Payroll Runs Table
CREATE TABLE IF NOT EXISTS payroll_runs (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    run_code VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    period VARCHAR(7) NOT NULL,
    status VARCHAR(30) DEFAULT 'draft',
    total_employees INT DEFAULT 0,
    total_gross_pay NUMERIC(14, 2) DEFAULT 0,
    total_deductions NUMERIC(14, 2) DEFAULT 0,
    total_employer_contributions NUMERIC(14, 2) DEFAULT 0,
    total_net_pay NUMERIC(14, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculated_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by VARCHAR(100),
    CONSTRAINT unique_run_code_per_company UNIQUE (company_id, run_code)
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) REFERENCES companies(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(100) NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    details TEXT,
    module VARCHAR(50)
);

-- 8. Accounting Journal Entries Table
CREATE TABLE IF NOT EXISTS accounting_journal_entries (
    id VARCHAR(50) PRIMARY KEY,
    company_id VARCHAR(50) NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    run_id VARCHAR(50) REFERENCES payroll_runs(id) ON DELETE SET NULL,
    run_code VARCHAR(50) NOT NULL,
    reference VARCHAR(50) NOT NULL,
    period VARCHAR(7) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'confirmed', 'failed')),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 5,
    total_debit NUMERIC(14, 2) DEFAULT 0,
    total_credit NUMERIC(14, 2) DEFAULT 0,
    journal_data JSONB NOT NULL,
    last_error TEXT,
    transaction_id VARCHAR(100),
    alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Seed Default Roles
INSERT INTO roles (id, name, display_name, description) VALUES
('role-admin', 'admin', 'System Administrator', 'Full system access to all resources, user management, and configuration settings.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, display_name, description) VALUES
('role-hr-manager', 'hr_manager', 'HR Manager', 'Manage employees, attendance, and view payroll calculations.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, display_name, description) VALUES
('role-accountant', 'accountant', 'Finance Accountant', 'Process payroll runs, approve batches, generate payslips and WPS export files.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, display_name, description) VALUES
('role-viewer', 'viewer', 'Auditor / Viewer', 'Read-only access to employee directory, payroll runs, payslips, and reports.')
ON CONFLICT (id) DO NOTHING;

-- Seed Default Users (Passwords are hashed with bcrypt in the application layer)
-- Default Login Passwords:
-- admin / admin@apexpayroll.com => AdminPassword123!
-- hr_manager / hr@apexpayroll.com => HrPassword123!
-- accountant / accountant@apexpayroll.com => AccountantPassword123!
-- viewer / viewer@apexpayroll.com => ViewerPassword123!
