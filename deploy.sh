#!/bin/bash
set -e

echo "Pulling latest code..."
git pull

echo "Building frontend..."
cd client
npm install
npm run build
cd ..

# Uncomment and edit the next line if you need to copy build files elsewhere:
# echo "Copying build files to /var/www/html..."
# sudo cp -r client/build/* /var/www/html/

echo "Restarting server with PM2..."
pm2 restart all

echo "Reloading NGINX..."
sudo systemctl reload nginx

echo "Deployment complete!"
