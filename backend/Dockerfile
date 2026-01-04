FROM node:20

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace definitions (required for npm workspaces)
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies, including sequelize-cli from the root
RUN npm ci

# Copy backend source code
COPY backend ./backend

# Make entrypoint script executable
RUN chmod +x ./backend/entrypoint.sh

EXPOSE 3001

# Use entrypoint to run migrations and then start the app
ENTRYPOINT ["./backend/entrypoint.sh"]

# Command to run the main application
CMD ["node", "backend/index.js"]