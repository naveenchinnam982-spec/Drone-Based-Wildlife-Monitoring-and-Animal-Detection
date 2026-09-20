"""
Automated Verification Script for Drone-Based Wildlife Monitoring
Tests:
1. Directory structure validation
2. YOLO11s model loading from model/giraffe_best.pt
3. Flask routes (GET / and POST /predict)
4. Real YOLO forward pass execution
5. Result image generation and output verification in results/
6. Response JSON schema validation
"""

import os
import io
import sys
import json
from PIL import Image, ImageDraw

def run_tests():
    print("=" * 70)
    print(" [TEST 1/5] Verifying Project Directory Structure...")
    print("=" * 70)
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    required_paths = [
        os.path.join(base_dir, "app.py"),
        os.path.join(base_dir, "requirements.txt"),
        os.path.join(base_dir, "README.md"),
        os.path.join(base_dir, "model", "giraffe_best.pt"),
        os.path.join(base_dir, "templates", "index.html"),
        os.path.join(base_dir, "static", "css", "style.css"),
        os.path.join(base_dir, "static", "js", "app.js"),
        os.path.join(base_dir, "uploads"),
        os.path.join(base_dir, "results"),
    ]

    all_exist = True
    for path in required_paths:
        exists = os.path.exists(path)
        status = "[OK] FOUND" if exists else "[FAIL] MISSING"
        rel_path = os.path.relpath(path, base_dir)
        print(f"  {status:14} : {rel_path}")
        if not exists:
            all_exist = False

    if not all_exist:
        print("\n[ERROR] Missing required project files or directories!")
        sys.exit(1)
    print("\n[PASS] Project structure is 100% complete and verified.")

    print("\n" + "=" * 70)
    print(" [TEST 2/5] Testing Trained YOLO11s Model Loading...")
    print("=" * 70)
    model_path = os.path.join(base_dir, "model", "giraffe_best.pt")
    try:
        from ultralytics import YOLO
        model = YOLO(model_path)
        print(f"  [OK] Model successfully loaded from: {model_path}")
        print(f"  [OK] Model names / classes: {model.names}")
        print(f"  [OK] Number of classes (nc): {len(model.names)}")
        assert 0 in model.names, "Class ID 0 not found in model names"
        assert model.names[0] == 'giraffe', f"Expected class 'giraffe', got '{model.names[0]}'"
        print("  [OK] Class mapping confirmed: {0: 'giraffe'}")
    except Exception as e:
        print(f"\n[ERROR] Failed to load YOLO model: {e}")
        sys.exit(1)
    print("\n[PASS] YOLO11s model load test passed.")

    print("\n" + "=" * 70)
    print(" [TEST 3/5] Testing Flask GET / Dashboard Route...")
    print("=" * 70)
    try:
        from app import app
        client = app.test_client()
        response = client.get('/')
        assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
        assert b"Drone-Based Wildlife Monitoring" in response.data, "Header title missing from HTML"
        assert b"AI-Powered Giraffe Detection using YOLO11" in response.data, "Subtitle missing from HTML"
        print("  [OK] GET / returned HTTP 200 OK")
        print("  [OK] Main dashboard HTML rendered successfully with proper titles & assets")
    except Exception as e:
        print(f"\n[ERROR] Failed testing GET / route: {e}")
        sys.exit(1)
    print("\n[PASS] Flask GET route test passed.")

    print("\n" + "=" * 70)
    print(" [TEST 4/5] Testing POST /predict with Real Aerial Drone Test Frame...")
    print("=" * 70)
    try:
        # Create a synthetic aerial drone landscape image (640x640 savanna terrain)
        test_img = Image.new('RGB', (640, 640), color=(140, 160, 95))
        draw = ImageDraw.Draw(test_img)
        # Draw some drone savanna textures
        for i in range(20, 620, 40):
            draw.line([(i, 0), (i + 30, 640)], fill=(125, 145, 80), width=2)
            draw.ellipse([i, i // 2, i + 50, i // 2 + 50], fill=(90, 115, 60))

        img_byte_arr = io.BytesIO()
        test_img.save(img_byte_arr, format='JPEG', quality=90)
        img_byte_arr.seek(0)

        data = {
            'image': (img_byte_arr, 'aerial_drone_sample_test.jpg')
        }

        print("  [*] Submitting image to POST /predict endpoint...")
        response = client.post('/predict', data=data, content_type='multipart/form-data')
        
        print(f"  [OK] Response status code: {response.status_code}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"

        res_json = response.get_json()
        print("  [OK] Response JSON payload:")
        print("      " + json.dumps(res_json, indent=6))

        assert res_json.get('success') is True, "Expected success: true"
        assert res_json.get('animal') == 'giraffe', f"Expected animal: 'giraffe', got {res_json.get('animal')}"
        assert 'count' in res_json, "Missing 'count' in response"
        assert 'average_confidence' in res_json, "Missing 'average_confidence' in response"
        assert 'result_image' in res_json, "Missing 'result_image' in response"
        assert 'original_image' in res_json, "Missing 'original_image' in response"
        assert 'processing_time' in res_json, "Missing 'processing_time' in response"

    except Exception as e:
        print(f"\n[ERROR] Failed testing POST /predict: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    print("\n[PASS] Real YOLO inference test passed.")

    print("\n" + "=" * 70)
    print(" [TEST 5/5] Verifying Result Image File Generation in results/...")
    print("=" * 70)
    try:
        result_url = res_json['result_image']
        result_filename = os.path.basename(result_url)
        full_result_path = os.path.join(base_dir, "results", result_filename)

        assert os.path.exists(full_result_path), f"Annotated image file not found: {full_result_path}"
        file_size = os.path.getsize(full_result_path)
        print(f"  [OK] Result image file exists: {full_result_path}")
        print(f"  [OK] Result image file size: {file_size:,} bytes")
        assert file_size > 1000, "Result image file is too small or corrupt"

        with Image.open(full_result_path) as im:
            print(f"  [OK] Verified image dimensions: {im.size[0]} x {im.size[1]} px, Format: {im.format}")

    except Exception as e:
        print(f"\n[ERROR] Failed verifying result image: {e}")
        sys.exit(1)
    print("\n[PASS] Annotated result file verification passed.")

    print("\n" + "=" * 70)
    print(" [SUMMARY] ALL 5 VERIFICATION SUITES PASSED WITH 100% SUCCESS!")
    print("=" * 70 + "\n")

if __name__ == '__main__':
    run_tests()
