## Features

- **User Authentication:** Secure user registration and login using JWT.
- **Web Scanning:** Users can submit targets (URLs) for scanning against common security and SEO vulnerabilities.
- **Network Device Scanning:** Scan network devices like routers and switches via SNMP (v2c and v3) and SSH to gather system information and identify issues.
- **Secure Credential Management:** A secure system for storing and managing SSH and SNMPv3 credentials, with encryption at rest.
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
- **Device Scanning:** `net-snmp`, `node-ssh`
- **Encryption:** Node.js `crypto` module
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
  - **Body (for Web Scan):** `{ "target": "https://example.com", "type": "WEB" }`
  - **Body (for Network Scan):** `{ "target": "192.168.1.1", "type": "NETWORK", "credentialId": 1 }` (credentialId is optional).
- `GET /api/scans` - Get all scans for the logged-in user (requires authentication).
- `GET /api/scans/:id` - Get a specific scan report (requires authentication).
- `GET /api/reports/:scanId/export?format=<pdf|csv>` - Export a report (requires authentication).
- `POST /api/credentials` - Create a new credential (requires authentication).
- `GET /api/credentials` - Get all credentials for the logged-in user (requires authentication).
- `PUT /api/credentials/:id` - Update a credential (requires authentication).
- `DELETE /api/credentials/:id` - Delete a credential (requires authentication).
- `GET /api/admin/users` - Get all users (requires admin privileges).
- `DELETE /api/admin/users/:id` - Delete a user (requires admin privileges).
- `GET /api/admin/scans` - Get all scans on the platform (requires admin privileges).
- `GET /api/admin/logs` - Get all logs (requires admin privileges).

## Dependency Management

Keeping dependencies up-to-date is critical for the security and stability of the application. This project uses `npm-check-updates` to help manage dependency updates.

To check for outdated dependencies in the backend, run the following command:

```bash
# From the backend directory
npm run check-updates
```

This will list any outdated dependencies. To upgrade the dependencies, you can run:

```bash
# From the backend directory
ncu -u
```

It is also highly recommended to enable automated dependency management services like [GitHub's Dependabot](https://docs.github.com/en/code-security/dependabot) to automatically create pull requests for dependency updates.

## Database Schema

The database schema is managed by Sequelize and consists of the following tables:

- **Users:** Stores user information (`id`, `username`, `email`, `password_hash`, `role`).
- **Credentials:** Stores encrypted credentials for SSH and SNMPv3 (`id`, `name`, `type`, `username`, `secret`).
- **Scans:** Stores information about each scan (`id`, `user_id`, `target`, `status`, `type`, `credentialId`).
- **Findings:** Stores the results of each scan (`id`, `scan_id`, `category`, `severity`, `description`, `recommendation`, `protocol`, `port`, `host`).
- **Reports:** (Schema defined, functionality for storing report files can be extended).
- **Logs:** (Schema defined for future logging implementation).
