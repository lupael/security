# Security & Optimization Checker Website

This project is a full-stack web application that allows users to run automated security, optimization, and design checks on URLs, IPs, or domains. The system identifies potential vulnerabilities, misconfigurations, and SEO flaws, and provides actionable recommendations in a clear, visualized report.

## Features

- **User Authentication:** Secure user registration and login using JWT.
- **Scanning:** Users can submit targets (URLs, IPs, domains) for scanning.
- **Mock Scan Processing:** A mock scanning engine simulates a comprehensive analysis, generating findings across various categories.
- **Detailed Reporting:** Scan results are presented in a detailed report with charts visualizing findings by severity and category.
- **Report Exporting:** Users can export their scan reports as either PDF or CSV files.
- **Real-Time Updates:** The frontend receives real-time notifications when scans are completed using WebSockets (Socket.IO).
- **Administrator Dashboard:** A secure, role-protected dashboard for administrators to manage the platform.
  - **User Management:** View and delete users.
  - **Platform-wide Scans & Logs:** View all scans and logs across the system.
- **Multi-Language Support:** The user interface is available in English and Spanish, with an easy-to-use language switcher.

## Technology Stack

### Backend
- **Framework:** Node.js with Express.js
- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Authentication:** JSON Web Tokens (JWT)
- **Real-Time Communication:** Socket.IO
- **Report Generation:** `pdfkit` (for PDF), `json2csv` (for CSV)
- **Testing:** Jest & Supertest

### Frontend
- **Framework:** React with Vite
- **UI Library:** Material-UI
- **Routing:** React Router
- **Data Fetching:** Axios
- **Charts:** Recharts
- **Internationalization:** i18next
- **Real-Time Communication:** Socket.IO Client

### Deployment
- **Containerization:** Docker & Docker Compose

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/products/docker-desktop/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Installation & Setup

**1. Install Dependencies**

This project uses a monorepo structure. Before building the Docker images or running locally, you must install the npm packages for both services.

```bash
# Install backend dependencies
npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend
```

**2. Run with Docker (Recommended)**

The easiest way to get the entire application stack running is with Docker Compose.

```bash
# From the project root, build and start the containers
docker-compose up --build
```
The services will be available at the following locations:
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5001](http://localhost:5001)
- **PostgreSQL Database:** `localhost:5432`

**3. Run Locally (Alternative)**

If you prefer to run the services without Docker:

**Backend:**
```bash
# Navigate to the backend directory
cd backend

# Ensure you have a PostgreSQL server running and update the
# DATABASE_URL in the .env file with your credentials.

# Start the backend server
npm run dev
```

**Frontend:**
```bash
# Navigate to the frontend directory
cd frontend

# Start the frontend development server
npm run dev
```

### Admin Access

To access the administrator dashboard, you first need to create a user account through the application's registration form. After that, you must manually update that user's `role` in the `Users` table of your PostgreSQL database from `user` to `admin`.

Once you log in with this admin account, a button to access the admin dashboard will appear.

## API Endpoints

- `POST /api/auth/register` - Register a new user.
- `POST /api/auth/login` - Log in a user and receive a JWT.
- `POST /api/scans` - Start a new scan (requires authentication).
- `GET /api/scans` - Get all scans for the logged-in user (requires authentication).
- `GET /api/scans/:id` - Get a specific scan report (requires authentication).
- `GET /api/reports/:scanId/export?format=<pdf|csv>` - Export a report (requires authentication).
- `GET /api/admin/users` - Get all users (requires admin privileges).
- `DELETE /api/admin/users/:id` - Delete a user (requires admin privileges).
- `GET /api/admin/scans` - Get all scans on the platform (requires admin privileges).
- `GET /api/admin/logs` - Get all logs (requires admin privileges).

## Database Schema

The database schema is managed by Sequelize and consists of the following tables:

- **Users:** Stores user information (`id`, `username`, `email`, `password_hash`, `role`).
- **Scans:** Stores information about each scan (`id`, `user_id`, `target`, `status`).
- **Findings:** Stores the results of each scan (`id`, `scan_id`, `category`, `severity`, `description`, `recommendation`).
- **Reports:** (Schema defined, functionality for storing report files can be extended).
- **Logs:** (Schema defined for future logging implementation).
