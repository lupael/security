FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# In your local environment, you would uncomment the following line:
# RUN npm install

# If you are building this image manually, run 'npm install' before building.
# This step is commented out due to limitations of the current environment.

COPY . .

# In a production environment, you would build the static files
# and serve them with a web server like nginx.
# For this project, we will run the development server.

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
