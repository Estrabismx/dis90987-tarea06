const appTitleHeader = document.getElementById('appTitleHeader');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');
const downloadPngButton = document.getElementById('downloadPngButton');
const downloadMp3Button = document.getElementById('downloadMp3Button');
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
const minFrequencyRange = document.getElementById('minFrequency');
const minFrequencyValue = document.getElementById('minFrequencyValue');
const maxFrequencyRange = document.getElementById('maxFrequency');
const maxFrequencyValue = document.getElementById('maxFrequencyValue');
const volumeRange = document.getElementById('volume');
const volumeValue = document.getElementById('volumeValue');
const reverbRange = document.getElementById('reverb');
const reverbValue = document.getElementById('reverbValue');
const imageBrightnessRange = document.getElementById('imageBrightness');
const imageBrightnessValue = document.getElementById('imageBrightnessValue');
const imageContrastRange = document.getElementById('imageContrast');
const imageContrastValue = document.getElementById('imageContrastValue');
const imageOpacityRange = document.getElementById('imageOpacity');
const imageOpacityValue = document.getElementById('imageOpacityValue');
const learnBrightnessMidi = document.getElementById('learnBrightnessMidi');
const learnContrastMidi = document.getElementById('learnContrastMidi');
const learnOpacityMidi = document.getElementById('learnOpacityMidi');
const learnResolutionMidi = document.getElementById('learnResolutionMidi');
const learnSpeedMidi = document.getElementById('learnSpeedMidi');
const learnAttackMidi = document.getElementById('learnAttackMidi');
const learnReleaseMidi = document.getElementById('learnReleaseMidi');
const learnMinFrequencyMidi = document.getElementById('learnMinFrequencyMidi');
const learnMaxFrequencyMidi = document.getElementById('learnMaxFrequencyMidi');
const learnVolumeMidi = document.getElementById('learnVolumeMidi');
const learnReverbMidi = document.getElementById('learnReverbMidi');
const soundSettingsTab = document.getElementById('soundSettingsTab');
const visualSettingsTab = document.getElementById('visualSettingsTab');
const soundSettingsPanel = document.getElementById('soundSettingsPanel');
const visualSettingsPanel = document.getElementById('visualSettingsPanel');
const midiInputSelect = document.getElementById('midiInputSelect');
const midiToggleButton = document.getElementById('midiToggleButton');
const midiStatus = document.getElementById('midiStatus');

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
let reverbNode = null;
let mediaType = null;
let audioBuffer = null;
let audioFile = null;
let spectrogramImageData = null;
let spectrogramGenerationId = 0;
let downloadInProgress = false;
let midiAccess = null;
let activeMidiInput = null;
let midiEnabled = false;
let midiLearnTarget = null;
let midiLearnButton = null;

const midiSliderMap = new Map([
    [1, resolutionRange],
    [2, speedRange],
    [3, attackRange],
    [4, releaseRange],
    [5, minFrequencyRange],
    [6, maxFrequencyRange],
    [7, volumeRange],
    [8, reverbRange],
    [9, imageBrightnessRange],
    [10, imageContrastRange],
    [11, imageOpacityRange]
]);

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
const pianoRollRows = 24;
const darknessThreshold = 0.45;

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
        reverbNode = new Tone.Reverb({ decay: 2, wet: Number(reverbRange.value) });
        synth = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: pianoRollRows
        }).chain(reverbNode, Tone.Destination);
        synth.set({
            oscillator: { type: waveTypeSelect.value },
            envelope: {
                attack: Number(attackRange.value),
                decay: 0.1,
                sustain: 0.5,
                release: Number(releaseRange.value)
            }
        });
        updateDestinationVolume();
    }
    return synth;
}

function updateDestinationVolume() {
    if (typeof Tone === 'undefined' || !Tone.Destination) return;
    const volume = Number(volumeRange.value);
    Tone.Destination.volume.value = volume === 0 ? -Infinity : 20 * Math.log10(volume);
}

function startAudio() {
    if (typeof Tone !== 'undefined') Tone.start();
    return ensureSynth();
}

function setMidiStatus(message, isError = false) {
    midiStatus.innerText = message;
    midiStatus.className = `text-[10px] ${isError ? 'text-red-600' : 'text-gray-500'}`;
}

function handleMidiMessage(event) {
    if (!midiEnabled || !event.data || event.data.length < 3) return;
    const [status, controller, value] = event.data;
    if ((status & 0xf0) !== 0xb0) return;
    if (midiLearnTarget) {
        for (const [mappedController, mappedSlider] of midiSliderMap) {
            if (mappedSlider === midiLearnTarget || mappedController === controller) {
                midiSliderMap.delete(mappedController);
            }
        }
        midiSliderMap.set(controller, midiLearnTarget);
        if (midiLearnButton) {
            midiLearnButton.innerText = `CC ${controller}`;
            midiLearnButton.classList.remove('bg-yellow-200', 'text-yellow-800');
            midiLearnButton.classList.add('bg-blue-100', 'text-blue-700');
        }
        setMidiStatus(`Asignado CC ${controller}`);
        midiLearnTarget = null;
        midiLearnButton = null;
    }
    const slider = midiSliderMap.get(controller);
    if (!slider) return;

    const ratio = value / 127;
    const min = Number(slider.min);
    const max = Number(slider.max);
    const step = Number(slider.step) || 1;
    const steppedValue = Math.round((min + ratio * (max - min)) / step) * step;
    slider.value = String(Math.max(min, Math.min(max, steppedValue)));
    slider.dispatchEvent(new Event('input', { bubbles: true }));
}

function startMidiLearn(slider, button) {
    if (!midiEnabled) {
        setMidiStatus('Activa MIDI antes de aprender un CC', true);
        return;
    }
    if (midiLearnButton) {
        midiLearnButton.innerText = 'Aprender CC';
        midiLearnButton.classList.remove('bg-yellow-200', 'text-yellow-800');
        midiLearnButton.classList.add('bg-blue-100', 'text-blue-700');
    }
    midiLearnTarget = slider;
    midiLearnButton = button;
    button.innerText = 'Mueve un control';
    button.classList.remove('bg-blue-100', 'text-blue-700');
    button.classList.add('bg-yellow-200', 'text-yellow-800');
    setMidiStatus('Esperando un mensaje CC...');
}

function makeValueEditable(valueElement, rangeElement) {
    valueElement.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (valueElement.querySelector('input')) return;

        const input = document.createElement('input');
        input.type = 'number';
        input.value = rangeElement.value;
        input.min = rangeElement.min;
        input.max = rangeElement.max;
        input.step = rangeElement.step || 'any';
        input.className = 'w-16 rounded border border-blue-400 bg-white px-1 text-center text-blue-700 outline-none';
        valueElement.replaceChildren(input);
        input.focus();
        input.select();

        const commit = () => {
            const entered = Number(input.value);
            const min = Number(rangeElement.min);
            const max = Number(rangeElement.max);
            const step = Number(rangeElement.step) || 1;
            if (!Number.isFinite(entered)) {
                rangeElement.dispatchEvent(new Event('input', { bubbles: true }));
                return;
            }
            const stepped = Math.round((Math.max(min, Math.min(max, entered)) - min) / step) * step + min;
            rangeElement.value = String(Math.max(min, Math.min(max, stepped)));
            rangeElement.dispatchEvent(new Event('input', { bubbles: true }));
        };
        input.addEventListener('blur', commit, { once: true });
        input.addEventListener('keydown', (keyEvent) => {
            if (keyEvent.key === 'Enter') input.blur();
            if (keyEvent.key === 'Escape') {
                input.removeEventListener('blur', commit);
                rangeElement.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
    });
}

function detachMidiInput() {
    if (!activeMidiInput) return;
    activeMidiInput.onmidimessage = null;
    activeMidiInput = null;
}

function connectMidiInput() {
    detachMidiInput();
    if (!midiAccess || !midiInputSelect.value) {
        setMidiStatus(midiEnabled ? 'Sin entrada seleccionada' : 'Desconectado');
        return;
    }
    activeMidiInput = midiAccess.inputs.get(midiInputSelect.value);
    if (!activeMidiInput) {
        setMidiStatus('Entrada MIDI no disponible', true);
        return;
    }
    activeMidiInput.onmidimessage = handleMidiMessage;
    setMidiStatus(`Activo: ${activeMidiInput.name || 'Entrada MIDI'}`);
}

function refreshMidiInputs() {
    if (!midiAccess) return;
    const selectedId = midiInputSelect.value;
    midiInputSelect.replaceChildren();
    midiAccess.inputs.forEach((input) => {
        const option = document.createElement('option');
        option.value = input.id;
        option.textContent = input.name || 'Entrada MIDI';
        midiInputSelect.appendChild(option);
    });
    if (!midiAccess.inputs.size) {
        midiInputSelect.add(new Option('No se encontraron entradas MIDI', ''));
    } else if (midiAccess.inputs.has(selectedId)) {
        midiInputSelect.value = selectedId;
    }
    midiInputSelect.disabled = !midiEnabled || !midiAccess.inputs.size;
    if (midiEnabled) connectMidiInput();
}

async function toggleMidi() {
    if (midiEnabled) {
        midiEnabled = false;
        detachMidiInput();
        midiInputSelect.disabled = true;
        midiToggleButton.innerText = 'Activar MIDI';
        setMidiStatus('Desconectado');
        return;
    }
    if (!navigator.requestMIDIAccess) {
        setMidiStatus('Navegador no compatible', true);
        return;
    }
    try {
        midiAccess = await navigator.requestMIDIAccess();
        midiEnabled = true;
        midiToggleButton.innerText = 'Desactivar MIDI';
        midiAccess.onstatechange = refreshMidiInputs;
        refreshMidiInputs();
        setMidiStatus(midiAccess.inputs.size ? 'Selecciona una entrada' : 'Sin entradas MIDI');
    } catch (error) {
        setMidiStatus('Permiso MIDI rechazado', true);
        console.error('No se pudo activar MIDI:', error);
    }
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

function setSettingsTab(activeTab, activePanel, inactiveTab, inactivePanel) {
    activeTab.setAttribute('aria-selected', 'true');
    inactiveTab.setAttribute('aria-selected', 'false');
    activeTab.classList.add('border-blue-500', 'text-blue-600');
    activeTab.classList.remove('border-transparent', 'text-gray-500');
    inactiveTab.classList.add('border-transparent', 'text-gray-500');
    inactiveTab.classList.remove('border-blue-500', 'text-blue-600');
    activePanel.classList.remove('hidden');
    inactivePanel.classList.add('hidden');
}

function isAudioFile(file) {
    return file.type.startsWith('audio/') || /\.(mp3|wav|ogg)$/i.test(file.name);
}

function updateUploadLabel(file) {
    const fileName = mediaUploadZone.querySelector('.media-file-name');
    fileName.innerText = file.name;
    fileName.title = file.name;
    mediaUploadZone.querySelector('span:nth-child(3)').innerText =
        isAudioFile(file) ? 'Audio listo para generar espectrograma.' : 'Imagen cargada con éxito.';
}

function getTotalColumns() { return Number(resolutionRange.value); }

function drawMedia(highlightColumn = -1) {
    if (!mediaLoaded || mediaType !== 'image') return;
    const width = mediaSource.naturalWidth;
    const height = mediaSource.naturalHeight;
    const maxWidth = 600;
    const scale = Math.min(1, maxWidth / width);
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const columns = getTotalColumns();

    canvas.width = w;
    canvas.height = h;
    ctx.filter = `brightness(${Number(imageBrightnessRange.value) / 100}) contrast(${Number(imageContrastRange.value) / 100}) opacity(${Number(imageOpacityRange.value) / 100})`;
    ctx.drawImage(mediaSource, 0, 0, w, h);
    ctx.filter = 'none';

    if (highlightColumn < 0) return;
    const columnWidth = w / columns;
    const x = highlightColumn * columnWidth;
    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.fillRect(x, 0, columnWidth, h);
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 0, columnWidth, h);
}

function getVisualFrequencyRange() {
    const minFrequency = 80;
    const maxFrequency = 8000;
    return { minFrequency, maxFrequency };
}

function performFft(samples) {
    const size = samples.length;
    const real = new Float32Array(samples);
    const imaginary = new Float32Array(size);

    for (let i = 1, j = 0; i < size; i += 1) {
        let bit = size >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) {
            const value = real[i];
            real[i] = real[j];
            real[j] = value;
        }
    }

    for (let length = 2; length <= size; length <<= 1) {
        const angle = -2 * Math.PI / length;
        const cosine = Math.cos(angle);
        const sine = Math.sin(angle);
        for (let start = 0; start < size; start += length) {
            let currentCosine = 1;
            let currentSine = 0;
            const halfLength = length >> 1;
            for (let offset = 0; offset < halfLength; offset += 1) {
                const even = start + offset;
                const odd = even + halfLength;
                const oddReal = real[odd] * currentCosine - imaginary[odd] * currentSine;
                const oddImaginary = real[odd] * currentSine + imaginary[odd] * currentCosine;
                real[odd] = real[even] - oddReal;
                imaginary[odd] = imaginary[even] - oddImaginary;
                real[even] += oddReal;
                imaginary[even] += oddImaginary;
                const nextCosine = currentCosine * cosine - currentSine * sine;
                currentSine = currentCosine * sine + currentSine * cosine;
                currentCosine = nextCosine;
            }
        }
    }

    const magnitudes = new Float32Array(size / 2);
    for (let i = 0; i < magnitudes.length; i += 1) {
        magnitudes[i] = Math.sqrt(real[i] ** 2 + imaginary[i] ** 2) / size;
    }
    return magnitudes;
}

function getPaletteColor(value) {
    const intensity = Math.max(0, Math.min(1, value));
    const channel = Math.round(intensity * 255);
    return [channel, channel, channel];
}

function renderSpectrogram() {
    if (!spectrogramImageData) return;
    canvas.width = spectrogramImageData.width;
    canvas.height = spectrogramImageData.height;
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = spectrogramImageData.width;
    sourceCanvas.height = spectrogramImageData.height;
    sourceCanvas.getContext('2d').putImageData(spectrogramImageData, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = `brightness(${Number(imageBrightnessRange.value) / 100}) contrast(${Number(imageContrastRange.value) / 100}) opacity(${Number(imageOpacityRange.value) / 100})`;
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.filter = 'none';
}

function updateDownloadButtons() {
    downloadPngButton.disabled = !mediaLoaded;
    downloadMp3Button.disabled = mediaType !== 'image' || downloadInProgress;
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadCanvasAsPng() {
    if (!mediaLoaded) return;
    if (mediaType === 'image') drawMedia();
    canvas.toBlob((blob) => {
        if (blob) downloadBlob(blob, mediaType === 'audio' ? 'espectrograma.png' : 'imagen-traducida.png');
    }, 'image/png');
}

function getExportFrequencies(column) {
    return getColumnFrequencies(column);
}

function renderImageAudioSamples() {
    const sampleRate = 44100;
    const columnDuration = Number(speedRange.value) / 1000;
    const columnCount = getTotalColumns();
    const totalSamples = Math.ceil(columnCount * columnDuration * sampleRate);
    const samples = new Float32Array(totalSamples);
    const volume = Number(volumeRange.value);
    const attackSamples = Math.max(1, Math.floor(Number(attackRange.value) * sampleRate));
    const releaseSamples = Math.max(1, Math.floor(Number(releaseRange.value) * sampleRate));
    drawMedia();

    for (let column = 0; column < columnCount; column += 1) {
        const frequencies = getExportFrequencies(column);
        const start = Math.floor(column * columnDuration * sampleRate);
        const end = Math.min(totalSamples, Math.floor((column + 1) * columnDuration * sampleRate));
        for (let index = start; index < end; index += 1) {
            const localIndex = index - start;
            const remaining = end - index;
            const envelope = Math.min(
                1,
                localIndex / attackSamples,
                remaining / releaseSamples
            );
            let value = 0;
            for (const frequency of frequencies) {
                value += Math.sin(2 * Math.PI * frequency * index / sampleRate);
            }
            samples[index] = frequencies.length
                ? value / frequencies.length * volume * envelope
                : 0;
        }
    }
    return { samples, sampleRate };
}

async function downloadImageAsMp3() {
    if (mediaType !== 'image' || downloadInProgress) return;
    if (typeof lamejs === 'undefined') {
        console.error('El codificador MP3 no está disponible.');
        return;
    }

    downloadInProgress = true;
    updateDownloadButtons();
    try {
        const { samples, sampleRate } = renderImageAudioSamples();
        const encoder = new lamejs.Mp3Encoder(1, sampleRate, 128);
        const blockSize = 1152;
        const mp3Chunks = [];
        for (let offset = 0; offset < samples.length; offset += blockSize) {
            const block = samples.subarray(offset, Math.min(offset + blockSize, samples.length));
            const pcm = new Int16Array(block.length);
            for (let i = 0; i < block.length; i += 1) {
                pcm[i] = Math.max(-1, Math.min(1, block[i])) * 32767;
            }
            const encoded = encoder.encodeBuffer(pcm);
            if (encoded.length) mp3Chunks.push(new Int8Array(encoded));
        }
        const finalBlock = encoder.flush();
        if (finalBlock.length) mp3Chunks.push(new Int8Array(finalBlock));
        downloadBlob(new Blob(mp3Chunks, { type: 'audio/mpeg' }), 'imagen-traducida.mp3');
    } finally {
        downloadInProgress = false;
        updateDownloadButtons();
    }
}

async function generarEspectrogramaOffline(file) {
    const generationId = ++spectrogramGenerationId;
    if (typeof OfflineAudioContext === 'undefined') {
        throw new Error('Este navegador no soporta OfflineAudioContext.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new OfflineAudioContext(1, 1, 44100);
    audioBuffer = await decoder.decodeAudioData(arrayBuffer);
    if (generationId !== spectrogramGenerationId) return;

    const fftSize = 2048;
    const sourceData = new Float32Array(audioBuffer.length);
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel += 1) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < sourceData.length; i += 1) sourceData[i] += channelData[i] / audioBuffer.numberOfChannels;
    }

    const width = 1024;
    const height = Math.round(width * 9 / 16);
    const { minFrequency, maxFrequency } = getVisualFrequencyRange();
    const minDb = -80;
    const maxDb = -10;
    const smoothing = 0.8;
    const previousMagnitudes = new Float32Array(fftSize / 2);
    const imageData = ctx.createImageData(width, height);

    for (let x = 0; x < width; x += 1) {
        const center = Math.floor((x / Math.max(1, width - 1)) * (sourceData.length - 1));
        const samples = new Float32Array(fftSize);
        for (let i = 0; i < fftSize; i += 1) {
            const index = center - Math.floor(fftSize / 2) + i;
            if (index >= 0 && index < sourceData.length) {
                samples[i] = sourceData[index] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (fftSize - 1)));
            }
        }

        const magnitudes = performFft(samples);
        for (let bin = 0; bin < magnitudes.length; bin += 1) {
            previousMagnitudes[bin] = previousMagnitudes[bin] * smoothing + magnitudes[bin] * (1 - smoothing);
        }
        for (let y = 0; y < height; y += 1) {
            const frequency = maxFrequency * Math.pow(minFrequency / maxFrequency, y / Math.max(1, height - 1));
            const bin = Math.round(frequency * fftSize / audioBuffer.sampleRate);
            const magnitude = previousMagnitudes[Math.max(0, Math.min(previousMagnitudes.length - 1, bin))];
            const db = 20 * Math.log10(Math.max(magnitude, 1e-8));
            const intensity = (db - minDb) / (maxDb - minDb);
            const color = getPaletteColor(intensity);
            const offset = (y * width + x) * 4;
            imageData.data[offset] = color[0];
            imageData.data[offset + 1] = color[1];
            imageData.data[offset + 2] = color[2];
            imageData.data[offset + 3] = 255;
        }
    }

    if (generationId !== spectrogramGenerationId) return;
    spectrogramImageData = imageData;
    renderSpectrogram();
    mediaLoaded = true;
    mediaType = 'audio';
    playPauseButton.disabled = true;
    stopButton.disabled = true;
    updateDownloadButtons();
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

function getColumnFrequencies(column) {
    const columns = getTotalColumns();
    const columnWidth = canvas.width / columns;
    const startX = Math.floor(column * columnWidth);
    const endX = Math.max(startX + 1, Math.floor((column + 1) * columnWidth));
    const minFrequency = Number(minFrequencyRange.value);
    const maxFrequency = Math.max(minFrequency, Number(maxFrequencyRange.value));
    const frequencies = [];
    const rowHeight = canvas.height / pianoRollRows;
    const pixels = ctx.getImageData(startX, 0, endX - startX, canvas.height).data;

    for (let row = 0; row < pianoRollRows; row += 1) {
        const startY = Math.floor(row * rowHeight);
        const endY = Math.max(startY + 1, Math.floor((row + 1) * rowHeight));
        let brightnessTotal = 0;
        let pixelCount = 0;

        for (let y = startY; y < endY; y += 1) {
            for (let x = 0; x < endX - startX; x += 1) {
                const pixelIndex = (y * (endX - startX) + x) * 4;
                brightnessTotal += (pixels[pixelIndex] + pixels[pixelIndex + 1] + pixels[pixelIndex + 2]) / (3 * 255);
                pixelCount += 1;
            }
        }

        const brightness = brightnessTotal / pixelCount;
        if (brightness <= darknessThreshold) {
            const verticalPosition = row / (pianoRollRows - 1);
            frequencies.push(maxFrequency * Math.pow(minFrequency / maxFrequency, verticalPosition));
        }
    }

    return frequencies;
}

function scanNextColumn() {
    if (!isPlaying || !mediaLoaded) return;
    if (currentColumn >= getTotalColumns()) {
        stopScanning();
        return;
    }
    drawMedia();
    const frequencies = getColumnFrequencies(currentColumn);
    const s = startAudio();
    if (s && frequencies.length) {
        s.triggerAttackRelease(frequencies, Number(speedRange.value) / 1000 * 0.9);
    }
    drawMedia(currentColumn);
    currentColumn += 1;
    scanTimer = setTimeout(scanNextColumn, Number(speedRange.value));
}

function scanFreeColumn() {
    if (!isPlaying || !mediaLoaded) return;
    const col = getCursorColumn();
    if (col !== freeScanLastColumn) {
        drawMedia();
        const frequencies = getColumnFrequencies(col);
        const s = startAudio();
        if (s && frequencies.length) s.triggerAttackRelease(frequencies, 0.08);
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
    if (mediaLoaded && mediaType === 'image') drawMedia();
}

async function handleMediaSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (mediaObjectUrl) URL.revokeObjectURL(mediaObjectUrl);
    mediaObjectUrl = URL.createObjectURL(file);
    updateUploadLabel(file);
    stopScanning();
    mediaLoaded = false;
    mediaType = null;
    audioBuffer = null;
    audioFile = null;
    spectrogramImageData = null;

    if (isAudioFile(file)) {
        audioFile = file;
        playPauseButton.disabled = true;
        stopButton.disabled = true;
        updateDownloadButtons();
        try {
            await generarEspectrogramaOffline(file);
        } catch (error) {
            mediaUploadZone.querySelector('span:nth-child(3)').innerText = 'No se pudo leer el audio.';
            console.error('Error al generar el espectrograma:', error);
        }
        return;
    }

    if (!file.type.startsWith('image/')) {
        mediaUploadZone.querySelector('span:nth-child(3)').innerText = 'Formato no compatible.';
        updateDownloadButtons();
        return;
    }

    const img = new Image();
    img.onload = () => {
        mediaSource = img;
        mediaLoaded = true;
        mediaType = 'image';
        drawMedia();
        playPauseButton.disabled = false;
        stopButton.disabled = false;
        updateDownloadButtons();
    };
    img.src = mediaObjectUrl;
}

function updateSettings() {
    resValue.innerText = resolutionRange.value;
    speedValue.innerText = speedRange.value;
    attackValue.innerText = `${attackRange.value}s`;
    releaseValue.innerText = `${releaseRange.value}s`;
    minFrequencyValue.innerText = `${minFrequencyRange.value}Hz`;
    maxFrequencyValue.innerText = `${maxFrequencyRange.value}Hz`;
    volumeValue.innerText = `${Math.round(Number(volumeRange.value) * 100)}%`;
    reverbValue.innerText = `${Math.round(Number(reverbRange.value) * 100)}%`;
    imageBrightnessValue.innerText = `${imageBrightnessRange.value}%`;
    imageContrastValue.innerText = `${imageContrastRange.value}%`;
    imageOpacityValue.innerText = `${imageOpacityRange.value}%`;

    if (synth) {
        synth.set({
            oscillator: { type: waveTypeSelect.value },
            envelope: {
                attack: Number(attackRange.value),
                release: Number(releaseRange.value)
            }
        });
    }
    updateDestinationVolume();
    if (reverbNode) reverbNode.wet.value = Number(reverbRange.value);
    if (mediaType === 'audio' && audioBuffer && !isPlaying) {
        renderSpectrogram();
    } else if (mediaLoaded && !isPlaying) {
        drawMedia();
    }
}

// Event Listeners
playPauseButton.addEventListener('click', () => (isPlaying ? pauseScanning() : startScanning()));
stopButton.addEventListener('click', stopScanning);
imageInput.addEventListener('change', handleMediaSelection);
downloadPngButton.addEventListener('click', downloadCanvasAsPng);
downloadMp3Button.addEventListener('click', downloadImageAsMp3);
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
minFrequencyRange.addEventListener('input', updateSettings);
maxFrequencyRange.addEventListener('input', updateSettings);
volumeRange.addEventListener('input', updateSettings);
reverbRange.addEventListener('input', updateSettings);
imageBrightnessRange.addEventListener('input', updateSettings);
imageContrastRange.addEventListener('input', updateSettings);
imageOpacityRange.addEventListener('input', updateSettings);
midiToggleButton.addEventListener('click', toggleMidi);
midiInputSelect.addEventListener('change', connectMidiInput);
learnBrightnessMidi.addEventListener('click', () => startMidiLearn(imageBrightnessRange, learnBrightnessMidi));
learnContrastMidi.addEventListener('click', () => startMidiLearn(imageContrastRange, learnContrastMidi));
learnOpacityMidi.addEventListener('click', () => startMidiLearn(imageOpacityRange, learnOpacityMidi));
learnResolutionMidi.addEventListener('click', () => startMidiLearn(resolutionRange, learnResolutionMidi));
learnSpeedMidi.addEventListener('click', () => startMidiLearn(speedRange, learnSpeedMidi));
learnAttackMidi.addEventListener('click', () => startMidiLearn(attackRange, learnAttackMidi));
learnReleaseMidi.addEventListener('click', () => startMidiLearn(releaseRange, learnReleaseMidi));
learnMinFrequencyMidi.addEventListener('click', () => startMidiLearn(minFrequencyRange, learnMinFrequencyMidi));
learnMaxFrequencyMidi.addEventListener('click', () => startMidiLearn(maxFrequencyRange, learnMaxFrequencyMidi));
learnVolumeMidi.addEventListener('click', () => startMidiLearn(volumeRange, learnVolumeMidi));
learnReverbMidi.addEventListener('click', () => startMidiLearn(reverbRange, learnReverbMidi));
makeValueEditable(resValue, resolutionRange);
makeValueEditable(speedValue, speedRange);
makeValueEditable(attackValue, attackRange);
makeValueEditable(releaseValue, releaseRange);
makeValueEditable(minFrequencyValue, minFrequencyRange);
makeValueEditable(maxFrequencyValue, maxFrequencyRange);
makeValueEditable(volumeValue, volumeRange);
makeValueEditable(reverbValue, reverbRange);
makeValueEditable(imageBrightnessValue, imageBrightnessRange);
makeValueEditable(imageContrastValue, imageContrastRange);
makeValueEditable(imageOpacityValue, imageOpacityRange);
soundSettingsTab.addEventListener('click', () => setSettingsTab(
    soundSettingsTab, soundSettingsPanel, visualSettingsTab, visualSettingsPanel
));
visualSettingsTab.addEventListener('click', () => setSettingsTab(
    visualSettingsTab, visualSettingsPanel, soundSettingsTab, soundSettingsPanel
));

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
