# Enabling HTTPS for the Digaf platform

The server already runs nginx in front of the app (port 80 → web :3000, /api → :4000).
HTTPS needs a **domain name** pointing at 196.190.220.15 — certificates cannot be
issued for a bare IP address.

## Steps (once a domain exists, e.g. registry.digaf.com)

1. **DNS**: create an A record: `registry.digaf.com → 196.190.220.15`

2. **Install certbot** on the server:
   ```bash
   sudo apt update && sudo apt install -y certbot python3-certbot-nginx
   ```

3. **Update the nginx server_name** in `/etc/nginx/sites-enabled/digaf`:
   ```
   server_name registry.digaf.com;
   ```
   then `sudo nginx -t && sudo systemctl reload nginx`

4. **Issue the certificate** (certbot rewrites the config for TLS + auto-renews):
   ```bash
   sudo certbot --nginx -d registry.digaf.com --redirect
   ```

5. **Update app config** so links point at the new origin:
   - `/home/digaf/app/apps/api/.env`: `FRONTEND_PUBLIC_BASE_URL=https://registry.digaf.com`
     and add `BEHIND_TLS=true` (enables the HSTS header)
   - Rebuild web with the new public URL:
     `NEXT_PUBLIC_API_BASE_URL=https://registry.digaf.com` in the compose build args / `.env`
   - Supabase dashboard → Auth → URL Configuration: set Site URL and add
     `https://registry.digaf.com/**` to Redirect URLs

6. **Verify**: `curl -I https://registry.digaf.com/login` → 200, and
   `curl -I http://registry.digaf.com/login` → 301 redirect to https.

Renewal is automatic (`certbot.timer`); check with `sudo certbot renew --dry-run`.
