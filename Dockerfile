# Use lightweight nginx image
FROM nginx:alpine

# Copy your application files to nginx html directory
COPY . /usr/share/nginx/html

# Configure CORS headers
RUN echo ' \
server { \
    listen 80; \
    server_name localhost; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
        \
        # CORS configuration \
        add_header Access-Control-Allow-Origin *; \
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS"; \
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range"; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80 