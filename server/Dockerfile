# Dockerfile (Save this as 'Dockerfile' inside C:\Users\aditi\OneDrive\Desktop\CodeClash\server)

# Stage 1: Build the application (for installing dependencies)
# Using a Node.js base image suitable for development and building
FROM node:20-alpine AS builder

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker's caching
# This step is cached unless package.json or package-lock.json changes
COPY package*.json ./

# Install application dependencies
# `npm ci` is used for clean installs based on package-lock.json, good for CI/CD
RUN npm ci --only=production

# Copy the rest of the application code
# This copies all files from the current directory (server/) into the container
COPY . .

# Stage 2: Create a smaller, production-ready image
# Using a lighter Node.js runtime for the final image to reduce its size
FROM node:20-alpine

# Set the working directory for the final image
WORKDIR /usr/src/app

# Copy only the installed node_modules and application code from the builder stage
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app ./

# Expose the port your Node.js application listens on
# Your server.js uses process.env.PORT. We'll use a common default like 8000
# Make sure your actual application listens on this port if process.env.PORT is not set
EXPOSE 8000

# Define the command to run your application
# This will execute 'node server.js' when the container starts
CMD [ "node", "server.js" ]