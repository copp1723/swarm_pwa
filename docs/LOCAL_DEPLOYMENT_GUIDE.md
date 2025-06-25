# SWARM Local Deployment Guide

## Quick Start

```bash
git clone <repository-url>
cd swarm
npm install
export DATABASE_URL="your-database-url"
export OPENROUTER_API_KEY="your-openrouter-key"
npm run dev
```

Access SWARM at `http://localhost:5000` with full desktop filesystem access.

## Production Deployment

### Build for Production
```bash
npm run build
npm start
```

### Custom Port Configuration
```bash
export PORT=3000
npm start
```

## Custom Domain Setup

### 1. DNS Configuration
Point your domain to your machine:
```
A Record: swarm.yourdomain.com → Your Public IP
```

### 2. Router Configuration
Forward external traffic to your machine:
- Port 80 → Your Machine IP:5000
- Port 443 → Your Machine IP:5000 (for HTTPS)

### 3. SSL Certificate (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d swarm.yourdomain.com

# Configure nginx proxy (optional)
sudo apt install nginx
```

### 4. Nginx Proxy Configuration
Create `/etc/nginx/sites-available/swarm`:
```nginx
server {
    listen 80;
    server_name swarm.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/swarm /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Environment Variables

Create `.env` file:
```env
DATABASE_URL=postgresql://user:pass@localhost:5432/swarm
OPENROUTER_API_KEY=your_key_here
PROJECT_TRACKER_API_KEY=your_key_here
PROJECT_TRACKER_URL=https://your-tracker-url.com
PORT=5000
NODE_ENV=production
```

## Process Management

### Using PM2 (Recommended)
```bash
npm install -g pm2
pm2 start npm --name "swarm" -- start
pm2 startup
pm2 save
```

### Using systemd
Create `/etc/systemd/system/swarm.service`:
```ini
[Unit]
Description=SWARM Multi-Agent System
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/swarm
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable service:
```bash
sudo systemctl enable swarm
sudo systemctl start swarm
```

## MCP Filesystem Access

Once deployed locally, SWARM agents can access:
- `desktop/CCL-3` - Your actual desktop projects
- Any directory on your machine
- Full filesystem operations (read, write, analyze)

## Security Considerations

1. **Firewall Configuration**: Only expose necessary ports
2. **HTTPS**: Always use SSL for external access
3. **Authentication**: Consider adding authentication for external access
4. **Network Access**: Limit access to trusted networks if possible

## Troubleshooting

### Port Already in Use
```bash
sudo lsof -i :5000
kill -9 <PID>
```

### DNS Not Resolving
- Check DNS propagation: `nslookup swarm.yourdomain.com`
- Verify router port forwarding
- Check firewall rules

### Database Connection Issues
- Verify DATABASE_URL format
- Check database server status
- Ensure network connectivity

## Benefits of Local Deployment

✅ Full MCP filesystem access to desktop/CCL-3  
✅ Custom domain support  
✅ Enhanced privacy and security  
✅ No cloud service dependencies  
✅ Faster performance  
✅ Complete control over environment  

Your SWARM instance will have full access to analyze and work with your CCL-3 project files directly.