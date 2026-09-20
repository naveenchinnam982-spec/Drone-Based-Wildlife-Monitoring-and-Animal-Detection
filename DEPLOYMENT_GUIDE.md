# 🚀 Drone Wildlife Monitoring - 24/7 Server Deployment Guide

This guide shows you how to deploy your **Drone-Based Wildlife Monitoring & Animal Detection** website to a live cloud server so that **anyone in the world can open and use it on any phone, tablet, or computer 24/7**, even when your laptop and Antigravity are completely closed!

---

## 🌐 Why Does the Website Stop Working Locally?
- When you run `python app.py` on your computer, the website is hosted on `http://127.0.0.1:5000` (localhost).
- **127.0.0.1** is a private address that only exists inside your laptop.
- As soon as Antigravity, terminal, or your laptop is closed/sleeping, the local Python process terminates.
- **Deploying to a Cloud Server** places the app on a high-speed data center that runs 24/7 with a public HTTPS link (e.g., `https://drone-wildlife.onrender.com`).

---

## 🌟 Recommended Cloud Hosts (Free Tier)

| Provider | Free Plan Specs | Best For | Link |
| :--- | :--- | :--- | :--- |
| **Render.com** | 512 MB RAM, Free HTTPS URL | Easiest 1-Click GitHub connection | [render.com](https://render.com) |
| **Hugging Face Spaces** | **16 GB RAM, 2 vCPU (FREE)** | Best performance for YOLO AI models | [huggingface.co/spaces](https://huggingface.co/spaces) |
| **Railway.app** | 512 MB RAM, $5 free trial | Fast instant deployments | [railway.app](https://railway.app) |

---

## 🛠️ Method 1: Deploy on Render (Easiest - 3 Minutes)

Render connects directly to your GitHub repository and automatically deploys your updates whenever you push code.

### Step 1: Sign in to Render
1. Go to **[https://render.com](https://render.com)**.
2. Click **Get Started** or **Sign In** and choose **GitHub**.

### Step 2: Create a New Web Service
1. In your Render Dashboard, click the blue **New +** button in the top right.
2. Select **Web Service**.
3. Choose **Build and deploy from a Git repository** and click **Next**.
4. Find and select your repository:
   ```
   naveenchinnam982-spec/Drone-Based-Wildlife-Monitoring-and-Animal-Detection
   ```
   *(If you don't see it, click "Configure account" to grant Render access to your GitHub repositories).*

### Step 3: Configure Settings
Fill in the following fields (Render may pre-fill them automatically from `render.yaml`):

- **Name:** `drone-wildlife-monitoring`
- **Region:** Any close to you (e.g., *Oregon (US West)* or *Frankfurt (EU)* or *Singapore (Asia)*)
- **Branch:** `main`
- **Root Directory:** `wildlife-monitoring` *(or leave blank if repository root)*
- **Runtime:** `Python 3`
- **Build Command:**
  ```bash
  pip install --upgrade pip && pip install -r requirements.txt
  ```
- **Start Command:**
  ```bash
  gunicorn --workers 1 --threads 4 --timeout 180 --bind 0.0.0.0:$PORT app:app
  ```
- **Instance Type:** Select **Free** ($0 / month).

### Step 4: Click Deploy!
1. Click **Deploy Web Service** at the bottom.
2. Render will download your code, install dependencies, load the YOLO model, and start the Gunicorn server.
3. Once the log says `Build successful` and `Running`, Render displays your live public URL at the top left:
   ```
   https://drone-wildlife-monitoring.onrender.com
   ```
4. **Share this link with anyone!** Open it on your iPhone, Android, or laptop anywhere in the world. It will stay active even when your laptop is turned off!

---

## ⚡ Method 2: Deploy on Hugging Face Spaces (Best for AI Models)

Hugging Face Spaces provides **16 GB RAM and 2 vCPU completely free**, which gives blazing fast YOLO AI detections without memory limits!

### Step 1: Create a Space
1. Go to **[https://huggingface.co/spaces](https://huggingface.co/spaces)** and log in (or create a free account).
2. Click **Create new Space**.
3. Space Name: `drone-wildlife-monitoring`
4. License: `MIT` (or your choice).
5. Select Space SDK: **Docker** -> choose **Blank**.
6. Visibility: **Public**.
7. Click **Create Space**.

### Step 2: Push Your Code to the Space
Hugging Face Spaces is a Git repository. You can push your existing repository code directly:
```bash
# Add Hugging Face Space as a git remote (replace USERNAME with your Hugging Face username):
git remote add space https://huggingface.co/spaces/USERNAME/drone-wildlife-monitoring

# Push code to Hugging Face:
git push space main
```
Hugging Face will automatically read the included `Dockerfile`, install requirements, and run your web application at:
```
https://huggingface.co/spaces/USERNAME/drone-wildlife-monitoring
```

---

## 📱 Bonus: Test on Your Phone Right Now (Local Wi-Fi)

If you want to view and test the website on your phone right this second without waiting for cloud deployment (while your laptop is running):

1. Make sure your **Phone and Laptop are connected to the same Wi-Fi network**.
2. Find your laptop's local IP address:
   - On Windows, open PowerShell or Command Prompt and run:
     ```bash
     ipconfig
     ```
   - Look for **IPv4 Address** under your Wi-Fi adapter (for example: `192.168.1.15`).
3. Start the website on your laptop:
   - Double-click `START_WEBSITE.bat` or run:
     ```bash
     python app.py
     ```
4. Open the web browser (Safari or Chrome) on your phone and type:
   ```
   http://192.168.1.15:5000
   ```
   *(replace `192.168.1.15` with your actual IPv4 address)*
5. The full wildlife detection website will load directly on your phone!
*(Note: If it does not load, allow port 5000 in Windows Defender Firewall or temporarily select Private Network).*

---

## 📁 Summary of Production Files Included

- **`Procfile`**: Tells cloud platforms to run Gunicorn production server with multi-threading and timeout handling.
- **`render.yaml`**: Pre-configured blueprint for 1-click zero-setup deployment on Render.
- **`Dockerfile`**: Container recipe for Hugging Face Spaces, Railway, or Google Cloud.
- **`requirements.txt`**: Optimized with `opencv-python-headless` and `gunicorn` for headless cloud Linux environments.
- **`app.py`**: Updated to automatically bind to cloud environment port (`PORT` env var).
