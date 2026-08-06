# Code Review Request

This file exists solely to create a commit difference between `copilot-review-audit` branch and `main` for the purpose of triggering automated GitHub Copilot code review.

## Review Scope

Full system audit of `Saudi-Payroll-System` covering:
- Security (JWT, bcrypt, input validation, SQL injection)
- Payroll calculation logic (GOSI, attendance, advances)
- Accounting integration (journal entries, retry mechanism)
- Multi-tenant isolation
- Test coverage gaps

## Instructions for Copilot

Please analyze all TypeScript files in `src/` and provide severity-tagged feedback.
