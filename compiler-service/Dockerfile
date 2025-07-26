# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm ci

# Keep this debugging line temporarily to confirm installation during build
RUN ls -l node_modules/@google/generative-ai || echo "--- DEBUG: @google/generative-ai NOT FOUND in node_modules after npm ci ---"

# Install compilers/interpreters
RUN apt-get update && \
    apt-get install -y build-essential python3 default-jdk && \
    apt-get clean

# Optional: Set JAVA_HOME if needed
ENV JAVA_HOME /usr/lib/jvm/default-java
ENV PATH $JAVA_HOME/bin:$PATH

# Copy source code (excluding .env and node_modules due to .dockerignore)
COPY . .

# Ensure proper permissions (run as root, then switch to non-root user for security)
RUN chown -R node:node /usr/src/app
USER node

# Expose app port
EXPOSE 8000

# Start the app
CMD ["npm", "start"]