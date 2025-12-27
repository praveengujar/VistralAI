# Nginx Reverse Proxy Setup for Firecrawl

This guide shows how to set up an nginx reverse proxy for your Firecrawl instance using a subdomain.

## Prerequisites

- A domain name (e.g., `crawl.yourdomain.com`)
- Domain DNS pointing to your server's IP address
- Nginx installed on your server
- Firecrawl running on localhost (default port: 3002)

## 1. Create Nginx Configuration File

Create a new nginx configuration file for your subdomain:

```bash
sudo vim /etc/nginx/sites-available/crawl.jayaprakash.net
```

Add the following configuration:

```nginx
# HTTP - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name crawl.jayaprakash.net;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name crawl.jayaprakash.net;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/crawl.jayaprakash.net/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crawl.jayaprakash.net/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/crawl.jayaprakash.net.access.log;
    error_log /var/log/nginx/crawl.jayaprakash.net.error.log;

    # Max body size for file uploads
    client_max_body_size 100M;

    # Extras API - Job status endpoint
    location /extras/ {
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;

        # Proxy headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header Host $host;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Proxy settings for main Firecrawl API
    location / {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;

        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Proxy headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

**Note:** Replace `crawl.jayaprakash.net` with your actual subdomain throughout the configuration.

## 2. Enable the Site

Create a symbolic link to enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/crawl.jayaprakash.net /etc/nginx/sites-enabled/
```

## 3. Test Nginx Configuration

Before reloading nginx, test the configuration for syntax errors:

```bash
sudo nginx -t
```

You should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

## 4. Install Certbot (if not already installed)

For automatic SSL certificate management with Let's Encrypt:

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx -y
```

## 5. Obtain SSL Certificate

Before running certbot, ensure:
- Your domain DNS A record points to your server's IP address
- Ports 80 and 443 are open in your firewall

```bash
sudo certbot --nginx -d crawl.jayaprakash.net
```

Follow the prompts. Certbot will:
- Obtain the SSL certificate from Let's Encrypt
- Automatically update your nginx configuration
- Set up automatic certificate renewal

## 6. Reload Nginx

Apply the new configuration:

```bash
sudo systemctl reload nginx
```

## 7. Verify Auto-Renewal

Test the auto-renewal process for SSL certificates:

```bash
sudo certbot renew --dry-run
```

If successful, certificates will auto-renew before expiration.

## Alternative: Manual SSL Certificate Setup

If you already have SSL certificates or want to use them manually:

1. Update the SSL certificate paths in your nginx configuration:

```nginx
ssl_certificate /path/to/your/fullchain.pem;
ssl_certificate_key /path/to/your/privkey.pem;
```

2. Reload nginx:

```bash
sudo systemctl reload nginx
```

## Testing Your Setup

1. **Test HTTP to HTTPS redirect:**
   ```bash
   curl -I http://crawl.jayaprakash.net
   ```
   Should return a 301 redirect to HTTPS.

2. **Test HTTPS connection:**
   ```bash
   curl https://crawl.jayaprakash.net
   ```

3. **Access in browser:**
   - Main application: `https://crawl.jayaprakash.net`
   - Admin panel: `https://crawl.jayaprakash.net/admin/<BULL_AUTH_KEY>/queues`
   - Job status API: `https://crawl.jayaprakash.net/extras/status`

   Replace `<BULL_AUTH_KEY>` with your actual Bull auth key from `.env`

4. **Test the Extras API endpoints:**
   ```bash
   # Get all jobs
   curl https://crawl.jayaprakash.net/extras/status

   # Get job statistics
   curl https://crawl.jayaprakash.net/extras/status/stats

   # Get specific job by ID
   curl https://crawl.jayaprakash.net/extras/status/<job-id>

   # Filter by status
   curl "https://crawl.jayaprakash.net/extras/status?status=completed&limit=10"
   ```

## Firewall Configuration

If using UFW (Uncomplicated Firewall):

```bash
# Check firewall status
sudo ufw status

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Reload firewall
sudo ufw reload
```

If using firewalld:

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Troubleshooting

### Connection Refused Errors

1. **Check if Firecrawl is running:**
   ```bash
   docker compose ps
   ```

2. **Verify the application is listening on port 3002:**
   ```bash
   curl http://localhost:3002
   netstat -tlnp | grep 3002
   ```

3. **Check Docker port mapping:**
   ```bash
   docker compose port api 3002
   ```

### SSL Certificate Issues

1. **Check certificate status:**
   ```bash
   sudo certbot certificates
   ```

2. **Manually renew certificates:**
   ```bash
   sudo certbot renew
   ```

### Nginx Errors

1. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/crawl.jayaprakash.net.error.log
   ```

2. **Check nginx access logs:**
   ```bash
   sudo tail -f /var/log/nginx/crawl.jayaprakash.net.access.log
   ```

3. **Check nginx service status:**
   ```bash
   sudo systemctl status nginx
   ```

4. **Restart nginx:**
   ```bash
   sudo systemctl restart nginx
   ```

### DNS Issues

1. **Verify DNS propagation:**
   ```bash
   nslookup crawl.jayaprakash.net
   dig crawl.jayaprakash.net
   ```

2. **Check if domain resolves to correct IP:**
   ```bash
   ping crawl.jayaprakash.net
   ```

## Advanced Configuration

### Rate Limiting

Add rate limiting to prevent abuse:

```nginx
# Add to http block in /etc/nginx/nginx.conf
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# Add to location block in your site config
location / {
    limit_req zone=api_limit burst=20 nodelay;
    # ... rest of proxy configuration
}
```

### Custom Timeouts for Long-Running Operations

For crawl operations that may take longer:

```nginx
location /v1/crawl {
    proxy_pass http://localhost:3002;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    # ... rest of proxy configuration
}
```

### IP Whitelisting

Restrict access to specific IP addresses:

```nginx
location /admin {
    allow 192.168.1.0/24;
    allow 10.0.0.0/8;
    deny all;

    proxy_pass http://localhost:3002;
    # ... rest of proxy configuration
}
```

## Useful Commands

```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx (graceful)
sudo systemctl reload nginx

# Restart nginx (full restart)
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx

# View real-time error logs
sudo tail -f /var/log/nginx/error.log

# View real-time access logs
sudo tail -f /var/log/nginx/access.log

# List all nginx sites
ls -la /etc/nginx/sites-enabled/

# Disable a site
sudo rm /etc/nginx/sites-enabled/crawl.jayaprakash.net
sudo systemctl reload nginx
```

## Security Best Practices

1. **Keep nginx updated:**
   ```bash
   sudo apt update && sudo apt upgrade nginx
   ```

2. **Enable automatic security updates:**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

3. **Configure proper BULL_AUTH_KEY** in your `.env` file to protect the admin panel

4. **Consider adding HTTP authentication** for additional admin panel security:
   ```bash
   sudo apt install apache2-utils
   sudo htpasswd -c /etc/nginx/.htpasswd admin
   ```

   Then add to your nginx config:
   ```nginx
   location /admin {
       auth_basic "Restricted Access";
       auth_basic_user_file /etc/nginx/.htpasswd;
       # ... rest of configuration
   }
   ```

5. **Set up fail2ban** to prevent brute force attacks:
   ```bash
   sudo apt install fail2ban
   ```

## Monitoring

Consider setting up monitoring for your nginx server:

1. **Enable nginx status page:**
   ```nginx
   location /nginx_status {
       stub_status on;
       access_log off;
       allow 127.0.0.1;
       deny all;
   }
   ```

2. **Check status:**
   ```bash
   curl http://localhost/nginx_status
   ```
