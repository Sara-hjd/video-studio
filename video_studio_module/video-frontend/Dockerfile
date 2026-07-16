FROM node:18-alpine

# Set work directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables for network access
ENV HOST=0.0.0.0
ENV FAST_REFRESH=false

# Start the development server
CMD ["npm", "run", "start:http"] 