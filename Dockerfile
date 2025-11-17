# Stage 1: Build Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments for floor configuration and demo data
ARG VITE_LOAD_INITIAL_DATA
ARG VITE_FLOOR_WIDTH
ARG VITE_FLOOR_LENGTH
ARG VITE_ZONE_ID
ARG VITE_ZONE_POSITION
ARG VITE_GROUND_CONTROL_POINTS
ARG VITE_DEMO_FENCES

# Pass build arguments as environment variables for Vite build
ENV VITE_LOAD_INITIAL_DATA=$VITE_LOAD_INITIAL_DATA
ENV VITE_FLOOR_WIDTH=$VITE_FLOOR_WIDTH
ENV VITE_FLOOR_LENGTH=$VITE_FLOOR_LENGTH
ENV VITE_ZONE_ID=$VITE_ZONE_ID
ENV VITE_ZONE_POSITION=$VITE_ZONE_POSITION
ENV VITE_GROUND_CONTROL_POINTS=$VITE_GROUND_CONTROL_POINTS
ENV VITE_DEMO_FENCES=$VITE_DEMO_FENCES

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

