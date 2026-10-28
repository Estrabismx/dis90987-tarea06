const clockDisplay = document.getElementById('clockDisplay');
const dateDisplay = document.getElementById('dateDisplay');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');
const downloadButton = document.getElementById('downloadButton');
const convertButton = document.getElementById('convertButton');
const freeModeToggle = document.getElementById('freeModeToggle');
const scanAxis = document.getElementById('scanAxis');

const imageInput = document.getElementById('imageInput');
const mediaUploadZone = document.getElementById('mediaUploadZone');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const canvasContainer = document.getElementById('canvasContainer');
const appHeader = document.getElementById('appHeader');
const appMain = document.getElementById('appMain');
const appFooter = document.getElementById('appFooter');
const scannerAppView = document.getElementById('scannerAppView');
const scannerTitleBar = document.getElementById('scannerTitleBar');
const scannerWorkspace = document.getElementById('scannerWorkspace');
const scannerControls = document.getElementById('scannerControls');

const resolutionRange = document.getElementById('resolution');
const speedRange = document.getElementById('speed');
const rowsRange = document.getElementById('rows');
const speedYRange = document.getElementById('speedY');
const waveTypeSelect = document.getElementById('waveType');
const attackRange = document.getElementById('attack');
const releaseRange = document.getElementById('release');
const minFrequencyRange = document.getElementById('minFrequency');
const maxFrequencyRange = document.getElementById('maxFrequency');
const volumeRange = document.getElementById('volume');
const reverbRange = document.getElementById('reverb');
const imageBrightnessRange = document.getElementById('imageBrightness');
const imageContrastRange = document.getElementById('imageContrast');
const imageOpacityRange = document.getElementById('imageOpacity');

// Cada slider con el texto que muestra su valor, su botón "Aprender CC" y cómo se formatea.
const sliderControls = [
    { range: resolutionRange, valueId: 'resValue', learnId: 'learnResolutionMidi', format: (value) => value },
    { range: rowsRange, valueId: 'rowsValue', learnId: 'learnRowsMidi', format: (value) => value },
    { range: speedRange, valueId: 'speedValue', learnId: 'learnSpeedMidi', format: (value) => value },
    { range: speedYRange, valueId: 'speedYValue', learnId: 'learnSpeedYMidi', format: (value) => value },
    { range: attackRange, valueId: 'attackValue', learnId: 'learnAttackMidi', format: (value) => `${value}s` },
    { range: releaseRange, valueId: 'releaseValue', learnId: 'learnReleaseMidi', format: (value) => `${value}s` },
    { range: minFrequencyRange, valueId: 'minFrequencyValue', learnId: 'learnMinFrequencyMidi', format: (value) => `${value}Hz` },
    { range: maxFrequencyRange, valueId: 'maxFrequencyValue', learnId: 'learnMaxFrequencyMidi', format: (value) => `${value}Hz` },
    { range: volumeRange, valueId: 'volumeValue', learnId: 'learnVolumeMidi', format: (value) => `${Math.round(Number(value) * 100)}%` },
    { range: reverbRange, valueId: 'reverbValue', learnId: 'learnReverbMidi', format: (value) => `${Math.round(Number(value) * 100)}%` },
    { range: imageBrightnessRange, valueId: 'imageBrightnessValue', learnId: 'learnBrightnessMidi', format: (value) => `${value}%` },
    { range: imageContrastRange, valueId: 'imageContrastValue', learnId: 'learnContrastMidi', format: (value) => `${value}%` },
    { range: imageOpacityRange, valueId: 'imageOpacityValue', learnId: 'learnOpacityMidi', format: (value) => `${value}%` }
].map((control) => ({
    ...control,
    valueElement: document.getElementById(control.valueId),
    learnButton: document.getElementById(control.learnId)
}));

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
const cameraSelect = document.getElementById('cameraSelect');
const cameraStatus = document.getElementById('cameraStatus');
const cameraVideo = document.getElementById('cameraVideo');
const cameraProcessingCanvas = document.getElementById('cameraProcessingCanvas');

let mediaObjectUrl = null;
let mediaSource = null;
let mediaLoaded = false;
let currentColumn = 0;
let scanRow = 0;
let scanColumn = 0;
let scanNextXAt = 0;
let scanNextYAt = 0;
let scanTimer = null;
let isPlaying = false;
let synth = null;
let reverbNode = null;
let mediaType = null;
let audioBuffer = null;
let audioPlaybackContext = null;
let audioPlaybackSource = null;
let audioPlaybackNodes = [];
let audioReverbImpulse = null;
let audioPlaybackStartedAt = 0;
let audioPlaybackOffset = 0;
let audioVisualizationFrame = null;
let spectrogramImageData = null;
let spectrogramCanvas = null;
let mediaGenerationId = 0;
let filteredImageCache = null;
let dropSynth = null;
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
    [11, imageOpacityRange],
    [12, rowsRange],
    [13, speedYRange]
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
let lastFreeScanKey = null;
let lastFreeNoteTime = 0;
let freeModeDrawFrame = null;
let freeModeMousePressed = false;
let freeModeHandClosed = false;
const lidCursor = document.getElementById('lidCursor');
document.body.classList.add('custom-cursor');

const handInferenceInterval = 50;
const handLostTimeout = 220;
const clickDebounce = 350;
const gestureHitboxScale = 1.5;
const minColorVolume = 0.15;
const maxNotesPerStep = 16;
const minFreeNoteInterval = 100;
const toneLookAhead = 0.02;
const limiterThreshold = -1;
const synthPolyphony = 128;
const synthDecay = 0.1;
const synthSustain = 0.5;
const reverbDecay = 2;
const reverbPreDelay = 0.01;
const clickSoundVolume = 0.3;
const maxExportSeconds = 5 * 60;
const maxImageWidth = 1200;
const mediaPipeHandsUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240';

// Water drop sound effect using Tone.js (un solo synth reutilizado para no acumular memoria)
function getDropSynth() {
    if (typeof Tone === 'undefined') return null;
    if (!dropSynth) {
        dropSynth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 },
            // Tone.js mide el volumen en decibeles: 20 * log10(0.3) ≈ -10.5 dB, es decir, 30% del volumen.
            volume: 20 * Math.log10(clickSoundVolume)
        }).toDestination();
    }
    return dropSynth;
}

function playWaterDropSound() {
    try {
        getDropSynth()?.triggerAttackRelease('C6', '8n');
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
        script.src = `${mediaPipeHandsUrl}/hands.js`;
        script.async = true;
        script.onload = () => {
            if (typeof Hands === 'undefined') {
                handLoadPromise = null;
                reject(new Error('MediaPipe Hands no está disponible.'));
                return;
            }
            handProcessor = new Hands({
                locateFile: (file) => `${mediaPipeHandsUrl}/${file}`
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
        script.onerror = () => {
            // Se borra la promesa fallida para que el próximo intento vuelva a cargar el script.
            handLoadPromise = null;
            script.remove();
            reject(new Error('No se pudo cargar MediaPipe Hands.'));
        };
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
    handleFreeCursorMove();
});

function getSynthOptions() {
    return {
        oscillator: { type: waveTypeSelect.value },
        envelope: {
            attack: Number(attackRange.value),
            decay: synthDecay,
            sustain: synthSustain,
            release: Number(releaseRange.value)
        }
    };
}

// Crea el synth en vivo: notas → reverb → limitador → salida de Tone.js.
// El limitador evita que se distorsione cuando muchas notas fuertes coinciden.
// No afecta al sonido del clic, que va directo a la salida.
function createToneSynth() {
    const reverb = new Tone.Reverb({ decay: reverbDecay, preDelay: reverbPreDelay, wet: Number(reverbRange.value) });
    const limiter = new Tone.Limiter(limiterThreshold);
    // Ojo: con new Tone.PolySynth(Tone.Synth, {...}) las opciones van a cada voz y maxPolyphony se ignora.
    const toneSynth = new Tone.PolySynth({
        voice: Tone.Synth,
        maxPolyphony: synthPolyphony
    }).connect(reverb);
    reverb.connect(limiter);
    limiter.toDestination();
    toneSynth.set(getSynthOptions());
    return { toneSynth, reverb };
}

function ensureSynth() {
    if (typeof Tone === 'undefined') return null;
    if (!synth) {
        // Tone.js programa los sonidos 100 ms en el futuro por defecto ("lookAhead"). En una app interactiva
        // eso atrasa el sonido respecto de la barra y deja las voces ocupadas más tiempo, así que se reduce.
        Tone.getContext().lookAhead = toneLookAhead;
        ({ toneSynth: synth, reverb: reverbNode } = createToneSynth());
        updateDestinationVolume();
    }
    return synth;
}

function getVolumeDb() {
    const volume = Number(volumeRange.value);
    return volume === 0 ? -Infinity : 20 * Math.log10(volume);
}

function updateDestinationVolume() {
    if (typeof Tone === 'undefined' || !Tone.Destination) return;
    Tone.Destination.volume.value = getVolumeDb();
}

function startAudio() {
    if (typeof Tone !== 'undefined') Tone.start();
    return ensureSynth();
}

// Detiene la fuente y desconecta todos los nodos creados en playAudioBuffer.
function disconnectAudioPlayback() {
    stopAudioVisualization();
    if (audioPlaybackSource) {
        audioPlaybackSource.onended = null;
        audioPlaybackSource.stop();
        audioPlaybackSource = null;
    }
    audioPlaybackNodes.forEach((node) => node.disconnect());
    audioPlaybackNodes = [];
}

function stopAudioPlayback() {
    disconnectAudioPlayback();
    audioPlaybackOffset = 0;
}

// Contraste < 100% baja el volumen; > 100% satura la señal con una curva tanh.
function createContrastCurve(contrast) {
    const curve = new Float32Array(1024);
    const gain = Math.min(1, contrast);
    const drive = Math.max(0, contrast - 1) * 5;
    for (let index = 0; index < curve.length; index += 1) {
        const x = index / (curve.length - 1) * 2 - 1;
        curve[index] = gain * (drive > 0 ? Math.tanh(drive * x) / Math.tanh(drive) : x);
    }
    return curve;
}

async function playAudioBuffer() {
    if (!audioBuffer) return;
    audioPlaybackContext = audioPlaybackContext || new AudioContext();
    await audioPlaybackContext.resume();
    if (!isPlaying) return;
    const offset = audioPlaybackOffset;
    stopAudioPlayback();
    const source = audioPlaybackContext.createBufferSource();
    source.buffer = audioBuffer;
    const output = audioPlaybackContext.createGain();
    const volume = Number(volumeRange.value);
    const brightness = Number(imageBrightnessRange.value) / 100;
    const opacity = Number(imageOpacityRange.value) / 100;
    const contrast = Number(imageContrastRange.value) / 100;
    output.gain.setValueAtTime(0, audioPlaybackContext.currentTime);
    output.gain.linearRampToValueAtTime(
        Math.max(0, volume * brightness * opacity),
        audioPlaybackContext.currentTime + Number(attackRange.value)
    );
    const contrastNode = audioPlaybackContext.createWaveShaper();
    contrastNode.curve = createContrastCurve(contrast);
    contrastNode.connect(output);
    const reverb = createAudioReverb(audioPlaybackContext);
    const wet = audioPlaybackContext.createGain();
    const dry = audioPlaybackContext.createGain();
    wet.gain.value = Number(reverbRange.value);
    dry.gain.value = 1 - Number(reverbRange.value);
    output.connect(dry);
    output.connect(reverb);
    reverb.connect(wet);
    dry.connect(audioPlaybackContext.destination);
    wet.connect(audioPlaybackContext.destination);
    source.connect(contrastNode);
    audioPlaybackOffset = Math.min(offset, Math.max(0, audioBuffer.duration - 0.01));
    source.start(0, audioPlaybackOffset);
    audioPlaybackStartedAt = audioPlaybackContext.currentTime - audioPlaybackOffset;
    audioPlaybackSource = source;
    audioPlaybackNodes = [source, contrastNode, output, reverb, wet, dry];
    const releaseAt = audioPlaybackContext.currentTime + Math.max(0, audioBuffer.duration - audioPlaybackOffset - Number(releaseRange.value));
    output.gain.setValueAtTime(Math.max(0, volume * brightness * opacity), releaseAt);
    output.gain.linearRampToValueAtTime(0, releaseAt + Number(releaseRange.value));
    source.onended = () => {
        if (audioPlaybackSource !== source) return;
        stopAudioPlayback();
        renderSpectrogram();
        isPlaying = false;
        playPauseButton.innerText = 'Play';
        stopButton.disabled = false;
    };
    updateAudioVisualization();
}

function createAudioReverb(context) {
    const convolver = context.createConvolver();
    // El impulso (ruido que decae) se genera una sola vez y se reutiliza en cada Play.
    if (!audioReverbImpulse) {
        const duration = 1.5;
        audioReverbImpulse = context.createBuffer(2, context.sampleRate * duration, context.sampleRate);
        for (let channel = 0; channel < audioReverbImpulse.numberOfChannels; channel += 1) {
            const data = audioReverbImpulse.getChannelData(channel);
            for (let index = 0; index < data.length; index += 1) {
                data[index] = (Math.random() * 2 - 1) * Math.pow(1 - index / data.length, 2);
            }
        }
    }
    convolver.buffer = audioReverbImpulse;
    return convolver;
}

function pauseAudioPlayback() {
    if (!audioPlaybackSource || !audioPlaybackContext) return;
    audioPlaybackOffset = audioPlaybackContext.currentTime - audioPlaybackStartedAt;
    disconnectAudioPlayback();
}

function stopAudioVisualization() {
    if (audioVisualizationFrame) cancelAnimationFrame(audioVisualizationFrame);
    audioVisualizationFrame = null;
}

function drawAudioPlaybackCursor(progress) {
    if (!spectrogramImageData) return;
    renderSpectrogram();

    const axis = getScanAxis();
    const columns = getTotalColumns();
    const rows = getTotalRows();
    const column = Math.min(columns - 1, Math.floor(progress * columns));
    const row = Math.min(rows - 1, Math.floor(progress * rows));
    const columnWidth = canvas.width / columns;
    const rowHeight = canvas.height / rows;

    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    if (axis === 'y') {
        ctx.fillRect(0, row * rowHeight, canvas.width, rowHeight);
        ctx.strokeRect(0, row * rowHeight, canvas.width, rowHeight);
    } else if (axis === 'xy') {
        ctx.fillRect(column * columnWidth, 0, columnWidth, canvas.height);
        ctx.fillRect(0, row * rowHeight, canvas.width, rowHeight);
        ctx.strokeRect(column * columnWidth, 0, columnWidth, canvas.height);
        ctx.strokeRect(0, row * rowHeight, canvas.width, rowHeight);
    } else {
        ctx.fillRect(column * columnWidth, 0, columnWidth, canvas.height);
        ctx.strokeRect(column * columnWidth, 0, columnWidth, canvas.height);
    }
}

function updateAudioVisualization() {
    if (!isPlaying || mediaType !== 'audio' || !audioBuffer || !audioPlaybackContext) return;
    const elapsed = Math.max(0, audioPlaybackContext.currentTime - audioPlaybackStartedAt);
    const progress = Math.min(1, elapsed / Math.max(audioBuffer.duration, 0.001));
    drawAudioPlaybackCursor(progress);
    if (progress < 1 && audioPlaybackSource) {
        audioVisualizationFrame = requestAnimationFrame(updateAudioVisualization);
    } else {
        audioVisualizationFrame = null;
    }
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

    const min = Number(slider.min);
    const max = Number(slider.max);
    slider.value = snapToRange(min + value / 127 * (max - min), slider);
    slider.dispatchEvent(new Event('input', { bubbles: true }));
}

// Ajusta un número al mínimo, máximo y paso del slider, sin errores de decimales (0.15000000000000002).
function snapToRange(value, rangeElement) {
    const min = Number(rangeElement.min);
    const max = Number(rangeElement.max);
    const step = Number(rangeElement.step) || 1;
    const decimals = (String(rangeElement.step).split('.')[1] || '').length;
    const clamped = Math.max(min, Math.min(max, value));
    const stepped = Math.round((clamped - min) / step) * step + min;
    return Math.min(max, stepped).toFixed(decimals);
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
            if (input.value.trim() !== '' && Number.isFinite(entered)) {
                rangeElement.value = snapToRange(entered, rangeElement);
            }
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
    // Si ya había una cámara activa (por ejemplo, al cambiar de cámara), se apaga antes de abrir la nueva.
    if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
    if (cameraAnimationFrame) cancelAnimationFrame(cameraAnimationFrame);
    cameraStream = null;
    cameraAnimationFrame = null;
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
    smoothedGesturePosition = null;
    handWasOpen = false;
    setFreeModeHandClosed(false);
    toggleCameraActiveButton.innerText = 'Iniciar Cámara';
    toggleCameraActiveButton.classList.replace('bg-blue-600', 'bg-emerald-500');
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
    handleFreeCursorMove();
}

function getInteractiveTarget(x, y) {
    const screenX = Math.max(0, Math.min(window.innerWidth - 1, x * window.innerWidth));
    const screenY = Math.max(0, Math.min(window.innerHeight - 1, y * window.innerHeight));
    const interactiveElements = [...document.querySelectorAll(
        'button, [role="button"], a, select, input, label'
    )];
    const candidates = interactiveElements
        .map((element, index) => {
            const bounds = element.getBoundingClientRect();
            const styles = getComputedStyle(element);
            const widthIncrease = bounds.width * (gestureHitboxScale - 1) / 2;
            const heightIncrease = bounds.height * (gestureHitboxScale - 1) / 2;
            return {
                element,
                index,
                visible: element.getClientRects().length > 0 &&
                    styles.display !== 'none' &&
                    styles.visibility !== 'hidden' &&
                    styles.pointerEvents !== 'none' &&
                    !element.matches(':disabled') &&
                    isOnTop(element, bounds),
                priority: Number(element.dataset.mediapipePriority || 0),
                left: bounds.left - widthIncrease,
                right: bounds.right + widthIncrease,
                top: bounds.top - heightIncrease,
                bottom: bounds.bottom + heightIncrease,
                area: bounds.width * bounds.height
            };
        })
        .filter((candidate) => candidate.visible && candidate.area > 0 &&
            screenX >= candidate.left && screenX <= candidate.right &&
            screenY >= candidate.top && screenY <= candidate.bottom)
        .sort((first, second) =>
            second.priority - first.priority || first.area - second.area || first.index - second.index
        );

    return candidates[0]?.element || null;
}

// true si el elemento se ve en pantalla y no está tapado por otro (por ejemplo, por una ventana abierta).
// Se revisa el centro del elemento: lo que el navegador muestre ahí debe ser el elemento o algo dentro de él.
function isOnTop(element, bounds) {
    const topElement = document.elementFromPoint(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    return !!topElement && (element === topElement || element.contains(topElement) || topElement.contains(element));
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
    // Modo libre: sobre la imagen, la mano cerrada equivale a mantener el clic presionado.
    if (isFreeModeActive() && getCursorBlock()) {
        handWasOpen = !position.isClosed;
        setFreeModeHandClosed(position.isClosed);
        return;
    }
    setFreeModeHandClosed(false);
    clickWithClosedHand(smoothedGesturePosition.x, smoothedGesturePosition.y, position.isClosed);
}

function setFreeModeHandClosed(isClosed) {
    if (freeModeHandClosed === isClosed) return;
    freeModeHandClosed = isClosed;
    if (isClosed) playFreeBlock();
    else stopFreeModeNotes();
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
        setFreeModeHandClosed(false);
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
    setMediaStatus(isAudioFile(file) ? 'Audio listo para generar espectrograma.' : 'Imagen cargada con éxito.');
}

// Muestra un mensaje en la línea pequeña de la zona de carga.
function setMediaStatus(message) {
    mediaUploadZone.querySelector('span:nth-child(3)').innerText = message;
}

function getTotalColumns() { return Number(resolutionRange.value); }
function getTotalRows() { return Number(rowsRange.value); }
function getScanSpeed(axis = getScanAxis()) {
    if (axis === 'xy') return Math.min(Number(speedRange.value), Number(speedYRange.value));
    return Number(axis === 'y' ? speedYRange.value : speedRange.value);
}

function getImageFilter() {
    return `brightness(${Number(imageBrightnessRange.value) / 100}) contrast(${Number(imageContrastRange.value) / 100}) opacity(${Number(imageOpacityRange.value) / 100})`;
}

// Guarda la imagen con filtros (sin la barra azul) en un canvas aparte.
// Así el sonido siempre se calcula con los píxeles reales de la imagen y no con el resaltado.
function getFilteredImage() {
    const filter = getImageFilter();
    if (filteredImageCache && filteredImageCache.source === mediaSource && filteredImageCache.filter === filter) {
        return filteredImageCache;
    }
    const scale = Math.min(1, maxImageWidth / mediaSource.naturalWidth);
    const width = Math.round(mediaSource.naturalWidth * scale);
    const height = Math.round(mediaSource.naturalHeight * scale);
    const imageCanvas = document.createElement('canvas');
    imageCanvas.width = width;
    imageCanvas.height = height;
    const imageContext = imageCanvas.getContext('2d');
    imageContext.filter = filter;
    imageContext.drawImage(mediaSource, 0, 0, width, height);
    filteredImageCache = {
        source: mediaSource,
        filter,
        canvas: imageCanvas,
        pixels: imageContext.getImageData(0, 0, width, height)
    };
    return filteredImageCache;
}

function drawMedia(highlightStep = -1, axis = 'x', highlightRow = highlightStep) {
    if (!mediaLoaded || mediaType !== 'image') return;
    const image = getFilteredImage();
    const w = image.canvas.width;
    const h = image.canvas.height;
    const columns = getTotalColumns();
    const rows = getTotalRows();

    if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        fitCanvasToView();
    }
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(image.canvas, 0, 0);

    if (highlightStep < 0) return;
    const columnWidth = w / columns;
    const rowHeight = h / rows;
    const x = Math.min(columns - 1, Math.max(0, highlightStep)) * columnWidth;
    const y = Math.min(rows - 1, Math.max(0, axis === 'y' ? highlightStep : highlightRow)) * rowHeight;
    const highlights = [];
    if (axis !== 'y') highlights.push([x, 0, columnWidth, h]);
    if (axis !== 'x') highlights.push([0, y, w, rowHeight]);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    highlights.forEach((rect) => ctx.fillRect(...rect));
    highlights.forEach((rect) => ctx.strokeRect(...rect));
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

// Copia los píxeles del espectrograma a un canvas auxiliar que se crea una sola vez.
function setSpectrogramImageData(imageData) {
    spectrogramImageData = imageData;
    spectrogramCanvas = spectrogramCanvas || document.createElement('canvas');
    spectrogramCanvas.width = imageData.width;
    spectrogramCanvas.height = imageData.height;
    spectrogramCanvas.getContext('2d').putImageData(imageData, 0, 0);
    renderSpectrogram();
}

function renderSpectrogram() {
    if (!spectrogramImageData) return;
    if (canvas.width !== spectrogramCanvas.width || canvas.height !== spectrogramCanvas.height) {
        canvas.width = spectrogramCanvas.width;
        canvas.height = spectrogramCanvas.height;
        fitCanvasToView();
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.filter = getImageFilter();
    ctx.drawImage(spectrogramCanvas, 0, 0);
    ctx.filter = 'none';
}

// Suma los valores en píxeles de varias propiedades CSS de un elemento.
function sumStyles(element, ...properties) {
    const style = getComputedStyle(element);
    return properties.reduce((total, property) => total + (parseFloat(style[property]) || 0), 0);
}

// Espacio libre para la imagen: la pantalla menos el encabezado, el pie, la columna de botones y los bordes.
function getCanvasArea() {
    const horizontalEdges = ['paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'];
    const verticalEdges = ['paddingTop', 'paddingBottom', 'borderTopWidth', 'borderBottomWidth'];
    const viewMaxWidth = parseFloat(getComputedStyle(scannerAppView).maxWidth) || Infinity;
    let width = Math.min(appMain.clientWidth - sumStyles(appMain, 'paddingLeft', 'paddingRight'), viewMaxWidth)
        - sumStyles(scannerAppView, ...horizontalEdges)
        - sumStyles(canvasContainer, ...horizontalEdges);
    let height = window.innerHeight - appHeader.offsetHeight - appFooter.offsetHeight
        - sumStyles(appMain, 'paddingTop', 'paddingBottom')
        - sumStyles(scannerAppView, ...verticalEdges)
        - scannerTitleBar.offsetHeight - sumStyles(scannerTitleBar, 'marginBottom')
        - sumStyles(canvasContainer, ...verticalEdges);
    const stacked = getComputedStyle(scannerWorkspace).gridTemplateColumns.split(' ').length === 1;
    if (stacked) {
        // En celulares los botones van arriba y la página puede bajar: la imagen usa a lo más 60% de la pantalla.
        height = window.innerHeight * 0.6;
    } else {
        width -= scannerControls.offsetWidth + sumStyles(scannerWorkspace, 'columnGap');
    }
    return { width: Math.max(width, 120), height: Math.max(height, 120) };
}

// Agranda o achica la imagen en pantalla para que ocupe todo el espacio disponible sin deformarse,
// y la ventana se encoge alrededor de ella para no dejar espacios vacíos.
// Solo cambia el tamaño visible: los píxeles que se usan para el sonido siguen siendo los mismos.
function fitCanvasToView() {
    canvasContainer.classList.toggle('has-media', mediaLoaded);
    scannerAppView.classList.toggle('has-media', mediaLoaded);
    if (!mediaLoaded) {
        canvas.style.width = '';
        canvas.style.height = '';
        return;
    }
    // Se calcula dos veces porque al angostarse la ventana el título puede pasar a dos líneas y quitar alto.
    for (let pass = 0; pass < 2; pass += 1) {
        const area = getCanvasArea();
        const scale = Math.min(area.width / canvas.width, area.height / canvas.height);
        canvas.style.width = `${Math.floor(canvas.width * scale)}px`;
        canvas.style.height = `${Math.floor(canvas.height * scale)}px`;
    }
}

function updateMediaControls() {
    downloadButton.disabled = !mediaLoaded || downloadInProgress;
    downloadButton.innerText = mediaType === 'image' ? 'Descargar MP3' : 'Descargar PNG';
    downloadButton.classList.toggle('bg-blue-500', mediaType !== 'image');
    downloadButton.classList.toggle('hover:bg-blue-600', mediaType !== 'image');
    downloadButton.classList.toggle('bg-purple-500', mediaType === 'image');
    downloadButton.classList.toggle('hover:bg-purple-600', mediaType === 'image');
    convertButton.disabled = !mediaLoaded || downloadInProgress;
    convertButton.innerText = mediaType === 'image' ? 'Convertir a audio' : 'Convertir a imagen';
    // Con un archivo cargado, el recuadro negro se ajusta al tamaño de la imagen.
    fitCanvasToView();
    updateFreeModeToggle();
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

// Graba el escaneo completo con Web Audio nativo (OfflineAudioContext), recreando el synth que suena en vivo:
// misma onda, envolvente, reverb y volumen. Es mucho más rápido que Tone.Offline y no tiene límite de voces,
// así que no se pierde ninguna nota.
async function renderImageAudioBuffer() {
    if (typeof OfflineAudioContext === 'undefined') throw new Error('Este navegador no soporta OfflineAudioContext.');
    const events = getScanEvents();
    const lastEvent = events[events.length - 1];
    const scanDuration = lastEvent ? lastEvent.time + lastEvent.duration : 0;
    if (scanDuration > maxExportSeconds) {
        throw new Error(
            `El audio duraría ${(scanDuration / 60).toFixed(1)} min y el máximo es ${maxExportSeconds / 60} min. ` +
            'Usa menos columnas/filas o una velocidad más rápida (menos ms).'
        );
    }
    const steps = events.map((event) => ({ ...event, notes: getScanNotes(event.column, event.row) }));
    const sampleRate = 44100;
    const release = Number(releaseRange.value);
    const wet = Number(reverbRange.value);
    const tail = release + (wet > 0 ? reverbDecay : 0);
    const context = new OfflineAudioContext(1, Math.ceil((scanDuration + tail) * sampleRate), sampleRate);

    // Cadena de salida (igual que en vivo): notas → (seco + reverb) → limitador → volumen → destino.
    const master = context.createGain();
    master.gain.value = Number(volumeRange.value);
    master.connect(context.destination);
    // Mismos valores que usa Tone.Limiter por dentro.
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = limiterThreshold;
    limiter.knee.value = 30;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.01;
    limiter.connect(master);
    const synthOutput = context.createGain();
    // Mezcla seco/húmedo "de igual potencia", igual que la usa Tone.Reverb.
    const dry = context.createGain();
    dry.gain.value = Math.cos(wet * Math.PI / 2);
    synthOutput.connect(dry);
    dry.connect(limiter);
    if (wet > 0) {
        const reverb = context.createConvolver();
        reverb.buffer = createToneLikeReverbImpulse(context);
        const wetGain = context.createGain();
        wetGain.gain.value = Math.sin(wet * Math.PI / 2);
        synthOutput.connect(reverb);
        reverb.connect(wetGain);
        wetGain.connect(limiter);
    }

    // Las notas se crean por tramos de 1 segundo, justo antes de que suenen. Si se crearan todas al inicio,
    // el navegador tendría que procesar miles de nodos durante todo el render y sería muy lento.
    const scheduleWindow = (windowStart) => {
        steps
            .filter((step) => step.time >= windowStart && step.time < windowStart + 1)
            .forEach((step) => step.notes.forEach((note) => {
                scheduleNativeNote(context, synthOutput, note, step.time, step.duration * 0.9);
            }));
    };
    scheduleWindow(0);
    for (let windowStart = 1; windowStart < scanDuration; windowStart += 1) {
        // Se pausa 10 ms antes porque el navegador redondea el momento de la pausa hacia adelante.
        context.suspend(windowStart - 0.01).then(() => {
            scheduleWindow(windowStart);
            context.resume();
        });
    }
    const buffer = await context.startRendering();
    normalizeIfClipping(buffer.getChannelData(0));
    return buffer;
}

// Tone.js usa curvas exponenciales en el decay y el release; esta es su fórmula para la "constante de tiempo".
function getToneTimeConstant(rampTime) {
    return Math.log(rampTime + 1) / Math.log(200);
}

// Una nota igual a la de Tone.Synth: ataque lineal hasta la velocity, decay exponencial hasta el sustain
// y release exponencial hasta el silencio.
function scheduleNativeNote(context, output, note, start, duration) {
    const attack = Number(attackRange.value);
    const release = Number(releaseRange.value);
    const peak = note.velocity;
    const sustain = peak * synthSustain;
    const decayStart = start + attack;
    const releaseStart = start + duration;
    const decayTimeConstant = getToneTimeConstant(synthDecay);

    const oscillator = context.createOscillator();
    oscillator.type = waveTypeSelect.value;
    oscillator.frequency.value = note.frequency;
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, start);

    if (releaseStart <= decayStart) {
        // La nota se suelta antes de terminar el ataque: sube solo hasta donde alcanzó.
        envelope.gain.linearRampToValueAtTime(peak * (duration / attack), releaseStart);
    } else {
        envelope.gain.linearRampToValueAtTime(peak, decayStart);
        envelope.gain.setTargetAtTime(sustain, decayStart, decayTimeConstant);
        // Valor exacto del decay al momento de soltar, para que el release parta sin saltos.
        const levelAtRelease = sustain + (peak - sustain) * Math.exp(-(releaseStart - decayStart) / decayTimeConstant);
        envelope.gain.setValueAtTime(levelAtRelease, releaseStart);
    }
    envelope.gain.setTargetAtTime(0, releaseStart, getToneTimeConstant(release));

    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.start(start);
    oscillator.stop(releaseStart + release + 0.05);
}

// Impulso de reverb como el de Tone.Reverb: ruido estéreo que se apaga de forma exponencial en `reverbDecay` segundos.
function createToneLikeReverbImpulse(context) {
    const length = Math.ceil((reverbPreDelay + reverbDecay) * context.sampleRate);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    const timeConstant = getToneTimeConstant(reverbDecay);
    const preDelaySamples = Math.floor(reverbPreDelay * context.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
        const data = impulse.getChannelData(channel);
        for (let index = preDelaySamples; index < length; index += 1) {
            const time = (index - preDelaySamples) / context.sampleRate;
            data[index] = (Math.random() * 2 - 1) * Math.exp(-time / timeConstant);
        }
    }
    return impulse;
}

// Si alguna muestra supera 1 (notas que se superponen en el release o la reverb), baja todo el audio
// lo justo para que no se distorsione al guardarlo.
function normalizeIfClipping(samples) {
    let peak = 0;
    for (let i = 0; i < samples.length; i += 1) peak = Math.max(peak, Math.abs(samples[i]));
    if (peak <= 1) return;
    for (let i = 0; i < samples.length; i += 1) samples[i] /= peak;
}

function getScanEvents() {
    const axis = getScanAxis();
    const events = [];
    let column = 0;
    let row = 0;
    let time = 0;
    const speedX = Number(speedRange.value) / 1000;
    const speedY = Number(speedYRange.value) / 1000;

    if (axis === 'x' || axis === 'y') {
        const count = axis === 'x' ? getTotalColumns() : getTotalRows();
        const duration = axis === 'x' ? speedX : speedY;
        for (let step = 0; step < count; step += 1) {
            events.push({
                column: axis === 'x' ? step : 0,
                row: axis === 'y' ? step : 0,
                time,
                duration
            });
            time += duration;
        }
        return events;
    }

    let nextXAt = 0;
    let nextYAt = 0;
    while (column < getTotalColumns() || row < getTotalRows()) {
        const nextTime = Math.min(
            column < getTotalColumns() ? nextXAt : Infinity,
            row < getTotalRows() ? nextYAt : Infinity
        );
        time = nextTime;
        if (column < getTotalColumns() && nextXAt === nextTime) {
            column += 1;
            nextXAt += speedX;
        }
        if (row < getTotalRows() && nextYAt === nextTime) {
            row += 1;
            nextYAt += speedY;
        }
        events.push({
            column: Math.min(getTotalColumns() - 1, Math.max(0, column - 1)),
            row: Math.min(getTotalRows() - 1, Math.max(0, row - 1)),
            time,
            duration: 0
        });
    }
    for (let index = 0; index < events.length; index += 1) {
        events[index].duration = (events[index + 1]?.time ?? time + Math.max(speedX, speedY)) - events[index].time;
    }
    return events;
}

async function downloadImageAsMp3() {
    if (mediaType !== 'image' || downloadInProgress) return;
    if (typeof lamejs === 'undefined') {
        setMediaStatus('El codificador MP3 no está disponible.');
        return;
    }

    downloadInProgress = true;
    updateMediaControls();
    try {
        setMediaStatus('Generando MP3...');
        const renderedBuffer = await renderImageAudioBuffer();
        const samples = renderedBuffer.getChannelData(0);
        const encoder = new lamejs.Mp3Encoder(1, renderedBuffer.sampleRate, 128);
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
        setMediaStatus('MP3 descargado.');
    } catch (error) {
        setMediaStatus(error.message);
        console.error('Error al exportar MP3:', error);
    } finally {
        downloadInProgress = false;
        updateMediaControls();
    }
}

// generationId identifica la carga actual: si el usuario eligió otro archivo mientras tanto, se descarta el resultado.
async function generarEspectrogramaOffline(file, generationId) {
    if (typeof OfflineAudioContext === 'undefined') {
        throw new Error('Este navegador no soporta OfflineAudioContext.');
    }
    const arrayBuffer = await file.arrayBuffer();
    const decoder = new OfflineAudioContext(1, 1, 44100);
    const decoded = await decoder.decodeAudioData(arrayBuffer);
    if (generationId !== mediaGenerationId) return;

    const fftSize = 2048;
    const sourceData = new Float32Array(decoded.length);
    for (let channel = 0; channel < decoded.numberOfChannels; channel += 1) {
        const channelData = decoded.getChannelData(channel);
        for (let i = 0; i < sourceData.length; i += 1) sourceData[i] += channelData[i] / decoded.numberOfChannels;
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
            const bin = Math.round(frequency * fftSize / decoded.sampleRate);
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

    if (generationId !== mediaGenerationId) return;
    audioBuffer = decoded;
    setSpectrogramImageData(imageData);
    mediaLoaded = true;
    mediaType = 'audio';
    playPauseButton.disabled = false;
    stopButton.disabled = false;
    updateMediaControls();
}

function getActiveCursorPosition() {
    return cameraModeActive && smoothedGesturePosition ? smoothedGesturePosition : nativeCursorPosition;
}

// Devuelve el inicio y el final (en píxeles) del bloque número `index` al dividir `size` en `count` partes.
function getBlockBounds(index, count, size) {
    const blockSize = size / count;
    const start = Math.min(size - 1, Math.floor(index * blockSize));
    return [start, Math.max(start + 1, Math.floor((index + 1) * blockSize))];
}

// Color promedio de un rectángulo, canal por canal (cada uno de 0 a 1).
// R, G y B se promedian por separado entre los píxeles del bloque; nunca se mezclan entre sí.
function getBlockColor(pixels, startX, endX, startY, endY) {
    let red = 0;
    let green = 0;
    let blue = 0;
    for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
            const pixelIndex = (y * pixels.width + x) * 4;
            red += pixels.data[pixelIndex];
            green += pixels.data[pixelIndex + 1];
            blue += pixels.data[pixelIndex + 2];
        }
    }
    const total = (endX - startX) * (endY - startY) * 255;
    return { red: red / total, green: green / total, blue: blue / total };
}

// Matiz: 0 = rojo, 1/6 = amarillo, 1/3 = verde, 1/2 = cian, 2/3 = azul, 5/6 = violeta.
// Intensidad del color: 0 = gris, negro o blanco; 1 = color puro (máximo − mínimo de los canales).
function getHueAndColorfulness({ red, green, blue }) {
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const colorfulness = max - min;
    if (colorfulness === 0) return { hue: 0, colorfulness };
    let hue;
    if (max === red) hue = ((green - blue) / colorfulness + 6) % 6;
    else if (max === green) hue = (blue - red) / colorfulness + 2;
    else hue = (red - green) / colorfulness + 4;
    return { hue: hue / 6, colorfulness };
}

// Nota de un bloque: la posición da la frecuencia base, el matiz la sube hasta una octava
// (rojo = base, violeta = casi una octava arriba) y la intensidad del color define el volumen
// (los grises suenan suave y los colores vivos, fuerte).
function getBlockNote(pixels, startX, endX, startY, endY, position) {
    const { hue, colorfulness } = getHueAndColorfulness(getBlockColor(pixels, startX, endX, startY, endY));
    return {
        frequency: getScaleFrequency(position) * Math.pow(2, hue),
        volume: minColorVolume + (1 - minColorVolume) * colorfulness
    };
}

// position 0 = frecuencia máxima, position 1 = frecuencia mínima (escala logarítmica).
function getScaleFrequency(position) {
    const minFrequency = Number(minFrequencyRange.value);
    const maxFrequency = Math.max(minFrequency, Number(maxFrequencyRange.value));
    return maxFrequency * Math.pow(minFrequency / maxFrequency, position);
}

// Notas de una columna: cada fila suena; arriba = agudo, abajo = grave.
function getColumnNotes(column) {
    const { pixels } = getFilteredImage();
    const rows = getTotalRows();
    const [startX, endX] = getBlockBounds(column, getTotalColumns(), pixels.width);
    const notes = [];
    for (let row = 0; row < rows; row += 1) {
        const [startY, endY] = getBlockBounds(row, rows, pixels.height);
        notes.push(getBlockNote(pixels, startX, endX, startY, endY, row / Math.max(1, rows - 1)));
    }
    return notes;
}

// Notas de una fila: cada columna suena; izquierda = agudo, derecha = grave.
function getRowNotes(row) {
    const { pixels } = getFilteredImage();
    const columns = getTotalColumns();
    const [startY, endY] = getBlockBounds(row, getTotalRows(), pixels.height);
    const notes = [];
    for (let column = 0; column < columns; column += 1) {
        const [startX, endX] = getBlockBounds(column, columns, pixels.width);
        notes.push(getBlockNote(pixels, startX, endX, startY, endY, column / Math.max(1, columns - 1)));
    }
    return notes;
}

async function generateSpectrogramFromSamples(samples, sampleRate) {
    const width = 1024;
    const height = 576;
    const fftSize = 2048;
    const imageData = ctx.createImageData(width, height);
    const minDb = -80;
    const maxDb = -10;
    const { minFrequency, maxFrequency } = getVisualFrequencyRange();
    for (let x = 0; x < width; x += 1) {
        const center = Math.floor((x / Math.max(1, width - 1)) * Math.max(0, samples.length - 1));
        const windowedSamples = new Float32Array(fftSize);
        for (let i = 0; i < fftSize; i += 1) {
            const index = center - Math.floor(fftSize / 2) + i;
            if (index >= 0 && index < samples.length) {
                windowedSamples[i] = samples[index] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (fftSize - 1)));
            }
        }
        const magnitudes = performFft(windowedSamples);
        for (let y = 0; y < height; y += 1) {
            const frequency = maxFrequency * Math.pow(minFrequency / maxFrequency, y / Math.max(1, height - 1));
            const bin = Math.max(0, Math.min(magnitudes.length - 1,
                Math.round(frequency * fftSize / sampleRate)));
            const db = 20 * Math.log10(Math.max(magnitudes[bin], 1e-8));
            const color = getPaletteColor((db - minDb) / (maxDb - minDb));
            const offset = (y * width + x) * 4;
            imageData.data[offset] = color[0];
            imageData.data[offset + 1] = color[1];
            imageData.data[offset + 2] = color[2];
            imageData.data[offset + 3] = 255;
        }
        if (x % 16 === 0) {
            setSpectrogramImageData(imageData);
            await new Promise((resolve) => requestAnimationFrame(resolve));
        }
    }
    setSpectrogramImageData(imageData);
}

function getScanAxis() {
    return scanAxis.value;
}

function getScanStepCount() {
    if (getScanAxis() === 'y') return getTotalRows();
    return getTotalColumns();
}

// Notas que suenan en un paso: como máximo `maxNotesPerStep`, eligiendo los bloques de color más intenso.
// Cada nota trae su frecuencia y su velocity (0 a 1). La velocity se divide por la raíz de la cantidad
// de notas: así varias notas juntas suenan fuertes, y el limitador se encarga de que no se distorsione.
function getScanNotes(step, rowStep = step) {
    const axis = getScanAxis();
    let notes;
    if (axis === 'x') notes = getColumnNotes(step);
    else if (axis === 'y') notes = getRowNotes(step);
    else {
        notes = [
            ...getColumnNotes(Math.min(getTotalColumns() - 1, step)),
            ...getRowNotes(Math.min(getTotalRows() - 1, rowStep))
        ];
    }
    const strongest = notes
        .sort((first, second) => second.volume - first.volume)
        .slice(0, maxNotesPerStep);
    return strongest.map((note) => ({
        frequency: note.frequency,
        velocity: note.volume / Math.sqrt(strongest.length)
    }));
}

// Toca todas las notas de un paso a la vez; cada una con su propio volumen.
function triggerNotes(toneSynth, notes, durationSeconds, time) {
    notes.forEach((note) => toneSynth.triggerAttackRelease(note.frequency, durationSeconds, time, note.velocity));
}

function playScanStep(notes, durationMs) {
    const s = startAudio();
    if (s && notes.length) triggerNotes(s, notes, durationMs / 1000 * 0.9, Tone.now());
}

function scanNextColumn() {
    if (!isPlaying || !mediaLoaded) return;
    const axis = getScanAxis();
    if (axis === 'xy') {
        scanNextXYStep();
        return;
    }
    if (currentColumn >= getScanStepCount()) {
        stopScanning();
        return;
    }
    // En el eje X currentColumn es la columna; en el eje Y es la fila.
    playScanStep(getScanNotes(currentColumn), getScanSpeed(axis));
    drawMedia(currentColumn, axis);
    currentColumn += 1;
    scanTimer = setTimeout(scanNextColumn, getScanSpeed(axis));
}

// Eje X + Y: columnas y filas avanzan cada una a su propia velocidad.
// scanColumn y scanRow parten en -1, así el primer avance las deja en 0.
function scanNextXYStep() {
    const now = performance.now();
    const columnsLeft = scanColumn < getTotalColumns() - 1;
    const rowsLeft = scanRow < getTotalRows() - 1;
    if (!columnsLeft && !rowsLeft) {
        stopScanning();
        return;
    }
    const advanceX = columnsLeft && now >= scanNextXAt;
    const advanceY = rowsLeft && now >= scanNextYAt;
    if (advanceX) {
        scanColumn += 1;
        scanNextXAt = now + Number(speedRange.value);
    }
    if (advanceY) {
        scanRow += 1;
        scanNextYAt = now + Number(speedYRange.value);
    }
    if (advanceX || advanceY) {
        playScanStep(getScanNotes(scanColumn, scanRow), getScanSpeed('xy'));
        drawMedia(scanColumn, 'xy', scanRow);
    }
    // Se espera solo al eje que todavía tiene pasos pendientes.
    const waitX = scanColumn < getTotalColumns() - 1 ? scanNextXAt - now : Infinity;
    const waitY = scanRow < getTotalRows() - 1 ? scanNextYAt - now : Infinity;
    const wait = Math.min(waitX, waitY);
    const lastStepWait = Math.max(Number(speedRange.value), Number(speedYRange.value));
    scanTimer = setTimeout(scanNextColumn, Number.isFinite(wait) ? Math.max(1, wait) : lastStepWait);
}

function isFreeModeActive() {
    return isPlaying && mediaLoaded && mediaType === 'image' && freeModeToggle.checked;
}

// Bloque de la imagen que está bajo el cursor (mouse o mano), o null si el cursor está fuera de la imagen
// o si hay algo encima de ella en ese punto (por ejemplo, la ventana de MediaPipe o la de ajustes).
function getCursorBlock() {
    const bounds = canvas.getBoundingClientRect();
    const pos = getActiveCursorPosition();
    const screenX = pos.x * window.innerWidth;
    const screenY = pos.y * window.innerHeight;
    const x = (screenX - bounds.left) / bounds.width;
    const y = (screenY - bounds.top) / bounds.height;
    if (!bounds.width || !bounds.height || x < 0 || x >= 1 || y < 0 || y >= 1) return null;
    if (document.elementFromPoint(screenX, screenY) !== canvas) return null;
    return {
        column: Math.floor(x * getTotalColumns()),
        row: Math.floor(y * getTotalRows())
    };
}

// Identifica el bloque según el eje: en el eje X solo importa la columna y en el eje Y solo la fila.
// Así, mover el cursor dentro de la misma columna (eje X) no vuelve a disparar la nota.
function getFreeBlockKey(block) {
    if (!block) return null;
    const axis = getScanAxis();
    if (axis === 'x') return `x:${block.column}`;
    if (axis === 'y') return `y:${block.row}`;
    return `xy:${block.column}:${block.row}`;
}

// Dibuja la barra en el bloque bajo el cursor, como máximo una vez por cuadro de pantalla
// (dibujar más seguido no se alcanza a ver y solo gasta trabajo).
function requestFreeModeDraw() {
    if (freeModeDrawFrame) return;
    freeModeDrawFrame = requestAnimationFrame(() => {
        freeModeDrawFrame = null;
        if (!isFreeModeActive()) return;
        const axis = getScanAxis();
        const block = getCursorBlock();
        if (block) drawMedia(axis === 'y' ? block.row : block.column, axis, block.row);
        else drawMedia();
    });
}

// En modo libre solo suena mientras se mantiene el clic (o la mano cerrada) sobre la imagen.
function isFreeModePressed() {
    return freeModeMousePressed || freeModeHandClosed;
}

// Al soltar el clic (o abrir la mano) se cancela el pulso y la nota pendiente: queda en silencio.
function stopFreeModeNotes() {
    if (isFreeModePressed()) return;
    clearTimeout(scanTimer);
    scanTimer = null;
}

// Dibuja la barra en el bloque bajo el cursor (aunque no se esté haciendo clic) y, si se mantiene
// el clic, toca ese bloque y se vuelve a programar para repetir la nota como un pulso.
// Fuera de la imagen hay silencio y no se dibuja la barra.
// Para no saturar el audio al mover el mouse muy rápido, las notas se tocan como máximo cada
// `minFreeNoteInterval` ms; si el cursor cruza varios bloques en ese tiempo, suena el último.
function playFreeBlock() {
    clearTimeout(scanTimer);
    scanTimer = null;
    if (!isFreeModeActive()) return;
    const axis = getScanAxis();
    const block = getCursorBlock();
    lastFreeScanKey = getFreeBlockKey(block);
    requestFreeModeDraw();
    if (!block || !isFreeModePressed()) return;

    const wait = lastFreeNoteTime + minFreeNoteInterval - performance.now();
    if (wait > 0) {
        scanTimer = setTimeout(playFreeBlock, wait);
        return;
    }
    lastFreeNoteTime = performance.now();
    const step = axis === 'y' ? block.row : block.column;
    playScanStep(getScanNotes(step, block.row), getScanSpeed(axis));
    scanTimer = setTimeout(playFreeBlock, Math.max(minFreeNoteInterval, getScanSpeed(axis)));
}

// Se llama cada vez que el cursor se mueve: si entró a otro bloque, suena sin esperar el pulso.
function handleFreeCursorMove() {
    if (!isFreeModeActive()) return;
    if (getFreeBlockKey(getCursorBlock()) !== lastFreeScanKey) playFreeBlock();
}

// El modo libre solo tiene sentido con imágenes: con un audio cargado la casilla queda deshabilitada.
function updateFreeModeToggle() {
    const disabled = mediaType === 'audio';
    freeModeToggle.disabled = disabled;
    freeModeToggle.closest('label').classList.toggle('opacity-50', disabled);
    // En pantallas táctiles, arrastrar el dedo sobre la imagen mueve la barra en vez de desplazar la página.
    canvas.classList.toggle('free-mode-canvas', freeModeToggle.checked && !disabled);
}

// El modo libre no necesita Play: si está marcado y hay una imagen, la barra empieza a seguir al cursor.
function startFreeModeIfEnabled() {
    if (freeModeToggle.checked && mediaLoaded && mediaType === 'image' && !isPlaying) startScanning();
}

function startScanning() {
    if (!mediaLoaded || isPlaying) return;
    if (mediaType === 'audio') {
        isPlaying = true;
        playPauseButton.innerText = 'Pause';
        stopButton.disabled = false;
        playAudioBuffer();
        return;
    }
    startAudio();
    isPlaying = true;
    playPauseButton.innerText = 'Pause';
    stopButton.disabled = false;
    lastFreeScanKey = null;
    currentColumn = 0;
    scanColumn = -1;
    scanRow = -1;
    const now = performance.now();
    scanNextXAt = now;
    scanNextYAt = now;
    if (freeModeToggle.checked) playFreeBlock();
    else scanNextColumn();
}

function pauseScanning() {
    if (mediaType === 'audio') pauseAudioPlayback();
    isPlaying = false;
    clearTimeout(scanTimer);
    scanTimer = null;
    playPauseButton.innerText = 'Play';
}

function stopScanning() {
    pauseScanning();
    if (mediaType === 'audio') audioPlaybackOffset = 0;
    currentColumn = 0;
    lastFreeScanKey = null;
    stopButton.disabled = !mediaLoaded;
    if (mediaLoaded && mediaType === 'image') drawMedia();
    if (mediaLoaded && mediaType === 'audio') renderSpectrogram();
}

async function convertMedia() {
    if (!mediaLoaded || downloadInProgress) return;
    stopScanning();
    downloadInProgress = true;
    // Mientras se convierte no se puede reproducir, para no mezclar la imagen con el audio a medio generar.
    playPauseButton.disabled = true;
    stopButton.disabled = true;
    updateMediaControls();
    try {
        if (mediaType === 'image') {
            setMediaStatus('Convirtiendo imagen a audio...');
            const renderedBuffer = await renderImageAudioBuffer();
            audioBuffer = renderedBuffer;
            mediaSource = null;
            mediaType = 'audio';
            await generateSpectrogramFromSamples(renderedBuffer.getChannelData(0), renderedBuffer.sampleRate);
            setMediaStatus('Imagen convertida a audio.');
        } else {
            const image = new Image();
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = () => reject(new Error('No se pudo crear la imagen del espectrograma.'));
                image.src = canvas.toDataURL('image/png');
            });
            mediaSource = image;
            mediaType = 'image';
            spectrogramImageData = null;
            drawMedia();
            setMediaStatus('Audio convertido a imagen.');
        }
        currentColumn = 0;
    } catch (error) {
        setMediaStatus(error.message);
        console.error('Error al convertir:', error);
    } finally {
        downloadInProgress = false;
        playPauseButton.disabled = false;
        stopButton.disabled = false;
        updateMediaControls();
        startFreeModeIfEnabled();
    }
}

async function handleMediaSelection(event) {
    const file = event.target.files[0];
    if (!file) return;
    // Cada archivo nuevo recibe un número; las cargas anteriores que terminen tarde se ignoran.
    const generationId = ++mediaGenerationId;
    if (mediaObjectUrl) URL.revokeObjectURL(mediaObjectUrl);
    mediaObjectUrl = URL.createObjectURL(file);
    updateUploadLabel(file);
    stopScanning();
    mediaLoaded = false;
    mediaType = null;
    audioBuffer = null;
    audioPlaybackOffset = 0;
    spectrogramImageData = null;
    // Los botones se activan cuando el archivo termina de cargarse.
    playPauseButton.disabled = true;
    stopButton.disabled = true;
    updateMediaControls();

    if (isAudioFile(file)) {
        try {
            await generarEspectrogramaOffline(file, generationId);
        } catch (error) {
            if (generationId !== mediaGenerationId) return;
            setMediaStatus('No se pudo leer el audio.');
            console.error('Error al generar el espectrograma:', error);
        }
        return;
    }

    if (!file.type.startsWith('image/')) {
        setMediaStatus('Formato no compatible.');
        return;
    }

    const img = new Image();
    img.onerror = () => {
        if (generationId === mediaGenerationId) setMediaStatus('No se pudo leer la imagen.');
    };
    img.onload = () => {
        if (generationId !== mediaGenerationId) return;
        mediaSource = img;
        mediaLoaded = true;
        mediaType = 'image';
        drawMedia();
        playPauseButton.disabled = false;
        stopButton.disabled = false;
        updateMediaControls();
        startFreeModeIfEnabled();
    };
    img.src = mediaObjectUrl;
}

function updateSettings() {
    sliderControls.forEach(({ range, valueElement, format }) => {
        valueElement.innerText = format(range.value);
    });

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
downloadButton.addEventListener('click', () => {
    if (mediaType === 'image') downloadImageAsMp3();
    else downloadCanvasAsPng();
});
convertButton.addEventListener('click', convertMedia);
// El modo libre no necesita Play: al marcarlo la barra sigue al cursor y al desmarcarlo se detiene.
freeModeToggle.addEventListener('change', () => {
    stopScanning();
    updateFreeModeToggle();
    startFreeModeIfEnabled();
});

// Modo libre: suena mientras se mantiene el clic (o el dedo, en pantallas táctiles) sobre la imagen.
canvas.addEventListener('pointerdown', (event) => {
    if (!isFreeModeActive() || event.button !== 0) return;
    event.preventDefault();
    nativeCursorPosition = {
        x: event.clientX / window.innerWidth,
        y: event.clientY / window.innerHeight
    };
    freeModeMousePressed = true;
    playFreeBlock();
});
const releaseFreeModeMouse = () => {
    if (!freeModeMousePressed) return;
    freeModeMousePressed = false;
    stopFreeModeNotes();
};
window.addEventListener('pointerup', releaseFreeModeMouse);
window.addEventListener('pointercancel', releaseFreeModeMouse);
window.addEventListener('blur', releaseFreeModeMouse);
window.addEventListener('resize', fitCanvasToView);

sliderControls.forEach(({ range, valueElement, learnButton }) => {
    range.addEventListener('input', updateSettings);
    makeValueEditable(valueElement, range);
    learnButton.addEventListener('click', () => startMidiLearn(range, learnButton));
});
waveTypeSelect.addEventListener('change', updateSettings);
scanAxis.addEventListener('change', () => {
    const wasPlaying = isPlaying;
    stopScanning();
    if (wasPlaying) startScanning();
});
midiToggleButton.addEventListener('click', toggleMidi);
midiInputSelect.addEventListener('change', connectMidiInput);
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
cameraSelect.addEventListener('change', () => { if (cameraModeActive) startCamera(); });

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && cameraModeActive) {
        event.preventDefault();
        stopCamera();
    }
});

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
    // Se limita la posición para que la barra de arrastre nunca quede fuera de la pantalla.
    const visibleMargin = 80;
    const minLeft = visibleMargin - settingsWindow.offsetWidth;
    const maxLeft = window.innerWidth - visibleMargin;
    const maxTop = window.innerHeight - settingsHeader.offsetHeight;
    const left = Math.max(minLeft, Math.min(maxLeft, event.clientX - settingsDragState.offsetX));
    const top = Math.max(0, Math.min(maxTop, event.clientY - settingsDragState.offsetY));
    settingsWindow.style.left = `${left}px`;
    settingsWindow.style.top = `${top}px`;
});
const endSettingsDrag = () => { settingsDragState = null; };
settingsHeader.addEventListener('pointerup', endSettingsDrag);
settingsHeader.addEventListener('pointercancel', endSettingsDrag);

function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    clockDisplay.innerText = `${hours}:${minutes}`;
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    dateDisplay.innerText = `${days[now.getDay()]} ${now.getDate()}/${now.getMonth() + 1}`;
}

updateSettings();
setInterval(updateClock, 1000);
updateClock();
