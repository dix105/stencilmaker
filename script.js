document.addEventListener('DOMContentLoaded', () => {
    
    // =========================================
    // MOBILE MENU TOGGLE
    // =========================================
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('header nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', () => {
            nav.classList.toggle('active');
            menuToggle.textContent = nav.classList.contains('active') ? '✕' : '☰';
        });

        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                nav.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
    }

    // =========================================
    // SCROLL REVEAL ANIMATION
    // =========================================
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // =========================================
    // FAQ ACCORDION
    // =========================================
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            
            // Toggle active state
            question.classList.toggle('active');
            
            if (question.classList.contains('active')) {
                answer.style.maxHeight = answer.scrollHeight + 'px';
            } else {
                answer.style.maxHeight = 0;
            }
        });
    });

    // =========================================
    // MODALS (Privacy & Terms)
    // =========================================
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }

    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    // Open triggers
    document.querySelectorAll('[data-modal-target]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal-target');
            openModal(modalId);
        });
    });

    // Close triggers
    document.querySelectorAll('[data-modal-close]').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal-close');
            closeModal(modalId);
        });
    });

    // Click outside to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });

    // =========================================
    // API & BACKEND WIRING
    // =========================================

    // DOM Elements
    const fileInput = document.getElementById('file-input');
    const uploadZone = document.getElementById('upload-zone');
    const previewImage = document.getElementById('preview-image');
    const generateBtn = document.getElementById('generate-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultFinal = document.getElementById('result-final');
    const loadingState = document.getElementById('loading-state');
    const resultPlaceholder = document.querySelector('.result-placeholder');
    const downloadBtn = document.getElementById('download-btn');
    const uploadContent = document.querySelector('.upload-content');
    // statusText reference removed as it is not present in HTML

    // State
    let currentUploadedUrl = null;

    // --- HELPER FUNCTIONS ---

    // Generate nanoid for unique filename
    function generateNanoId(length = 21) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    // UI Helper: Show Loading State
    function showLoading() {
        if (loadingState) {
            loadingState.classList.remove('hidden');
            loadingState.style.display = 'flex';
        }
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');
        if (resultFinal) resultFinal.classList.add('hidden');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.classList.add('disabled');
        }
    }

    // UI Helper: Hide Loading State
    function hideLoading() {
        if (loadingState) {
            loadingState.classList.add('hidden');
            loadingState.style.display = 'none';
        }
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.classList.remove('disabled');
        }
    }

    // UI Helper: Update Status Text
    function updateStatus(text) {
        // Update button text logic
        if (generateBtn) {
            if (text.includes('PROCESSING') || text.includes('UPLOADING') || text.includes('SUBMITTING')) {
                generateBtn.disabled = true;
                generateBtn.textContent = text;
            } else if (text === 'READY') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Stencil';
            } else if (text === 'COMPLETE') {
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Again';
            }
        }
    }

    // UI Helper: Show Error
    function showError(msg) {
        alert('Error: ' + msg);
        updateStatus('ERROR');
    }

    // UI Helper: Show Preview
    function showPreview(url) {
        if (previewImage) {
            previewImage.src = url;
            previewImage.classList.remove('hidden');
            previewImage.style.display = 'block';
        }
        if (uploadContent) {
            uploadContent.classList.add('hidden');
        }
    }

    // UI Helper: Show Result Media
    function showResultMedia(url) {
        const container = resultFinal ? resultFinal.parentElement : document.querySelector('.result-area');
        if (!container) return;
        
        // Ensure result placeholder is hidden
        if (resultPlaceholder) resultPlaceholder.classList.add('hidden');

        // Check for Video
        const isVideo = url.toLowerCase().match(/\.(mp4|webm)(\?.*)?$/i);
        
        if (isVideo) {
            if (resultFinal) resultFinal.style.display = 'none';
            
            let video = document.getElementById('result-video');
            if (!video) {
                video = document.createElement('video');
                video.id = 'result-video';
                video.controls = true;
                video.autoplay = true;
                video.loop = true;
                video.className = resultFinal ? resultFinal.className : 'w-full h-auto rounded-lg';
                video.style.maxWidth = '100%';
                container.appendChild(video);
            }
            video.src = url;
            video.style.display = 'block';
        } else {
            const video = document.getElementById('result-video');
            if (video) video.style.display = 'none';
            
            if (resultFinal) {
                resultFinal.classList.remove('hidden');
                resultFinal.style.display = 'block';
                // Add timestamp to prevent caching issues if needed, but usually nanoid handles uniqueness
                resultFinal.src = url;
            }
        }
    }

    // UI Helper: Enable Generate Button
    function enableGenerateButton() {
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.classList.remove('disabled');
        }
    }

    // UI Helper: Store download URL
    function showDownloadButton(url) {
        if (downloadBtn) {
            downloadBtn.dataset.url = url;
            downloadBtn.classList.remove('disabled');
            downloadBtn.href = "#"; // Prevent navigation
            downloadBtn.style.display = 'inline-block';
        }
    }

    // --- API FUNCTIONS ---

    // Upload file to CDN storage
    async function uploadFile(file) {
        const fileExtension = file.name.split('.').pop() || 'jpg';
        const uniqueId = generateNanoId();
        const fileName = uniqueId + '.' + fileExtension;
        
        // Step 1: Get signed URL
        const signedUrlResponse = await fetch(
            'https://api.chromastudio.ai/get-emd-upload-url?fileName=' + encodeURIComponent(fileName),
            { method: 'GET' }
        );
        
        if (!signedUrlResponse.ok) {
            throw new Error('Failed to get signed URL: ' + signedUrlResponse.statusText);
        }
        
        const signedUrl = await signedUrlResponse.text();
        console.log('Got signed URL');
        
        // Step 2: PUT file to signed URL
        const uploadResponse = await fetch(signedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type
            }
        });
        
        if (!uploadResponse.ok) {
            throw new Error('Failed to upload file: ' + uploadResponse.statusText);
        }
        
        // Step 3: Return download URL
        const downloadUrl = 'https://contents.maxstudio.ai/' + fileName;
        console.log('Uploaded to:', downloadUrl);
        return downloadUrl;
    }

    // Submit generation job
    async function submitImageGenJob(imageUrl) {
        // Configuration: Image Effects
        const isVideo = false; 
        const endpoint = 'https://api.chromastudio.ai/image-gen';
        
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json',
            'sec-ch-ua-platform': '"Windows"',
            'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
            'sec-ch-ua-mobile': '?0'
        };

        const body = {
            model: 'image-effects',
            toolType: 'image-effects',
            effectId: 'stencilMaker',
            imageUrl: imageUrl,
            userId: 'DObRu1vyStbUynoQmTcHBlhs55z2',
            removeWatermark: true,
            isPrivate: true
        };

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            throw new Error('Failed to submit job: ' + response.statusText);
        }
        
        const data = await response.json();
        console.log('Job submitted:', data.jobId, 'Status:', data.status);
        return data;
    }

    // Poll job status
    async function pollJobStatus(jobId) {
        const USER_ID = 'DObRu1vyStbUynoQmTcHBlhs55z2';
        const POLL_INTERVAL = 2000;
        const MAX_POLLS = 60;
        const baseUrl = 'https://api.chromastudio.ai/image-gen';
        let polls = 0;
        
        while (polls < MAX_POLLS) {
            const response = await fetch(
                `${baseUrl}/${USER_ID}/${jobId}/status`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json, text/plain, */*'
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to check status: ' + response.statusText);
            }
            
            const data = await response.json();
            console.log('Poll', polls + 1, '- Status:', data.status);
            
            if (data.status === 'completed') {
                return data;
            }
            
            if (data.status === 'failed' || data.status === 'error') {
                throw new Error(data.error || 'Job processing failed');
            }
            
            // Update UI with progress
            updateStatus('PROCESSING... (' + (polls + 1) + ')');
            
            // Wait before next poll
            await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
            polls++;
        }
        
        throw new Error('Job timed out after ' + MAX_POLLS + ' polls');
    }

    // --- HANDLERS ---

    // Handler when file is selected - uploads immediately
    async function handleFileSelect(file) {
        if (!file) return;
        
        try {
            // Show loading initially while uploading
            showLoading();
            updateStatus('UPLOADING...');
            
            // Upload immediately
            const uploadedUrl = await uploadFile(file);
            currentUploadedUrl = uploadedUrl;
            
            // Show the uploaded image preview
            showPreview(uploadedUrl);
            
            updateStatus('READY');
            hideLoading();
            enableGenerateButton();
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
            // Reset if error
            if (uploadContent) uploadContent.classList.remove('hidden');
            if (previewImage) previewImage.classList.add('hidden');
        }
    }

    // Handler when Generate button is clicked
    async function handleGenerate() {
        if (!currentUploadedUrl) return;
        
        try {
            showLoading();
            updateStatus('SUBMITTING JOB...');
            
            // Step 1: Submit job
            const jobData = await submitImageGenJob(currentUploadedUrl);
            console.log('Job ID:', jobData.jobId);
            
            updateStatus('JOB QUEUED...');
            
            // Step 2: Poll for completion
            const result = await pollJobStatus(jobData.jobId);
            
            // Step 3: Get result URL
            const resultItem = Array.isArray(result.result) ? result.result[0] : result.result;
            const resultUrl = resultItem?.mediaUrl || resultItem?.video || resultItem?.image;
            
            if (!resultUrl) {
                console.error('Response:', result);
                throw new Error('No image URL in response');
            }
            
            console.log('Result image URL:', resultUrl);
            
            // Update stored URL for download logic (or keep separate)
            // Note: We don't overwrite currentUploadedUrl here to allow re-generating if needed,
            // but usually we want to download the result.
            
            // Step 4: Display result
            showResultMedia(resultUrl);
            
            updateStatus('COMPLETE');
            hideLoading();
            showDownloadButton(resultUrl);
            
        } catch (error) {
            hideLoading();
            updateStatus('ERROR');
            showError(error.message);
        }
    }

    // --- EVENT LISTENERS (WIRING) ---

    // File Input
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleFileSelect(file);
        });
    }

    // Drag & Drop
    if (uploadZone) {
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('drag-over');
            uploadZone.style.backgroundColor = '#f0f0f0';
        });

        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            uploadZone.style.backgroundColor = '';
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('drag-over');
            uploadZone.style.backgroundColor = '';
            const file = e.dataTransfer.files[0];
            if (file) handleFileSelect(file);
        });
        
        // Click to upload
        uploadZone.addEventListener('click', () => {
            if (fileInput) fileInput.click();
        });
    }

    // Generate Button
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }

    // Reset Button
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            currentUploadedUrl = null;
            if (previewImage) {
                previewImage.src = '';
                previewImage.classList.add('hidden');
                previewImage.style.display = 'none';
            }
            if (uploadContent) uploadContent.classList.remove('hidden');
            if (resultFinal) {
                resultFinal.classList.add('hidden');
                resultFinal.style.display = 'none';
            }
            if (resultPlaceholder) resultPlaceholder.classList.remove('hidden');
            if (downloadBtn) {
                downloadBtn.classList.add('disabled');
                downloadBtn.style.display = 'none';
            }
            if (generateBtn) {
                generateBtn.disabled = true;
                generateBtn.textContent = 'Generate Stencil';
                generateBtn.classList.add('disabled');
            }
            if (fileInput) fileInput.value = '';
            
            // Clear video if exists
            const video = document.getElementById('result-video');
            if (video) video.remove();
        });
    }

    // Download Button - Robust Implementation
    if (downloadBtn) {
        downloadBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const url = downloadBtn.dataset.url;
            if (!url) return;
            
            const originalText = downloadBtn.textContent;
            downloadBtn.textContent = 'Downloading...';
            downloadBtn.style.pointerEvents = 'none'; // Disable while downloading
            
            // Helper to trigger download from blob
            function downloadBlob(blob, filename) {
                const blobUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = filename;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
            }
            
            // Helper to get extension
            function getExtension(url, contentType) {
                if (contentType) {
                    if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
                    if (contentType.includes('png')) return 'png';
                    if (contentType.includes('webp')) return 'webp';
                }
                const match = url.match(/\.(jpe?g|png|webp)/i);
                return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'png';
            }
            
            try {
                // STRATEGY 1: Proxy
                const proxyUrl = 'https://api.chromastudio.ai/download-proxy?url=' + encodeURIComponent(url);
                const response = await fetch(proxyUrl);
                if (!response.ok) throw new Error('Proxy failed');
                
                const blob = await response.blob();
                const ext = getExtension(url, response.headers.get('content-type'));
                downloadBlob(blob, 'stencil_' + generateNanoId(8) + '.' + ext);
                
            } catch (proxyErr) {
                console.warn('Proxy failed, trying direct:', proxyErr.message);
                
                // STRATEGY 2: Direct Fetch
                try {
                    const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
                    const response = await fetch(fetchUrl, { mode: 'cors' });
                    if (response.ok) {
                        const blob = await response.blob();
                        const ext = getExtension(url, response.headers.get('content-type'));
                        downloadBlob(blob, 'stencil_' + generateNanoId(8) + '.' + ext);
                        return;
                    }
                    throw new Error('Direct fetch failed');
                } catch (fetchErr) {
                    console.warn('Direct fetch failed, trying canvas:', fetchErr.message);
                    
                    // STRATEGY 3: Canvas (Images only)
                    const img = document.getElementById('result-final');
                    if (img && img.style.display !== 'none' && img.naturalWidth > 0) {
                        try {
                            const canvas = document.createElement('canvas');
                            canvas.width = img.naturalWidth;
                            canvas.height = img.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            
                            canvas.toBlob((blob) => {
                                if (blob) {
                                    downloadBlob(blob, 'stencil_' + generateNanoId(8) + '.png');
                                } else {
                                    forceDownloadLink();
                                }
                            }, 'image/png');
                            return;
                        } catch (e) { console.warn('Canvas failed'); }
                    }
                    
                    // STRATEGY 4: Direct Link
                    forceDownloadLink();
                }
            } finally {
                downloadBtn.textContent = originalText;
                downloadBtn.style.pointerEvents = 'auto';
            }

            function forceDownloadLink() {
                const link = document.createElement('a');
                link.href = url;
                link.download = 'stencil_' + generateNanoId(8) + '.png';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        });
    }
});