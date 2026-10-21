const appTitleHeader = document.getElementById('appTitleHeader');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');
const freeModeToggle = document.getElementById('freeModeToggle');

const imageInput = document.getElementById('imageInput');
const mediaUploadZone = document.getElementById('mediaUploadZone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const resolutionRange = document.getElementById('resolution');
const resValue = document.getElementById('resValue');
const speedRange = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const waveTypeSelect = document.getElementById('waveType');
const attackRange = document.getElementById('attack');
const attackValue = document.getElementById('attackValue');
const releaseRange = document.getElementById('release');
const releaseValue = document.getElementById('releaseValue');
const filterRange = document.getElementById('filter');
const filterValue = document.getElementById('filterValue');
const reverbRange = document.getElementById('reverb');
const reverbValue = document.getElementById('reverbValue');

const infoModal = document.getElementById('infoModal');
const settingsModal = document.getElementById('settingsModal');
const messageBoardModal = document.getElementById('messageBoardModal');
const cameraModal = document.getElementById('cameraModal');
const settingsWindow = document.getElementById('settingsWindow');
const settingsHeader = document.getElementById('settingsHeader');

const toggleCameraActiveButton = document.getElementById('toggleCameraActiveButton');
const stopCameraButton = document.getElementById('stopCameraButton');
const cameraSelect = document.getElementById('cameraSelect');
const cameraStatus = document.getElementById('cameraStatus');
const cameraVideo = document.getElementById('cameraVideo');
const cameraProcessingCanvas = document.getElementById('cameraProcessingCanvas');

let mediaObjectUrl = null;
let mediaSource = null;
let mediaLoaded = false;
let currentColumn = 0;
let scanTimer = null;
let isPlaying = false;
let synth = null;
let filterNode = null;
let reverbNode = null;

let cameraStream = null;
let cameraAnimationFrame = null;
let cameraModeActive = false;
let smoothedGesturePosition = null;
let handWasOpen = false;
let handProcessor = null;
let handLoadPromise = null;
let handInferenceBusy = false;
let lastInferenceTime = 0;
let lastHandSeenTime = 0;
let lastClosedClickTime = 0;
let nativeCursorPosition = { x: 0.5, y: 0.5 };
let freeScanLastColumn = -1;
const lidCursor = document.getElementById('lidCursor');

const handInferenceInterval = 50;
const handLostTimeout = 220;
const clickDebounce = 350;

// Water drop sound effect using Tone.js
function playWaterDropSound() {
    if (typeof Tone === 'undefined') return;
    try {
        const dropSynth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 }
        }).toDestination();
        dropSynth.triggerAttackRelease('C6', '8n');
    } catch (e) {}
}

// Add water drop sound to all interactive elements
document.addEventListener('click', (e) => {
    if (e.target.closest('button, a, input, select, [role="button"]')) {
        playWaterDropSound();
    }
});

function loadMediaPipeHands() {
    if (handProcessor) return Promise.resolve(handProcessor);
    if (handLoadPromise) return handLoadPromise;

    handLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js';
        script.async = true;
        script.onload = () => {
            if (typeof Hands === 'undefined') {
                reject(new Error('MediaPipe Hands no está disponible.'));
                return;
            }
            handProcessor = new Hands({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            });
            handProcessor.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });
            handProcessor.onResults(handleHandResults);
            resolve(handProcessor);
        };
        script.onerror = () => reject(new Error('No se pudo cargar MediaPipe Hands.'));
        document.head.appendChild(script);
    });
    return handLoadPromise;
}

window.addEventListener('pointermove', (event) => {
    nativeCursorPosition = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight
    };
    if (cameraModeActive) return;
    lidCursor.style.left = `${event.clientX}px`;
    lidCursor.style.top = `${event.clientY}px`;
});

function ensureSynth() {
    if (typeof Tone === 'undefined') return null;
    if (!synth) {
        filterNode = new Tone.Filter(Number(filterRange.value), 'lowpass');
        reverbNode = new Tone.Reverb({ decay: 2, wet: Number(reverbRange.value) });
        synth = new Tone.Synth({
            oscillator: { type: waveTypeSelect.value },
            envelope: {
                attack: Number(attackRange.value),
                decay: 0.1,
                sustain: 0.5,
                release: Number(releaseRange.value)
            }
        }).chain(filterNode, reverbNode, Tone.Destination);
        Tone.Destination.volume.value = -8;
    }
    return synth;
}

function startAudio() {
    if (typeof Tone !== 'undefined') Tone.start();
    return ensureSynth();
}

function setCameraStatus(message, isError = false) {
    cameraStatus.innerText = message;
    cameraStatus.className = `rounded-xl border p-3 text-xs ${isError
        ? 'border-red-100 bg-red-50 text-red-700'
        : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`;
}

async function refreshCameraList() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
        const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === 'videoinput');
        cameraSelect.replaceChildren();
        devices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Cámara ${index + 1}`;
            cameraSelect.appendChild(option);
        });
        if (!devices.length) cameraSelect.add(new Option('No se encontraron cámaras', ''));
    } catch (e) {}
}

async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('Tu navegador no permite acceder a la webcam.', true);
        return;
    }
    try {
        setCameraStatus('Cargando MediaPipe y solicitando acceso...');
        const handPromise = loadMediaPipeHands();
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: cameraSelect.value ? { deviceId: { exact: cameraSelect.value } } : true,
            audio: false
        });
        cameraVideo.srcObject = cameraStream;
        await new Promise((resolve) => {
            if (cameraVideo.readyState >= HTMLMediaElement.HAVE_METADATA) { resolve(); return; }
            cameraVideo.addEventListener('loadedmetadata', resolve, { once: true });
        });
        await cameraVideo.play();
        cameraModeActive = true;
        document.body.classList.add('camera-mode-active');
        toggleCameraActiveButton.innerText = 'Cámara Activa';
        toggleCameraActiveButton.classList.replace('bg-emerald-500', 'bg-blue-600');
        stopCameraButton.disabled = false;
        refreshCameraList();
        await handPromise;
        setCameraStatus('Seguimiento activo. Usa la mano abierta para mover y ciérrala para hacer clic.');
        processCameraFrame();
    } catch (error) {
        stopCamera();
        setCameraStatus(`No se pudo iniciar la cámara: ${error.message}`, true);
    }
}

function stopCamera() {
    cameraModeActive = false;
    document.body.classList.remove('camera-mode-active');
    if (cameraAnimationFrame) cancelAnimationFrame(cameraAnimationFrame);
    cameraAnimationFrame = null;
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
    toggleCameraActiveButton.innerText = 'Iniciar Cámara';
    toggleCameraActiveButton.classList.replace('bg-blue-600', 'bg-emerald-500');
    stopCameraButton.disabled = true;
    lidCursor.style.opacity = '1';
    setCameraStatus('Cámara detenida.');
}

function updateGestureCursor(x, y) {
    const smoothing = 0.35;
    const boundedX = Math.max(0, Math.min(1, x));
    const boundedY = Math.max(0, Math.min(1, y));
    smoothedGesturePosition = smoothedGesturePosition
        ? {
            x: smoothedGesturePosition.x + (boundedX - smoothedGesturePosition.x) * smoothing,
            y: smoothedGesturePosition.y + (boundedY - smoothedGesturePosition.y) * smoothing
        }
        : { x: boundedX, y: boundedY };
    lidCursor.style.left = `${smoothedGesturePosition.x * window.innerWidth}px`;
    lidCursor.style.top = `${smoothedGesturePosition.y * window.innerHeight}px`;
    lidCursor.style.opacity = '1';
}

function getInteractiveTarget(x, y) {
    const element = document.elementFromPoint(
        Math.max(0, Math.min(window.innerWidth - 1, x * window.innerWidth)),
        Math.max(0, Math.min(window.innerHeight - 1, y * window.innerHeight))
    );
    return element?.closest('button, [role="button"], a, select, input, label') || null;
}

function clickWithClosedHand(x, y, isClosed) {
    if (!isClosed) {
        handWasOpen = true;
        return;
    }
    if (!handWasOpen) return;
    handWasOpen = false;
    const now = performance.now();
    if (now - lastClosedClickTime < clickDebounce) return;
    lastClosedClickTime = now;
    const target = getInteractiveTarget(x, y);
    if (target) target.click();
}

function landmarkDistance(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y, first.z - second.z);
}

function isClosedHand(landmarks) {
    const wrist = landmarks[0];
    const fingerPairs = [[8, 6], [12, 10], [16, 14], [20, 18]];
    const curledFingers = fingerPairs.filter(([tip, pip]) => {
        return landmarkDistance(landmarks[tip], wrist) < landmarkDistance(landmarks[pip], wrist) * 1.08;
    }).length;
    return curledFingers >= 3;
}

function mapHandToScreen(landmarks) {
    const palmIndices = [0, 5, 9, 13, 17];
    const palm = palmIndices.reduce((acc, idx) => ({
        x: acc.x + landmarks[idx].x / palmIndices.length,
        y: acc.y + landmarks[idx].y / palmIndices.length
    }), { x: 0, y: 0 });
    return { x: 1 - palm.x, y: palm.y, isClosed: isClosedHand(landmarks) };
}

function handleHandResults(results) {
    if (!cameraModeActive) return;
    const landmarks = results.multiHandLandmarks?.[0];
    if (!landmarks || landmarks.length !== 21) return;
    lastHandSeenTime = performance.now();
    const position = mapHandToScreen(landmarks);
    updateGestureCursor(position.x, position.y);
    clickWithClosedHand(smoothedGesturePosition.x, smoothedGesturePosition.y, position.isClosed);
}

async function processHandFrame(now) {
    if (!cameraModeActive || !handProcessor || handInferenceBusy ||
        now - lastInferenceTime < handInferenceInterval ||
        cameraVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    lastInferenceTime = now;
    handInferenceBusy = true;
    try {
        await handProcessor.send({ image: cameraVideo });
    } catch (e) {} finally {
        handInferenceBusy = false;
    }
}

function processCameraFrame() {
    if (!cameraModeActive) return;
    processHandFrame(performance.now());
    if (performance.now() - lastHandSeenTime > handLostTimeout) {
        smoothedGesturePosition = null;
        handWasOpen = false;
    }
    cameraAnimationFrame = requestAnimationFrame(processCameraFrame);
}

function openModal(modal) { modal.classList.remove('hidden'); }
function closeModal(modal) { modal.classList.add('hidden'); }

function updateUploadLabel(file) {
    mediaUploadZone.querySelector('span:nth-child(2)').innerText = file.name;
    mediaUploadZone.querySelector('span:nth-child(3)').innerText = 'Imagen cargada con éxito.';
}

function getTotalColumns() { return Number(resolutionRange.value); }

function drawMedia(highlightColumn = -1) {
    if (!mediaLoaded) return;
    const width = mediaSource.naturalWidth;
    const height = mediaSource.naturalHeight;
    const maxWidth = 600;
    const scale = Math.min(1, maxWidth / width);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const columns = getTotalColumns();

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(mediaSource, 0, 0, w, h);

    if (highlightColumn < 0) return;
    const columnWidth = w / columns;
    const x = highlightColumn * columnWidth;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.fillRect(x, 0, columnWidth, h);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, columnWidth, h);
}

function getActiveCursorPosition() {
    return cameraModeActive && smoothedGesturePosition ? smoothedGesturePosition : nativeCursorPosition;
}

function getCursorColumn() {
    if (!canvas.width) return 0;
    const bounds = canvas.getBoundingClientRect();
    const pos = getActiveCursorPosition();
    const relativeX = (pos.x * window.innerWidth - bounds.left) / Math.max(1, bounds.width);
    return Math.max(0, Math.min(getTotalColumns() - 1, Math.floor(relativeX * getTotalColumns())));
}

function getColumnFrequency(column) {
    const columns = getTotalColumns();
    const columnWidth = canvas.width / columns;
    const startX = Math.floor(column * columnWidth);
    const endX = Math.max(startX + 1, Math.floor((column + 1) * columnWidth));
    const pixels = ctx.getImageData(startX, 0, endX - startX, canvas.height).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < pixels.length; i += 4) {
        r += pixels[i]; g += pixels[i+1]; b += pixels[i+2];
    }
    const count = pixels.length / 4;
    const brightness = (r + g + b) / (count * 3 * 255);
    return 100 * Math.pow(4000 / 100, 1 - brightness);
}

function scanNextColumn() {
    if (!isPlaying || !mediaLoaded) return;
    if (currentColumn >= getTotalColumns()) {
        stopScanning();
        return;
    }
    drawMedia();
    const freq = getColumnFrequency(currentColumn);
    const s = startAudio();
    if (s) s.triggerAttackRelease(freq, Number(speedRange.value) / 1000 * 0.9);
    drawMedia(currentColumn);
    currentColumn += 1;
    scanTimer = setTimeout(scanNextColumn, Number(speedRange.value));
}

function scanFreeColumn() {
    if (!isPlaying || !mediaLoaded) return;
    const col = getCursorColumn();
    if (col !== freeScanLastColumn) {
        drawMedia();
        const freq = getColumnFrequency(col);
        const s = startAudio();
        if (s) s.triggerAttackRelease(freq, 0.08);
        drawMedia(col);
        freeScanLastColumn = col;
    }
    scanTimer = setTimeout(scanFreeColumn, 40);
}

function startScanning() {
    if (!mediaLoaded || isPlaying) return;
    startAudio();
    isPlaying = true;
    playPauseButton.innerText = 'Pause';
    stopButton.disabled = false;
    freeScanLastColumn = -1;
    if (freeModeToggle.checked) scanFreeColumn();
    else scanNextColumn();
}

function pauseScanning() {
    isPlaying = false;
    clearTimeout(scanTimer);
    scanTimer = null;
    playPauseButton.innerText = 'Play';
}

function stopScanning() {
    pauseScanning();
    currentColumn = 0;
    freeScanLastColumn = -1;
    stopButton.disabled = !mediaLoaded;
    if (mediaLoaded) drawMedia();
}

function handleMediaSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (mediaObjectUrl) URL.revokeObjectURL(mediaObjectUrl);
    mediaObjectUrl = URL.createObjectURL(file);
    updateUploadLabel(file);
    stopScanning();
    mediaLoaded = false;
    const img = new Image();
    img.onload = () => {
        mediaSource = img;
        mediaLoaded = true;
        drawMedia();
        playPauseButton.disabled = false;
        stopButton.disabled = false;
    };
    img.src = mediaObjectUrl;
}

function updateSettings() {
    resValue.innerText = resolutionRange.value;
    speedValue.innerText = speedRange.value;
    attackValue.innerText = `${attackRange.value}s`;
    releaseValue.innerText = `${releaseRange.value}s`;
    filterValue.innerText = `${filterRange.value}Hz`;
    reverbValue.innerText = `${Math.round(Number(reverbRange.value) * 100)}%`;

    if (synth) {
        synth.oscillator.type = waveTypeSelect.value;
        synth.envelope.attack = Number(attackRange.value);
        synth.envelope.release = Number(releaseRange.value);
    }
    if (filterNode) filterNode.frequency.value = Number(filterRange.value);
    if (reverbNode) reverbNode.wet.value = Number(reverbRange.value);
    if (mediaLoaded && !isPlaying) drawMedia();
}

// Event Listeners
playPauseButton.addEventListener('click', () => (isPlaying ? pauseScanning() : startScanning()));
stopButton.addEventListener('click', stopScanning);
imageInput.addEventListener('change', handleMediaSelection);
freeModeToggle.addEventListener('change', () => {
    if (!isPlaying) return;
    pauseScanning();
    startScanning();
});

resolutionRange.addEventListener('input', updateSettings);
speedRange.addEventListener('input', updateSettings);
waveTypeSelect.addEventListener('change', updateSettings);
attackRange.addEventListener('input', updateSettings);
releaseRange.addEventListener('input', updateSettings);
filterRange.addEventListener('input', updateSettings);
reverbRange.addEventListener('input', updateSettings);

document.getElementById('infoButton').addEventListener('click', () => openModal(infoModal));
document.getElementById('closeInfoButton').addEventListener('click', () => closeModal(infoModal));
document.getElementById('infoConfirmButton').addEventListener('click', () => closeModal(infoModal));

document.getElementById('settingsButton').addEventListener('click', () => openModal(settingsModal));
document.getElementById('closeSettingsButton').addEventListener('click', () => closeModal(settingsModal));
document.getElementById('settingsConfirmButton').addEventListener('click', () => closeModal(settingsModal));

document.getElementById('startCameraButton').addEventListener('click', async () => {
    openModal(cameraModal);
    await refreshCameraList();
});
document.getElementById('closeCameraModalButton').addEventListener('click', () => closeModal(cameraModal));
toggleCameraActiveButton.addEventListener('click', async () => {
    if (!cameraModeActive) await startCamera();
    else stopCamera();
});
stopCameraButton.addEventListener('click', stopCamera);
cameraSelect.addEventListener('change', () => { if (cameraModeActive) startCamera(); });

document.getElementById('messageBoardButton').addEventListener('click', () => openModal(messageBoardModal));
document.getElementById('messageBoardConfirmButton').addEventListener('click', () => closeModal(messageBoardModal));

// Dragging for Settings Window
let settingsDragState = null;
settingsHeader.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button')) return;
    const bounds = settingsWindow.getBoundingClientRect();
    settingsWindow.style.left = `${bounds.left}px`;
    settingsWindow.style.top = `${bounds.top}px`;
    settingsWindow.style.transform = 'none';
    settingsDragState = {
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top
    };
    settingsHeader.setPointerCapture(event.pointerId);
});
settingsHeader.addEventListener('pointermove', (event) => {
    if (!settingsDragState) return;
    settingsWindow.style.left = `${event.clientX - settingsDragState.offsetX}px`;
    settingsWindow.style.top = `${event.clientY - settingsDragState.offsetY}px`;
});
settingsHeader.addEventListener('pointerup', () => { settingsDragState = null; });

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clockDisplay').innerText = `${hours}:${minutes}`;
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    document.getElementById('dateDisplay').innerText = `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}`;
}

updateSettings();
setInterval(updateClock, 1000);
updateClock();
