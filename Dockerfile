FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build TypeScript to JavaScript
RUN npm run build

# Expose port (Matches default or process port)
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
