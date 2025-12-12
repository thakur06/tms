# ---------- 1. Build Stage ----------
    FROM node:18-alpine AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    RUN npm run build
    
    
    # ---------- 2. Production Stage ----------
    FROM nginx:alpine
    
    # Remove default nginx site
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy React build to nginx html folder
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # Copy custom Nginx config
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    
    CMD ["nginx", "-g", "daemon off;"]
    