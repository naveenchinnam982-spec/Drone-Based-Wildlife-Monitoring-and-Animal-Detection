# Drone-Based Wildlife Monitoring and Animal Detection
### AI-Powered Giraffe Detection using YOLO11s & Flask

An academic computer vision web application designed for automated wildlife population monitoring from aerial unmanned aerial vehicle (UAV) imagery. The system runs real-time object detection using a fine-tuned **YOLO11s** model (`giraffe_best.pt`) to locate, annotate, and count wild giraffes in high-resolution drone frames.

---

## 📸 Key Features

- **Actual YOLO11s AI Inference**: Loads your trained `model/giraffe_best.pt` model weights (`nc: 1`, `names: ['giraffe']`) and performs actual deep learning bounding box detection and classification.
- **Curated Drone Test Gallery**: Built-in 1-click test imagery (Savanna Herd, Acacia Bushveld, Aerial Cluster, Open Range Pair, and Control) for immediate live testing without manual uploads.
- **Side-by-Side Visualization**: Displays the uploaded original drone image alongside the YOLO11 annotated output side-by-side for comparison.
- **Individual Target Breakdown**: Detailed table showing each detected giraffe's Target ID, confidence %, and bounding box pixel coordinates `[x1, y1, x2, y2]`.
- **Detailed Detection Telemetry**: Computes total giraffe count, average confidence score (%), detection status, and inference time in seconds.
- **Full-Resolution Image Lightbox**: Inspect fine-grained bounding boxes and aerial details with a click-to-zoom modal viewer.
- **One-Click Result Download**: Save high-resolution annotated detection results directly to your local computer.
- **Persistent Detection History**: Automatically records all past drone image analyses with timestamps, thumbnails, and counts in browser storage.
- **Dynamic Telemetry Dashboard**: Real-time aggregated statistics (Total Images Analyzed, Total Giraffes Identified, Overall Average Confidence, and Last Detection Activity).
- **Modern Academic UI**: Responsive, nature-themed design with smooth animations, accessible on laptops, desktops, and tablets without complex frontend frameworks.

---

## 📁 Project Directory Structure

```text
wildlife-monitoring/
│
├── app.py                  # Flask backend server & YOLO11 inference pipeline
├── requirements.txt        # Python dependencies
├── README.md               # Beginner-friendly setup & execution guide
├── test_inference.py       # Automated 5-suite verification script
│
├── model/
│   └── giraffe_best.pt     # Trained YOLO11s model weights (Required)
│
├── uploads/                # Stores incoming aerial drone images
│
├── results/                # Stores YOLO annotated output images with bounding boxes
│
├── templates/
│   └── index.html          # Professional wildlife monitoring dashboard
│
└── static/
    ├── css/
    │   └── style.css       # Responsive styling, cards, modal, & layout
    ├── js/
    │   └── app.js          # Tab switching, file upload, fetch API, history & stats
    └── samples/            # Curated aerial UAV test images for instant evaluation
```

---

## 🚀 Beginner-Friendly Setup Instructions (Windows)

Follow these exact steps in your terminal to set up and run the application locally on Windows.

### Step 1: Check Python Installation
Make sure Python 3.10, 3.11, 3.12, 3.13, or 3.14 is installed. Open **Command Prompt** or **PowerShell** and verify:
```powershell
python --version
```

### Step 2: Clone or Open Project Folder
Clone the repository and navigate into the directory:
```powershell
git clone https://github.com/naveenchinnam982-spec/Drone-Based-Wildlife-Monitoring-and-Animal-Detection.git
cd Drone-Based-Wildlife-Monitoring-and-Animal-Detection
```

### Step 3: Create a Python Virtual Environment
Creating a virtual environment ensures clean, isolated package management:
```powershell
python -m venv venv
```

### Step 4: Activate the Virtual Environment
Activate the environment:
- **In PowerShell**:
  ```powershell
  venv\Scripts\Activate.ps1
  ```
  *(If you see an execution policy error in PowerShell, run: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` and re-run the activate command)*
- **In Command Prompt (cmd.exe)**:
  ```cmd
  venv\Scripts\activate.bat
  ```

Once activated, your terminal prompt will show `(venv)`.

### Step 5: Install Required Packages
Install all necessary backend dependencies:
```powershell
pip install -r requirements.txt
```

### Step 6: Verify Model File Placement
Ensure your trained model weights file is located inside the `model/` folder:
```text
model/giraffe_best.pt
```
> The application automatically verifies that `model/giraffe_best.pt` exists before starting. If missing, a clear error prompt is displayed in the terminal.

### Step 7: Launch the Application
Start the Flask local web server:
```powershell
python app.py
```

### Step 8: Open in Your Web Browser
Open any modern web browser (Google Chrome, Microsoft Edge, Firefox, or Brave) and navigate to:
```text
http://127.0.0.1:5000
```

---

## 🔬 AI Model & Inference Pipeline Details

| Parameter | Configuration |
| :--- | :--- |
| **Model Architecture** | Ultralytics YOLO11s (Small) |
| **Weights File** | `model/giraffe_best.pt` |
| **Target Class** | `giraffe` (`nc: 1`) |
| **Inference Image Size** | `640 x 640` px |
| **Confidence Threshold** | `0.25` (25% detection sensitivity) |
| **Supported Image Types** | JPG, JPEG, PNG, WEBP |
| **Frameworks** | Python Flask, Ultralytics YOLO, PyTorch, Pillow, OpenCV |

---

## 📡 API Specification

### `POST /predict`
Uploads a drone image file and returns object detection bounding box analytics.

- **Request**: Multipart Form Data (`image`: file)
- **Response Format (giraffes detected)**:
  ```json
  {
      "success": true,
      "animal": "giraffe",
      "count": 2,
      "average_confidence": 91.5,
      "result_image": "/results/result_timestamp_id.jpg",
      "original_image": "/uploads/drone_timestamp_id.jpg",
      "processing_time": 0.38
  }
  ```
- **Response Format (no giraffes detected)**:
  ```json
  {
      "success": true,
      "animal": "giraffe",
      "count": 0,
      "average_confidence": 0,
      "result_image": "/results/result_timestamp_id.jpg",
      "original_image": "/uploads/drone_timestamp_id.jpg",
      "processing_time": 0.32
  }
  ```

---

## 🛠️ Troubleshooting & Frequently Asked Questions

### 1. "TRAINED MODEL FILE NOT FOUND" error on startup
- Make sure `giraffe_best.pt` is inside the `model/` folder (`wildlife-monitoring/model/giraffe_best.pt`).
- Ensure the filename is exactly `giraffe_best.pt` (all lowercase, no spaces).

### 2. "Address already in use: Port 5000"
- Another application is using port 5000. Either close that application or change `port=5000` to `port=5050` at the bottom of `app.py`.

### 3. File upload fails or returns "Invalid image format"
- Ensure your file has a `.jpg`, `.jpeg`, `.png`, or `.webp` extension.
