FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

# In your local environment, you would uncomment the following line:
# RUN npm install

# If you are building this image manually, run 'npm install' before building.
# This step is commented out due to limitations of the current environment.

COPY . .

EXPOSE 5001

CMD ["node", "server.js"]
