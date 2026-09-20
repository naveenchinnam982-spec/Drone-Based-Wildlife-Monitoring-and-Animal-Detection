/**
 * DRONE-BASED WILDLIFE MONITORING & ANIMAL DETECTION
 * Frontend Application Logic (Vanilla JavaScript)
 * Handles:
 * - Real-time Navigation & Tab Switching
 * - Drag-and-Drop / File Upload Preview
 * - Asynchronous YOLO11s Inference via /predict API
 * - Interactive Side-by-Side Result Visualization
 * - Lightbox Modal Image Viewer
 * - Direct Result Download
 * - Persistent Local Detection History (localStorage)
 * - Dynamic Dashboard Telemetry & Aggregated Statistics
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // DOM Elements
    // ==========================================
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // Dashboard Telemetry
    const statTotalImages = document.getElementById('stat-total-images');
    const statTotalGiraffes = document.getElementById('stat-total-giraffes');
    const statAvgConfidence = document.getElementById('stat-avg-confidence');
    const statLastDetection = document.getElementById('stat-last-detection');
    const statLastTime = document.getElementById('stat-last-time');

    // Upload & Detection
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const btnDetect = document.getElementById('btn-detect');
    const previewContainer = document.getElementById('preview-container');
    const btnClearPreview = document.getElementById('btn-clear-preview');
    const imagePreview = document.getElementById('image-preview');
    const previewFilename = document.getElementById('preview-filename');
    const previewFilesize = document.getElementById('preview-filesize');
    const loadingSpinner = document.getElementById('loading-spinner');
    const confSlider = document.getElementById('conf-slider');
    const confValDisplay = document.getElementById('conf-val-display');

    // Results Display
    const resultsContainer = document.getElementById('results-container');
    const resOriginalImg = document.getElementById('res-original-img');
    const resAnnotatedImg = document.getElementById('res-annotated-img');
    const btnViewFull = document.getElementById('btn-view-full');
    const btnDownloadRes = document.getElementById('btn-download-res');
    const resAnimal = document.getElementById('res-animal');
    const resCount = document.getElementById('res-count');
    const resConfidence = document.getElementById('res-confidence');
    const resStatus = document.getElementById('res-status');
    const resTime = document.getElementById('res-time');

    // Detection History
    const historyTableBody = document.getElementById('history-table-body');
    const historyEmpty = document.getElementById('history-empty');
    const btnClearHistory = document.getElementById('btn-clear-history');

    // Lightbox Modal
    const imageModal = document.getElementById('image-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalImage = document.getElementById('modal-image');
    const modalTitle = document.getElementById('modal-title');

    // State Variables
    let selectedFile = null;
    const STORAGE_KEY = 'drone_wildlife_detection_history';

    // ==========================================
    // Tab Navigation
    // ==========================================
    window.switchTab = function (tabId) {
        // Update nav links
        navItems.forEach(item => {
            if (item.getAttribute('data-tab') === tabId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Update content sections
        contentSections.forEach(section => {
            if (section.id === tabId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });

        // Sync URL Hash
        history.replaceState(null, null, `#${tabId}`);
    };

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.getAttribute('data-tab');
            if (tabId) {
                switchTab(tabId);
            }
        });
    });

    // Handle initial hash routing
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash && ['dashboard', 'detect', 'history', 'about'].includes(initialHash)) {
        switchTab(initialHash);
    }

    // ==========================================
    // File Upload & Preview Handlers
    // ==========================================
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    function handleFile(file) {
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type.toLowerCase()) && 
            !/\.(jpe?g|png|webp)$/i.test(file.name)) {
            showNotification('Invalid file format. Please upload JPG, PNG, or WEBP images.', 'error');
            return;
        }

        selectedFile = file;

        // Populate preview
        previewFilename.textContent = file.name;
        previewFilesize.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.src = e.target.result;
            previewContainer.classList.remove('hidden');
            btnDetect.disabled = false;
        };
        reader.readAsDataURL(file);

        // Hide previous results when new file is selected
        resultsContainer.classList.add('hidden');
    }

    function clearSelectedFile() {
        selectedFile = null;
        fileInput.value = '';
        imagePreview.src = '';
        previewContainer.classList.add('hidden');
        btnDetect.disabled = true;
    }

    btnClearPreview.addEventListener('click', (e) => {
        e.stopPropagation();
        clearSelectedFile();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    });

    // Drag and Drop support
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropZone.classList.remove('drag-over');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files && files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Handle Confidence Sensitivity Slider
    if (confSlider && confValDisplay) {
        confSlider.addEventListener('input', () => {
            const val = parseInt(confSlider.value);
            let tag = '';
            if (val < 25) tag = ' (High Sensitivity)';
            else if (val <= 35) tag = ' (Optimal Accuracy)';
            else tag = ' (High Precision)';
            confValDisplay.textContent = `${val}%${tag}`;
        });
    }

    // ==========================================
    // Sample Drone Imagery Click Handler
    // ==========================================
    const sampleChips = document.querySelectorAll('.sample-chip');
    async function loadSampleByElement(chip) {
        if (!chip) return;
        sampleChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const sampleFile = chip.getAttribute('data-sample');
        const sampleName = chip.getAttribute('data-name') || sampleFile;
        const sampleUrl = `/static/samples/${sampleFile}`;

        try {
            const res = await fetch(sampleUrl);
            if (!res.ok) throw new Error('Failed to fetch sample image');
            const blob = await res.blob();
            const file = new File([blob], sampleFile, { type: blob.type || 'image/jpeg' });
            handleFile(file);
        } catch (err) {
            console.error('[Sample Error]', err);
            showNotification('Could not load sample image', 'error');
        }
    }

    sampleChips.forEach(chip => {
        chip.addEventListener('click', () => {
            loadSampleByElement(chip);
            showNotification(`Loaded ${chip.getAttribute('data-name') || 'sample'} into detection portal`, 'info');
        });
    });

    // ==========================================
    // YOLO11 Inference Request
    // ==========================================
    btnDetect.addEventListener('click', async () => {
        if (!selectedFile) {
            showNotification('Please select or drop an image first.', 'warning');
            return;
        }

        const formData = new FormData();
        formData.append('image', selectedFile);

        // Include user-adjusted confidence & IoU suppression thresholds
        if (confSlider) {
            const confFraction = (parseInt(confSlider.value) / 100.0).toFixed(2);
            formData.append('confidence', confFraction);
        }
        formData.append('iou', '0.45');

        // Show loading spinner
        loadingSpinner.classList.remove('hidden');
        btnDetect.disabled = true;
        resultsContainer.classList.add('hidden');

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'YOLO11s inference failed on server.');
            }

            // Render detection findings
            renderResults(data);

            // Record to local storage detection history
            saveDetectionRecord({
                filename: selectedFile.name,
                count: data.count,
                confidence: data.average_confidence,
                resultImage: data.result_image,
                originalImage: data.original_image
            });

            showNotification(
                data.count > 0 
                    ? `Detection complete: ${data.count} giraffe(s) identified!` 
                    : 'Detection complete: No giraffes found in this image.',
                'success'
            );

        } catch (error) {
            console.error('[Detection Error]', error);
            showNotification(`Error: ${error.message}`, 'error');
        } finally {
            loadingSpinner.classList.add('hidden');
            btnDetect.disabled = false;
        }
    });

    // ==========================================
    // Render Results Display
    // ==========================================
    function renderResults(data) {
        // Display images side-by-side
        // Add cache-busting query to ensure immediate fresh load
        const cacheBuster = `?t=${Date.now()}`;
        resOriginalImg.src = (data.original_image || imagePreview.src) + cacheBuster;
        resAnnotatedImg.src = data.result_image + cacheBuster;

        // Metrics
        resAnimal.textContent = 'Giraffe';
        resCount.textContent = data.count;
        resConfidence.textContent = `${data.average_confidence}%`;
        resTime.textContent = `${data.processing_time || '0.00'} seconds`;

        // Update status badge
        if (data.count > 0) {
            resStatus.textContent = `Detected (${data.count} Giraffe${data.count > 1 ? 's' : ''})`;
            resStatus.className = 'status-pill status-detected';
            resCount.className = 'm-value count-badge badge-active';
        } else {
            resStatus.textContent = 'No Giraffe Detected';
            resStatus.className = 'status-pill status-none';
            resCount.className = 'm-value count-badge badge-zero';
        }

        // Render individual detections breakdown table
        const detectionsTableBody = document.getElementById('detections-table-body');
        const breakdownTotalBadge = document.getElementById('breakdown-total-badge');

        if (detectionsTableBody && breakdownTotalBadge) {
            detectionsTableBody.innerHTML = '';
            const detections = data.detections || [];
            breakdownTotalBadge.textContent = `${detections.length} Giraffe${detections.length === 1 ? '' : 's'}`;

            if (detections.length === 0) {
                detectionsTableBody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">
                            <i class="fa-solid fa-circle-info"></i> No giraffes identified in this frame at current threshold.
                        </td>
                    </tr>
                `;
            } else {
                detections.forEach(det => {
                    const tr = document.createElement('tr');
                    const bboxStr = det.bbox ? `[${det.bbox.join(', ')}]` : 'N/A';
                    tr.innerHTML = `
                        <td><span class="badge-target-id">#${det.id}</span></td>
                        <td><strong>Giraffe</strong> <span style="font-size:0.75rem; color:var(--text-muted);">(nc: 1)</span></td>
                        <td><span class="conf-pill-high">${det.confidence}%</span></td>
                        <td><span class="bbox-coord">${escapeHtml(bboxStr)}</span></td>
                        <td><span class="badge badge-success"><i class="fa-solid fa-check"></i> Detected</span></td>
                    `;
                    detectionsTableBody.appendChild(tr);
                });
            }
        }

        // Setup Download link
        btnDownloadRes.href = data.result_image;
        btnDownloadRes.download = `yolo_detected_${selectedFile ? selectedFile.name : 'result.jpg'}`;

        // Setup View Full Image modal trigger
        btnViewFull.onclick = () => {
            openModal(data.result_image, `AI Detection Result: ${data.count} Giraffe(s) Found`);
        };

        // Reveal panel & smoothly scroll
        resultsContainer.classList.remove('hidden');
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ==========================================
    // Lightbox Modal
    // ==========================================
    function openModal(imgSrc, title) {
        modalImage.src = imgSrc;
        modalTitle.textContent = title || 'High-Resolution Detection Result';
        imageModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        imageModal.classList.add('hidden');
        modalImage.src = '';
        document.body.style.overflow = '';
    }

    btnCloseModal.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // ==========================================
    // History Management (localStorage)
    // ==========================================
    function getHistory() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.warn('[Storage] Could not parse detection history:', e);
            return [];
        }
    }

    function saveDetectionRecord(record) {
        const history = getHistory();
        const now = new Date();

        const newRecord = {
            id: 'det_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            timestamp: now.getTime(),
            filename: record.filename,
            count: record.count,
            confidence: record.confidence,
            resultImage: record.resultImage,
            originalImage: record.originalImage
        };

        // Add to beginning of history list
        history.unshift(newRecord);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));

        // Refresh UI
        loadHistoryTable();
        updateDashboardStats();
    }

    function loadHistoryTable() {
        const history = getHistory();
        historyTableBody.innerHTML = '';

        if (!history || history.length === 0) {
            historyEmpty.classList.remove('hidden');
            return;
        }

        historyEmpty.classList.add('hidden');

        history.forEach(item => {
            const tr = document.createElement('tr');

            const countBadgeClass = item.count > 0 ? 'badge-count-success' : 'badge-count-zero';
            const countText = item.count > 0 ? `${item.count} Giraffe${item.count > 1 ? 's' : ''}` : '0 Detected';

            tr.innerHTML = `
                <td><strong>${escapeHtml(item.date)}</strong></td>
                <td><span class="time-stamp">${escapeHtml(item.time)}</span></td>
                <td><span class="file-cell" title="${escapeHtml(item.filename)}"><i class="fa-regular fa-image"></i> ${escapeHtml(item.filename)}</span></td>
                <td><span class="table-badge ${countBadgeClass}">${countText}</span></td>
                <td><span class="conf-cell">${item.confidence > 0 ? item.confidence + '%' : '0.0%'}</span></td>
                <td>
                    <img src="${escapeHtml(item.resultImage)}" alt="Result" class="table-thumb" onclick="openModal('${escapeHtml(item.resultImage)}', '${escapeHtml(item.filename)} (${item.count} Giraffes)')" title="Click to view full image">
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn-table-icon" title="View Full Image" onclick="openModal('${escapeHtml(item.resultImage)}', '${escapeHtml(item.filename)}')">
                            <i class="fa-solid fa-expand"></i>
                        </button>
                        <a href="${escapeHtml(item.resultImage)}" download="yolo_${escapeHtml(item.filename)}" class="btn-table-icon" title="Download Result">
                            <i class="fa-solid fa-download"></i>
                        </a>
                    </div>
                </td>
            `;
            historyTableBody.appendChild(tr);
        });
    }

    btnClearHistory.addEventListener('click', () => {
        const history = getHistory();
        if (!history || history.length === 0) {
            showNotification('History is already empty.', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all detection history logs?')) {
            localStorage.removeItem(STORAGE_KEY);
            loadHistoryTable();
            updateDashboardStats();
            showNotification('Detection history cleared successfully.', 'info');
        }
    });

    // Window expose for inline thumbnail click
    window.openModal = openModal;

    // ==========================================
    // Dashboard Telemetry Calculations
    // ==========================================
    function updateDashboardStats() {
        const history = getHistory();

        if (!history || history.length === 0) {
            statTotalImages.textContent = '0';
            statTotalGiraffes.textContent = '0';
            statAvgConfidence.textContent = '0.0%';
            statLastDetection.textContent = 'None';
            statLastTime.textContent = 'No activity recorded';
            return;
        }

        const totalImages = history.length;
        const totalGiraffes = history.reduce((acc, item) => acc + (parseInt(item.count) || 0), 0);

        // Compute average confidence across detections with giraffes (or all positive detections)
        const positiveConfidences = history
            .filter(item => item.count > 0 && item.confidence > 0)
            .map(item => parseFloat(item.confidence));

        let overallAvgConf = 0.0;
        if (positiveConfidences.length > 0) {
            const sumConf = positiveConfidences.reduce((acc, val) => acc + val, 0);
            overallAvgConf = (sumConf / positiveConfidences.length).toFixed(1);
        }

        const latest = history[0];
        const lastDetectionText = latest.count > 0 
            ? `${latest.count} Giraffe${latest.count > 1 ? 's' : ''}` 
            : '0 Giraffes';

        // Animate counter values
        statTotalImages.textContent = totalImages;
        statTotalGiraffes.textContent = totalGiraffes;
        statAvgConfidence.textContent = `${overallAvgConf}%`;
        statLastDetection.textContent = lastDetectionText;
        statLastTime.textContent = `${latest.date} at ${latest.time}`;
    }

    // ==========================================
    // Utility Helpers
    // ==========================================
    function formatBytes(bytes, decimals = 1) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function showNotification(message, type = 'info') {
        // Remove existing toast if any
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast-notification toast-${type}`;

        const icons = {
            success: 'fa-circle-check',
            error: 'fa-circle-exclamation',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        toast.innerHTML = `
            <i class="fa-solid ${icons[type] || 'fa-bell'}"></i>
            <span>${escapeHtml(message)}</span>
        `;

        document.body.appendChild(toast);

        // Auto remove after 4 seconds
        setTimeout(() => {
            toast.classList.add('toast-fade');
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }

    // ==========================================
    // Initialize On Page Load
    // ==========================================
    loadHistoryTable();
    updateDashboardStats();
    if (sampleChips && sampleChips.length > 0) {
        loadSampleByElement(sampleChips[0]);
    }
});
