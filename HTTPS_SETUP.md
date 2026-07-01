# Production SSL/HTTPS Guide

Since **Waitress** (the WSGI server used by SysNotes) does not support SSL/TLS natively, the industry-standard way to secure SysNotes with HTTPS is to run it behind a **Reverse Proxy** (like IIS on Windows or Nginx on Linux).

The proxy handles the SSL handshake and certificates, then forwards traffic to Waitress running locally on `http://127.0.0.1:5005`.

SysNotes is pre-configured with `ProxyFix` middleware to safely detect and trust the `X-Forwarded-Proto` (HTTPS) headers sent by the proxy.

---

## 1. Windows Server Setup (IIS)

To host SysNotes with HTTPS on Windows Server using **Internet Information Services (IIS)**:

### Prerequisites
1. Ensure **IIS** is installed.
2. Download and install the **URL Rewrite** module: [URL Rewrite Download](https://www.iis.net/downloads/microsoft/url-rewrite)
3. Download and install the **Application Request Routing (ARR)** module: [ARR Download](https://www.iis.net/downloads/microsoft/application-request-routing)

### Step-by-Step Configuration
1. **Enable ARR Proxying:**
   * Open **IIS Manager**.
   * Click on the server node in the left connections pane.
   * Double-click **Application Request Routing Cache**.
   * Click **Server Proxy Settings** in the right Actions pane.
   * Check **Enable proxy** and click **Apply**.

2. **Add Website Bindings:**
   * Right-click **Sites** -> **Add Website**.
   * Name it `SysNotes`, bind it to **HTTPS** (port `443`), and select your SSL certificate.
   * Point the Physical Path to a dummy/empty folder (IIS needs a path, but URL Rewrite will redirect all requests).

3. **Configure URL Rewrite:**
   * Double-click **URL Rewrite** for the new website.
   * Click **Add Rule(s)...** -> **Blank Rule**.
   * Name it `Forward to Waitress`.
   * **Match URL:**
     * Requested URL: `Matches the Pattern`
     * Using: `Regular Expressions`
     * Pattern: `(.*)`
   * **Action:**
     * Action Type: `Rewrite`
     * Rewrite URL: `http://127.0.0.1:5005/{R:1}`
   * Click **Apply**.

4. **Forward Protocol Headers:**
   To make sure Flask understands the request was made over HTTPS:
   * Under the URL Rewrite rule, add the following server variables (in the Actions pane, click **View Server Variables...** then add them):
     * `HTTP_X_FORWARDED_PROTO` = `https`
     * `HTTP_X_FORWARDED_HOST` = `{HTTP_HOST}`

---

## 2. Linux Server Setup (Nginx)

To host SysNotes with HTTPS on Linux using **Nginx**:

1. Install Nginx:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. Create a server block configuration file `/etc/nginx/sites-available/sysnotes`:
   ```nginx
   server {
       listen 80;
       server_name notes.example.com;
       # Redirect HTTP to HTTPS
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name notes.example.com;

       ssl_certificate /etc/ssl/certs/sysnotes.crt;
       ssl_certificate_key /etc/ssl/private/sysnotes.key;

       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;

       # Max upload size (align with app.py 10MB limit)
       client_max_body_size 10M;

       location / {
           proxy_pass http://127.0.0.1:5005;
           
           # Forward essential headers
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header X-Forwarded-Port 443;
       }
   }
   ```

3. Enable the site and restart Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sysnotes /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 3. Configuring Reverse Proxy in App Settings
Once the reverse proxy is configured:
1. Log in to the SysNotes Admin dashboard.
2. Go to the **Admin Page** -> **Settings** tab.
3. In the **Reverse Proxy URL** input, specify your base domain (e.g. `https://notes.example.com` or `https://domain.com/sysnotes`).
4. Click **Save Settings**.
