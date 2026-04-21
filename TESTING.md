# 🦈 Shark Task: Quality Assurance & Testing Report

This document outlines the testing strategy, frameworks, and results for the Shark Task platform. We utilize **Industry Standard** testing practices to ensure system reliability and security.

## 🛠 Testing Frameworks
- **Jest**: The primary testing runner for modern JavaScript/TypeScript.
- **Supertest**: Library for testing HTTP servers without a live network connection.
- **ts-jest**: TypeScript integration for Jest.

## 🎯 Testing Strategy
We follow a **Black-box Integration Testing** approach:
1. **Request Simulation**: Supertest sends real HTTP requests to the Express application.
2. **Data Mocking**: Instead of a live database, we use **Manual Mocks** for the Prisma Client. This ensures:
   - Tests are **Fast** (no DB sync required).
   - Tests are **Deterministic** (same result every time).
   - **Data Isolation** (tests don't mess up production data).

## 📊 Test Coverage Summary

| Area | Suite | Test Cases | Status |
| :--- | :--- | :---: | :--- |
| **Authentication** | `auth.test.ts` | 9 | ✅ PASS |
| **Projects** | `projects.test.ts` | 8 | ✅ PASS |
| **Tasks & Status** | `tasks.test.ts` | 6 | ✅ PASS |
| **Messaging** | `tasks.test.ts` | 5 | ✅ PASS |
| **System Health** | `auth.test.ts` | 1 | ✅ PASS |
| **Total** | | **29** | **✅ 100% Pass** |

---

## 🚀 How to Run Tests

### Prerequisites
Ensure all dependencies are installed in the `backend` directory:
```bash
cd backend
npm install
```

### Running the Test Suite
Execute the following command to run all tests with a verbose output:
```bash
npm test
```

---

## 🔍 Sample Test Result
```text
PASS tests/tasks.test.ts
PASS tests/auth.test.ts
PASS tests/projects.test.ts

Test Suites: 3 passed, 3 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        1.072 s
Ran all test suites.
```

---

## 🧠 Technical Highlights for Presentation

### 1. Permission Logic Validation (RBAC)
We test that a `Worker` cannot create projects or tasks (returns `403 Forbidden`). Only `Manager` or `Admin` roles have authorization for these actions.

### 2. State Transition Tracking
Our tests verify that when a task status changes:
- `In_Progress`: Automatically sets the `started_at` timestamp.
- `Closed`: Automatically sets the `completed_at` timestamp.

### 3. Real-time Message Decoupling
We use **Jest Mocks** for the Socket.io engine to verify that messages are triggered without needing a live WebSocket server during the test run.
