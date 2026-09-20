import os
import sys
import time
import uuid
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from PIL import Image
import cv2
import numpy as np
from ultralytics import YOLO

# Initialize Flask App
app = Flask(__name__)

# Base directories
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "model", "giraffe_best.pt")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
RESULTS_FOLDER = os.path.join(BASE_DIR, "results")

# Ensure required directories exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(RESULTS_FOLDER, exist_ok=True)

# Allowed file extensions for validation
ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}

# Check model file before starting
if not os.path.exists(MODEL_PATH):
    print("\n" + "=" * 70)
    print(" [CRITICAL ERROR] TRAINED MODEL FILE NOT FOUND!")
    print(f" Missing file: {MODEL_PATH}")
    print(" Please place your trained 'giraffe_best.pt' inside the 'model/' folder.")
    print("=" * 70 + "\n")
    sys.exit(1)

print(f"[*] Loading trained YOLO11s model from: {MODEL_PATH}...")
try:
    model = YOLO(MODEL_PATH)
    print("[OK] YOLO11s model loaded successfully!")
    print(f"[*] Detected Model Classes: {model.names}")
except Exception as e:
    print(f"[!] Failed to load model: {str(e)}")
    sys.exit(1)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """Render main dashboard"""
    return render_template('index.html')

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded images"""
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/results/<path:filename>')
def serve_result(filename):
    """Serve annotated result images"""
    return send_from_directory(RESULTS_FOLDER, filename)

@app.route('/predict', methods=['POST'])
def predict():
    """
    POST /predict
    Accepts uploaded drone image, executes YOLO inference, returns JSON result.
    """
    start_time = time.time()
    
    if 'image' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No image file uploaded.'
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected for upload.'
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP.'
        }), 400

    try:
        # Generate safe unique filename
        ext = file.filename.rsplit('.', 1)[1].lower()
        unique_id = uuid.uuid4().hex[:10]
        timestamp = int(time.time())
        filename = f"drone_{timestamp}_{unique_id}.{ext}"
        result_filename = f"result_{timestamp}_{unique_id}.jpg"

        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        result_path = os.path.join(RESULTS_FOLDER, result_filename)

        # Save raw image to uploads/
        file.save(upload_path)

        # Verify image opening with PIL to avoid corrupted files
        try:
            with Image.open(upload_path) as img:
                img.verify()
        except Exception:
            if os.path.exists(upload_path):
                os.remove(upload_path)
            return jsonify({
                'success': False,
                'error': 'Uploaded file is corrupted or not a valid image.'
            }), 400

        # Read optional confidence and IoU/NMS suppression thresholds
        conf_thresh = request.form.get('confidence', default=0.28, type=float)
        iou_thresh = request.form.get('iou', default=0.45, type=float)

        # Clamp thresholds safely
        conf_thresh = max(0.05, min(0.95, conf_thresh))
        iou_thresh = max(0.10, min(0.90, iou_thresh))

        # Perform actual YOLO11 inference using trained model
        # conf_thresh defaults to 0.28, iou_thresh=0.45 suppresses duplicate bounding boxes
        results = model.predict(
            source=upload_path,
            conf=conf_thresh,
            iou=iou_thresh,
            imgsz=640,
            verbose=False
        )

        result = results[0]

        # Extract detections
        giraffe_count = 0
        confidences = []
        detections = []

        if result.boxes is not None and len(result.boxes) > 0:
            for box in result.boxes:
                cls_id = int(box.cls[0].item())
                conf_val = float(box.conf[0].item())
                # Class 0 or name 'giraffe'
                class_name = model.names.get(cls_id, 'giraffe')
                if class_name.lower() == 'giraffe' or cls_id == 0:
                    giraffe_count += 1
                    conf_pct = round(conf_val * 100.0, 1)
                    confidences.append(conf_pct)
                    xyxy = [round(float(coord), 1) for coord in box.xyxy[0].tolist()]
                    detections.append({
                        'id': giraffe_count,
                        'class': 'giraffe',
                        'confidence': conf_pct,
                        'bbox': xyxy
                    })

        # Calculate average confidence percentage
        if giraffe_count > 0 and len(confidences) > 0:
            average_confidence = round(float(np.mean(confidences)), 1)
        else:
            average_confidence = 0.0

        # Save annotated image using YOLO plot functionality
        annotated_bgr = result.plot()  # Returns BGR numpy array
        
        # Write to results/ with PIL for reliable Windows path compatibility & high quality
        annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(annotated_rgb)
        pil_img.save(result_path, format="JPEG", quality=95)

        processing_time = round(time.time() - start_time, 2)

        return jsonify({
            'success': True,
            'animal': 'giraffe',
            'count': giraffe_count,
            'average_confidence': average_confidence,
            'detections': detections,
            'result_image': f'/results/{result_filename}',
            'original_image': f'/uploads/{filename}',
            'processing_time': processing_time
        })

    except Exception as e:
        print(f"[!] Error during prediction: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Inference failed: {str(e)}'
        }), 500

@app.route('/api/status')
def get_status():
    """System & model health status"""
    return jsonify({
        'status': 'online',
        'model_name': 'YOLO11s Giraffe Detector',
        'model_file': os.path.basename(MODEL_PATH),
        'classes': model.names,
        'nc': len(model.names),
        'engine': 'Ultralytics YOLO11'
    })

@app.route('/api/samples')
def get_samples():
    """Return list of curated drone test imagery"""
    samples = [
        {
            'id': 'sample_herd_7',
            'title': 'Savanna Herd',
            'description': 'Aerial cluster of wild giraffes grazing in open savanna terrain',
            'filename': 'sample_herd_7.jpg',
            'url': '/static/samples/sample_herd_7.jpg',
            'expected': '7 Giraffes'
        },
        {
            'id': 'sample_group_4',
            'title': 'Acacia Bushveld',
            'description': 'Dispersed group moving between thornveld trees',
            'filename': 'sample_group_4.jpg',
            'url': '/static/samples/sample_group_4.jpg',
            'expected': '4 Giraffes'
        },
        {
            'id': 'sample_cluster_6',
            'title': 'Aerial Cluster',
            'description': 'High-angle drone view of foraging giraffe group',
            'filename': 'sample_cluster_6.jpg',
            'url': '/static/samples/sample_cluster_6.jpg',
            'expected': '6 Giraffes'
        },
        {
            'id': 'sample_pair_2',
            'title': 'Open Range Pair',
            'description': 'Two giraffes moving across grassland terrain',
            'filename': 'sample_pair_2.jpg',
            'url': '/static/samples/sample_pair_2.jpg',
            'expected': '2 Giraffes'
        },
        {
            'id': 'sample_landscape_0',
            'title': 'Empty Savanna (Control)',
            'description': 'Aerial drone habitat without wildlife (negative control)',
            'filename': 'sample_landscape_0.jpg',
            'url': '/static/samples/sample_landscape_0.jpg',
            'expected': '0 Giraffes'
        }
    ]
    return jsonify({'success': True, 'samples': samples})

if __name__ == '__main__':
    print("\n" + "=" * 60)
    print(" [*] DRONE WILDLIFE MONITORING APP RUNNING!")
    print(" Access Dashboard at: http://127.0.0.1:5000")
    print("=" * 60 + "\n")
    app.run(host='127.0.0.1', port=5000, debug=False, threaded=True)
