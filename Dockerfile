# Stage 1: Build Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend application
RUN npm run build

# Stage 2: Production with Node.js and Nginx
FROM node:18-alpine

# Install nginx and supervisor
RUN apk add --no-cache nginx supervisor

# Create nginx directories
RUN mkdir -p /run/nginx

# Copy built frontend files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Copy proxy server files
WORKDIR /app
COPY package.json package-lock.json* ./
COPY server.js ./

# Install only production dependencies for proxy server
RUN npm ci --only=production

# Create supervisor configuration
RUN mkdir -p /etc/supervisor.d
RUN echo "[supervisord]" > /etc/supervisor.d/supervisord.ini && \
    echo "nodaemon=true" >> /etc/supervisor.d/supervisord.ini && \
    echo "user=root" >> /etc/supervisor.d/supervisord.ini && \
    echo "" >> /etc/supervisor.d/supervisord.ini && \
    echo "[program:nginx]" >> /etc/supervisor.d/supervisord.ini && \
    echo "command=nginx -g 'daemon off;'" >> /etc/supervisor.d/supervisord.ini && \
    echo "autostart=true" >> /etc/supervisor.d/supervisord.ini && \
    echo "autorestart=true" >> /etc/supervisor.d/supervisord.ini && \
    echo "stdout_logfile=/dev/stdout" >> /etc/supervisor.d/supervisord.ini && \
    echo "stdout_logfile_maxbytes=0" >> /etc/supervisor.d/supervisord.ini && \
    echo "stderr_logfile=/dev/stderr" >> /etc/supervisor.d/supervisord.ini && \
    echo "stderr_logfile_maxbytes=0" >> /etc/supervisor.d/supervisord.ini && \
    echo "" >> /etc/supervisor.d/supervisord.ini && \
    echo "[program:proxy]" >> /etc/supervisor.d/supervisord.ini && \
    echo "command=node /app/server.js" >> /etc/supervisor.d/supervisord.ini && \
    echo "directory=/app" >> /etc/supervisor.d/supervisord.ini && \
    echo "autostart=true" >> /etc/supervisor.d/supervisord.ini && \
    echo "autorestart=true" >> /etc/supervisor.d/supervisord.ini && \
    echo "stdout_logfile=/dev/stdout" >> /etc/supervisor.d/supervisord.ini && \
    echo "stdout_logfile_maxbytes=0" >> /etc/supervisor.d/supervisord.ini && \
    echo "stderr_logfile=/dev/stderr" >> /etc/supervisor.d/supervisord.ini && \
    echo "stderr_logfile_maxbytes=0" >> /etc/supervisor.d/supervisord.ini

# Expose ports (80 for nginx, 3001 for proxy)
EXPOSE 80 3001

# Start supervisor to manage both nginx and node server
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]

