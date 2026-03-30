# PyTech Deployment Guide

## Overview

This document describes the deployment process of the **PyTech E-Learning Platform**.
The backend is built with **Django**, served using **Gunicorn**, and managed behind **Nginx** on an Azure Virtual Machine.
The frontend communicates with the backend via REST APIs.

---

# Deployment Architecture

Client (Browser)
↓
Nginx (Reverse Proxy)
↓
Gunicorn (Application Server)
↓
Django Backend
↓
Database

---

# Server Information

Cloud Provider: Azure Virtual Machine
Operating System: Ubuntu 22.04
Domain: pytech.site

Backend Stack:

Backend Framework: Django
Application Server: Gunicorn
Reverse Proxy: Nginx

Frontend:

* React

Database:

* PostgreSQL

CI/CD:

* GitHub Actions

---

# Initial Server Setup

Update system packages:

sudo apt update
sudo apt upgrade

Install required packages:

sudo apt install python3-pip python3-venv nginx git

---

# Clone Project Repository

git clone https://github.com/snehasivadas21/elearning.git
cd elearning

---

# Create Virtual Environment

python3 -m venv env
source env/bin/activate

Install dependencies:

pip install -r requirements.txt

---

# Environment Variables

Create a `.env` file in the backend directory.

Example:

DJANGO_SECRET_KEY=your_secret_key
DEBUG=False
DJANGO_ALLOWED_HOSTS=pytech.site,localhost,127.0.0.1
DATABASE_URL=postgres://username:password@localhost:5432/pytech_db

---

# Database Setup

Run migrations:

python manage.py migrate

Create admin user:

python manage.py createsuperuser

---

# Static Files

Collect static files:

python manage.py collectstatic

---

# Frontend Deployment

Build React Project:

cd frontend
npm install
npm run build

---

# Running Background Services

Celery worker:

celery -A pytech worker -l info

Celery beat:

celery -A pytech beat

Redis:

sudo service redis start

---

# Gunicorn Setup

Create Gunicorn service file:

/etc/systemd/system/gunicorn.service

Example configuration:

[Unit]
Description=Gunicorn daemon for PyTech
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/pytech
ExecStart=/home/ubuntu/pytech/env/bin/gunicorn projectname.wsgi:application --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target

Start the service:

sudo systemctl start gunicorn
sudo systemctl enable gunicorn

---

# Nginx Configuration

Create a configuration file:

/etc/nginx/sites-available/pytech

Example:

server {
server_name pytech.site;

```
location / {  
    proxy_pass http://127.0.0.1:8000;  
    proxy_set_header Host $host;  
    proxy_set_header X-Real-IP $remote_addr;  
}  
```

}

Enable the configuration:

sudo ln -s /etc/nginx/sites-available/pytech /etc/nginx/sites-enabled

Restart nginx:

sudo systemctl restart nginx

---

# CI/CD Pipeline

The project uses GitHub Actions for automated deployment.

Pipeline process:

1. Code pushed to GitHub repository
2. GitHub Actions workflow triggers
3. Server pulls the latest code
4. Dependencies are installed
5. Database migrations run
6. Gunicorn service restarts
7. Nginx reloads configuration

This ensures the latest code is automatically deployed to production.

---

# Updating the Application

To manually update the application:

git pull origin main
pip install -r requirements.txt
python manage.py migrate
sudo systemctl restart gunicorn
sudo systemctl restart nginx

---

# Troubleshooting

502 Bad Gateway
Cause: Gunicorn service not running
Solution: Restart Gunicorn

sudo systemctl restart gunicorn

CORS Issues
Check `CORS_ALLOWED_ORIGINS` in Django settings.

Static Files Not Loading
Run:

python manage.py collectstatic

---

# Notes

* Docker was used during development to maintain consistent environments.
* Production deployment was performed using Gunicorn and Nginx on Azure VM for simplicity and direct server control.
* CI/CD ensures automated deployments on every update.

---
