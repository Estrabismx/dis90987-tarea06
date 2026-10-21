const lidMenuView = document.getElementById('lidMenuView');
const scannerAppView = document.getElementById('scannerAppView');
const appTitleHeader = document.getElementById('appTitleHeader');
const scannerChannelButton = document.getElementById('scannerChannelButton');
const cameraAppView = document.getElementById('cameraAppView');
const headerMenuButton = document.getElementById('headerMenuButton');
const footerHomeButton = document.getElementById('footerHomeButton');
const closeScannerButton = document.getElementById('closeScannerButton');
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
const settingsWindow = document.getElementById('settingsWindow');
const settingsHeader = document.getElementById('settingsHeader');
const minimizeSettingsButton = document.getElementById('minimizeSettingsButton');
const settingsMinimizedIcon = document.getElementById('settingsMinimizedIcon');
const detectMidiButton = document.getElementById('detectMidiButton');
const midiInputSelect = document.getElementById('midiInputSelect');
const midiStatus = document.getElementById('midiStatus');
const clearMidiMappingsButton = document.getElementById('clearMidiMappingsButton');
const midiLearnButtons = document.querySelectorAll('[data-midi-target]');
const lidCursor = document.getElementById('lidCursor');
const dwellProgress = document.getElementById('dwellProgress');
const dwellProgressBar = document.getElementById('dwellProgressBar');
const dwellProgressValue = document.getElementById('dwellProgressValue');
const closeCameraButton = document.getElementById('closeCameraButton');
const startCameraButton = document.getElementById('startCameraButton');
const stopCameraButton = document.getElementById('stopCameraButton');
const cameraSelect = document.getElementById('cameraSelect');
const cameraStatus = document.getElementById('cameraStatus');
const cameraVideo = document.getElementById('cameraVideo');
const cameraProcessingCanvas = document.getElementById('cameraProcessingCanvas');
const cameraProcessingContext = cameraProcessingCanvas.getContext('2d', { willReadFrequently: true });

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
let lastGesturePosition = null;
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
let midiAccess = null;
let selectedMidiInput = null;
let midiMappings = new Map();
let midiLearningTarget = null;
const handInferenceInterval = 50;
const handLostTimeout = 220;
const clickDebounce = 350;

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

document.addEventListener('pointerleave', () => {
    lidCursor.style.opacity = '0';
});

document.addEventListener('pointerenter', () => {
    if (!cameraModeActive) lidCursor.style.opacity = '1';
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && (!cameraAppView.classList.contains('hidden') || cameraModeActive)) {
        event.preventDefault();
        returnToLidHome();
    }
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

function launchScannerChannel() {
    lidMenuView.classList.add('hidden');
    scannerAppView.classList.remove('hidden');
    cameraAppView.classList.add('hidden');
    appTitleHeader.innerText = 'Canal Traductor de bits';
}

function returnToLidHome() {
    stopScanning();
    stopCamera();
    scannerAppView.classList.add('hidden');
    cameraAppView.classList.add('hidden');
    lidMenuView.classList.remove('hidden');
    appTitleHeader.innerText = 'Traductor de bits';
}

function closeCameraWindow() {
    cameraAppView.classList.add('hidden');
    lidMenuView.classList.remove('hidden');
    appTitleHeader.innerText = 'Traductor de bits';
}

function setCameraStatus(message, isError = false) {
    cameraStatus.innerText = message;
    cameraStatus.className = `rounded-xl border p-3 text-sm ${isError
        ? 'border-red-100 bg-red-50 text-red-700'
        : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`;
}

async function refreshCameraList() {
    if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraStatus('Este navegador no permite acceder a las cámaras.', true);
        return;
    }

    let devices;
    try {
        devices = (await navigator.mediaDevices.enumerateDevices())
            .filter((device) => device.kind === 'videoinput');
    } catch (error) {
        setCameraStatus(`No se pudieron listar las cámaras: ${error.message}`, true);
        return;
    }
    const selectedId = cameraSelect.value;
    cameraSelect.replaceChildren();
    devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Cámara ${index + 1}`;
        cameraSelect.appendChild(option);
    });
    if (selectedId && devices.some((device) => device.deviceId === selectedId)) {
        cameraSelect.value = selectedId;
    }
    if (!devices.length) {
        cameraSelect.add(new Option('No se encontraron cámaras', ''));
        setCameraStatus('Conecta una webcam y vuelve a intentarlo.', true);
    }
}

async function launchCameraChannel() {
    stopScanning();
    scannerAppView.classList.add('hidden');
    lidMenuView.classList.add('hidden');
    cameraAppView.classList.remove('hidden');
    appTitleHeader.innerText = 'Modo cámara';
    await refreshCameraList();
}

function stopCamera() {
    cameraModeActive = false;
    document.body.classList.remove('camera-mode-active');
    if (cameraAnimationFrame) cancelAnimationFrame(cameraAnimationFrame);
    cameraAnimationFrame = null;
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    cameraVideo.srcObject = null;
    stopCameraButton.disabled = true;
    startCameraButton.disabled = false;
    startCameraButton.classList.add('opacity-50');
    lastGesturePosition = null;
    smoothedGesturePosition = null;
    handWasOpen = false;
    handInferenceBusy = false;
    lastHandSeenTime = 0;
    lidCursor.style.opacity = '0';
    resetDwell();
}

async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
        setCameraStatus('Tu navegador no permite acceder a la webcam.', true);
        return;
    }

    stopCamera();
    try {
        setCameraStatus('Cargando MediaPipe y solicitando acceso a la cámara...');
        const handPromise = loadMediaPipeHands();
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: cameraSelect.value ? { deviceId: { exact: cameraSelect.value } } : true,
            audio: false
        });
        cameraVideo.srcObject = cameraStream;
        await new Promise((resolve) => {
            if (cameraVideo.readyState >= HTMLMediaElement.HAVE_METADATA) {
                resolve();
                return;
            }
            cameraVideo.addEventListener('loadedmetadata', resolve, { once: true });
        });
        await cameraVideo.play();
        cameraModeActive = true;
        document.body.classList.add('camera-mode-active');
        startCameraButton.disabled = true;
        startCameraButton.classList.remove('opacity-50');
        stopCameraButton.disabled = false;
        refreshCameraList();
        await handPromise;
        setCameraStatus('Cámara activa. Usa la mano abierta para mover y ciérrala para hacer click.');
        processCameraFrame();
    } catch (error) {
        if (cameraStream) {
            cameraStream.getTracks().forEach((track) => track.stop());
            cameraStream = null;
            cameraVideo.srcObject = null;
        }
        setCameraStatus(`No se pudo iniciar la cámara: ${error.message}`, true);
    }
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

function resetDwell() {
    dwellProgress.classList.add('hidden');
    dwellProgressBar.style.width = '0%';
    dwellProgressValue.innerText = '0%';
}

function getInteractiveTarget(x, y) {
    const element = document.elementFromPoint(
        Math.max(0, Math.min(window.innerWidth - 1, x * window.innerWidth)),
        Math.max(0, Math.min(window.innerHeight - 1, y * window.innerHeight))
    );
    const target = element?.closest('button, [role="button"], a, select, input, label');
    return target && !target.disabled ? target : null;
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
    const fingerPairs = [
        [8, 6],
        [12, 10],
        [16, 14],
        [20, 18]
    ];
    const curledFingers = fingerPairs.filter(([tipIndex, pipIndex]) => {
        const tipDistance = landmarkDistance(landmarks[tipIndex], wrist);
        const pipDistance = landmarkDistance(landmarks[pipIndex], wrist);
        return tipDistance < pipDistance * 1.08;
    }).length;
    return curledFingers >= 3;
}

function mapHandToScreen(landmarks) {
    const palmIndices = [0, 5, 9, 13, 17];
    const palm = palmIndices.reduce((center, index) => ({
        x: center.x + landmarks[index].x / palmIndices.length,
        y: center.y + landmarks[index].y / palmIndices.length
    }), { x: 0, y: 0 });

    return {
        x: 1 - palm.x,
        y: palm.y,
        isClosed: isClosedHand(landmarks)
    };
}

function handleHandResults(results) {
    if (!cameraModeActive) return;
    const landmarks = results.multiHandLandmarks?.[0];
    if (!landmarks || landmarks.length !== 21) return;

    lastHandSeenTime = performance.now();
    const position = mapHandToScreen(landmarks);
    lastGesturePosition = position;
    updateGestureCursor(position.x, position.y);
    clickWithClosedHand(
        smoothedGesturePosition.x,
        smoothedGesturePosition.y,
        position.isClosed
    );
}

async function processHandFrame(now) {
    if (!cameraModeActive || !handProcessor || handInferenceBusy ||
        now - lastInferenceTime < handInferenceInterval ||
        cameraVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    lastInferenceTime = now;
    handInferenceBusy = true;
    try {
        await handProcessor.send({ image: cameraVideo });
    } catch (error) {
        setCameraStatus(`MediaPipe no pudo procesar la cámara: ${error.message}`, true);
    } finally {
        handInferenceBusy = false;
    }
}

function processCameraFrame() {
    if (!cameraModeActive) return;
    processHandFrame(performance.now());
    if (performance.now() - lastHandSeenTime > handLostTimeout) {
        lastGesturePosition = null;
        smoothedGesturePosition = null;
        handWasOpen = false;
        lidCursor.style.opacity = '0';
        resetDwell();
    }
    cameraAnimationFrame = requestAnimationFrame(processCameraFrame);
}

function openModal(modal) {
    modal.classList.remove('hidden');
}

function closeModal(modal) {
    modal.classList.add('hidden');
}

function updateUploadLabel(file, type) {
    mediaUploadZone.querySelector('span:nth-child(2)').innerText = file.name;
    mediaUploadZone.querySelector('span:nth-child(3)').innerText = 'Imagen cargada. Listo para iniciar.';
}

function getTotalColumns() {
    return Number(resolutionRange.value);
}

function getMediaDimensions() {
    return {
        width: mediaSource.naturalWidth,
        height: mediaSource.naturalHeight
    };
}

function drawMedia(highlightColumn = -1) {
    if (!mediaLoaded) return;

    const { width: sourceWidth, height: sourceHeight } = getMediaDimensions();
    const maxWidth = 600;
    const scale = Math.min(1, maxWidth / sourceWidth);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);
    const columns = getTotalColumns();

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(mediaSource, 0, 0, width, height);

    if (highlightColumn < 0) return;

    const columnWidth = width / columns;
    const x = highlightColumn * columnWidth;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.fillRect(x, 0, columnWidth, height);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, columnWidth, height);
}

function getActiveCursorPosition() {
    return cameraModeActive && smoothedGesturePosition
        ? smoothedGesturePosition
        : nativeCursorPosition;
}

function getCursorColumn() {
    if (!canvas.width) return 0;
    const bounds = canvas.getBoundingClientRect();
    const position = getActiveCursorPosition();
    const relativeX = (position.x * window.innerWidth - bounds.left) / Math.max(1, bounds.width);
    return Math.max(0, Math.min(getTotalColumns() - 1, Math.floor(relativeX * getTotalColumns())));
}

function getColumnFrequency(column) {
    const columns = getTotalColumns();
    const columnWidth = canvas.width / columns;
    const startX = Math.floor(column * columnWidth);
    const endX = Math.max(startX + 1, Math.floor((column + 1) * columnWidth));
    const pixels = ctx.getImageData(startX, 0, endX - startX, canvas.height).data;
    let red = 0;
    let green = 0;
    let blue = 0;

    for (let index = 0; index < pixels.length; index += 4) {
        red += pixels[index];
        green += pixels[index + 1];
        blue += pixels[index + 2];
    }

    const pixelCount = pixels.length / 4;
    const brightness = (red + green + blue) / (pixelCount * 3 * 255);
    const frequency = 100 * Math.pow(4000 / 100, 1 - brightness);
    return frequency;
}

function scanNextColumn() {
    if (!isPlaying || !mediaLoaded) return;

    if (currentColumn >= getTotalColumns()) {
        stopScanning();
        return;
    }

    drawMedia();
    const frequency = getColumnFrequency(currentColumn);
    const activeSynth = startAudio();
    if (activeSynth) {
        activeSynth.triggerAttackRelease(frequency, Number(speedRange.value) / 1000 * 0.9);
    }

    drawMedia(currentColumn);
    currentColumn += 1;
    scanTimer = setTimeout(scanNextColumn, Number(speedRange.value));
}

function scanFreeColumn() {
    if (!isPlaying || !mediaLoaded) return;

    const column = getCursorColumn();
    if (column !== freeScanLastColumn) {
        drawMedia();
        const frequency = getColumnFrequency(column);
        const activeSynth = startAudio();
        if (activeSynth) {
            activeSynth.triggerAttackRelease(frequency, 0.08);
        }
        drawMedia(column);
        freeScanLastColumn = column;
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

    const image = new Image();
    image.onload = () => {
        mediaSource = image;
        mediaLoaded = true;
        drawMedia();
        playPauseButton.disabled = false;
        stopButton.disabled = false;
    };
    image.src = mediaObjectUrl;
}

function setMidiStatus(message, type = 'default') {
    midiStatus.innerText = message;
    midiStatus.className = `text-xs ${
        type === 'error' ? 'text-red-600' : type === 'success' ? 'text-emerald-600' : 'text-gray-500'
    }`;
}

function refreshMidiInputs() {
    if (!midiAccess) return;

    const inputs = Array.from(midiAccess.inputs.values());
    midiInputSelect.replaceChildren();

    if (inputs.length === 0) {
        setMidiInputHandler(null);
        midiInputSelect.disabled = true;
        midiInputSelect.add(new Option('No se detectaron entradas MIDI', ''));
        setMidiStatus('No hay dispositivos MIDI de entrada conectados.');
        selectedMidiInput = null;
        return;
    }

    inputs.forEach((input) => {
        midiInputSelect.add(new Option(input.name || 'Dispositivo MIDI sin nombre', input.id));
    });
    midiInputSelect.disabled = false;
    setMidiInputHandler(inputs[0]);
    midiInputSelect.value = selectedMidiInput.id;
    setMidiStatus(`${inputs.length} dispositivo${inputs.length === 1 ? '' : 's'} MIDI detectado${inputs.length === 1 ? '' : 's'}.`, 'success');
}

function setMidiInputHandler(input) {
    if (selectedMidiInput && selectedMidiInput !== input) {
        selectedMidiInput.onmidimessage = null;
    }
    selectedMidiInput = input;
    if (selectedMidiInput) selectedMidiInput.onmidimessage = handleMidiMessage;
}

function handleMidiMessage(event) {
    const [status, controller, value] = event.data;
    const messageType = status & 0xf0;
    if (messageType !== 0xb0) return;

    const targetId = midiLearningTarget || Array.from(midiMappings.entries())
        .find(([, mapping]) => mapping.channel === (status & 0x0f) && mapping.controller === controller)?.[0];

    if (!targetId) return;

    if (midiLearningTarget) {
        midiMappings.set(targetId, { channel: status & 0x0f, controller });
        midiLearningTarget = null;
        midiLearnButtons.forEach((button) => button.classList.remove('is-learning'));
        updateMidiButtonLabels();
        setMidiStatus(`Slider vinculado al CC ${controller + 1}.`, 'success');
    }

    const slider = document.getElementById(targetId);
    if (!slider) return;
    const ratio = value / 127;
    slider.value = String(Number(slider.min) + ratio * (Number(slider.max) - Number(slider.min)));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
}

function updateMidiButtonLabels() {
    midiLearnButtons.forEach((button) => {
        const mapping = midiMappings.get(button.dataset.midiTarget);
        button.innerText = mapping ? `CC ${mapping.controller + 1}` : 'Asignar MIDI';
    });
}

async function detectMidiDevices() {
    if (!navigator.requestMIDIAccess) {
        setMidiStatus('Este navegador no admite Web MIDI. Prueba con Chrome o Edge.', 'error');
        return;
    }

    detectMidiButton.disabled = true;
    setMidiStatus('Buscando dispositivos MIDI...');

    try {
        midiAccess = await navigator.requestMIDIAccess({ sysex: false });
        midiAccess.onstatechange = refreshMidiInputs;
        refreshMidiInputs();
    } catch (error) {
        setMidiStatus(
            error.name === 'SecurityError' || error.name === 'NotAllowedError'
                ? 'El acceso MIDI fue bloqueado. Concede el permiso del navegador y vuelve a intentarlo.'
                : 'No se pudo acceder a los dispositivos MIDI.',
            'error'
        );
        console.error('Error al solicitar acceso MIDI:', error);
    } finally {
        detectMidiButton.disabled = false;
    }
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

scannerChannelButton.addEventListener('click', launchScannerChannel);
scannerChannelButton.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') launchScannerChannel();
});
headerMenuButton.addEventListener('click', returnToLidHome);
closeScannerButton.addEventListener('click', returnToLidHome);
closeCameraButton.addEventListener('click', closeCameraWindow);
startCameraButton.addEventListener('click', async () => {
    if (cameraAppView.classList.contains('hidden')) {
        await launchCameraChannel();
    }
    if (cameraModeActive) return;
    await startCamera();
});
stopCameraButton.addEventListener('click', stopCamera);
cameraSelect.addEventListener('change', () => {
    if (cameraModeActive) startCamera();
});
playPauseButton.addEventListener('click', () => (isPlaying ? pauseScanning() : startScanning()));
stopButton.addEventListener('click', stopScanning);
imageInput.addEventListener('change', handleMediaSelection);
freeModeToggle.addEventListener('change', () => {
    if (!isPlaying) return;
    pauseScanning();
    startScanning();
});

speedRange.addEventListener('input', updateSettings);
resolutionRange.addEventListener('input', updateSettings);
waveTypeSelect.addEventListener('change', updateSettings);
attackRange.addEventListener('input', updateSettings);
releaseRange.addEventListener('input', updateSettings);
filterRange.addEventListener('input', updateSettings);
reverbRange.addEventListener('input', updateSettings);
detectMidiButton.addEventListener('click', detectMidiDevices);
midiInputSelect.addEventListener('change', () => {
    if (!midiAccess) return;
    setMidiInputHandler(midiAccess.inputs.get(midiInputSelect.value) || null);
});
clearMidiMappingsButton.addEventListener('click', () => {
    midiMappings.clear();
    midiLearningTarget = null;
    midiLearnButtons.forEach((button) => button.classList.remove('is-learning'));
    updateMidiButtonLabels();
    setMidiStatus('Vínculos MIDI eliminados.');
});
midiLearnButtons.forEach((button) => {
    button.addEventListener('click', () => {
        if (!selectedMidiInput) {
            setMidiStatus('Detecta y selecciona un dispositivo MIDI antes de asignar un slider.', 'error');
            return;
        }
        midiLearningTarget = button.dataset.midiTarget;
        midiLearnButtons.forEach((learnButton) => learnButton.classList.toggle('is-learning', learnButton === button));
        setMidiStatus(`Mueve un control MIDI para asignarlo a ${button.dataset.midiTarget}.`);
    });
});

document.getElementById('infoButton').addEventListener('click', () => openModal(infoModal));
document.getElementById('closeInfoButton').addEventListener('click', () => closeModal(infoModal));
document.getElementById('infoConfirmButton').addEventListener('click', () => closeModal(infoModal));
document.getElementById('settingsButton').addEventListener('click', () => openModal(settingsModal));
document.getElementById('closeSettingsButton').addEventListener('click', () => closeModal(settingsModal));
document.getElementById('settingsConfirmButton').addEventListener('click', () => closeModal(settingsModal));
document.getElementById('messageBoardButton').addEventListener('click', () => openModal(messageBoardModal));
document.getElementById('messageBoardConfirmButton').addEventListener('click', () => closeModal(messageBoardModal));

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

settingsHeader.addEventListener('pointerup', () => {
    settingsDragState = null;
});

settingsHeader.addEventListener('pointercancel', () => {
    settingsDragState = null;
});

minimizeSettingsButton.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsMinimizedIcon.classList.remove('hidden');
});

settingsMinimizedIcon.addEventListener('click', () => {
    settingsMinimizedIcon.classList.add('hidden');
    settingsModal.classList.remove('hidden');
});

let minimizedIconDragState = null;

settingsMinimizedIcon.addEventListener('pointerdown', (event) => {
    const bounds = settingsMinimizedIcon.getBoundingClientRect();
    minimizedIconDragState = {
        offsetX: event.clientX - bounds.left,
        offsetY: event.clientY - bounds.top
    };
    settingsMinimizedIcon.setPointerCapture(event.pointerId);
});

settingsMinimizedIcon.addEventListener('pointermove', (event) => {
    if (!minimizedIconDragState) return;

    settingsMinimizedIcon.style.left = `${event.clientX - minimizedIconDragState.offsetX}px`;
    settingsMinimizedIcon.style.top = `${event.clientY - minimizedIconDragState.offsetY}px`;
    settingsMinimizedIcon.style.right = 'auto';
    settingsMinimizedIcon.style.bottom = 'auto';
});

settingsMinimizedIcon.addEventListener('pointerup', () => {
    minimizedIconDragState = null;
});

settingsMinimizedIcon.addEventListener('pointercancel', () => {
    minimizedIconDragState = null;
});

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    document.getElementById('clockDisplay').innerText = `${hours}:${minutes}`;
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    document.getElementById('dateDisplay').innerText =
        `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}`;
}

updateSettings();
setInterval(updateClock, 1000);
updateClock();
