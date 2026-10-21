const lidMenuView = document.getElementById('lidMenuView');
const scannerAppView = document.getElementById('scannerAppView');
const appTitleHeader = document.getElementById('appTitleHeader');
const scannerChannelButton = document.getElementById('scannerChannelButton');
const headerMenuButton = document.getElementById('headerMenuButton');
const footerHomeButton = document.getElementById('footerHomeButton');
const closeScannerButton = document.getElementById('closeScannerButton');
const playPauseButton = document.getElementById('playPauseButton');
const stopButton = document.getElementById('stopButton');

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

let mediaObjectUrl = null;
let mediaSource = null;
let mediaLoaded = false;
let currentColumn = 0;
let scanTimer = null;
let isPlaying = false;
let synth = null;
let filterNode = null;
let reverbNode = null;

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
    appTitleHeader.innerText = 'Canal Traductor de bits';
}

function returnToLidHome() {
    stopScanning();
    scannerAppView.classList.add('hidden');
    lidMenuView.classList.remove('hidden');
    appTitleHeader.innerText = 'Traductor de bits';
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

function startScanning() {
    if (!mediaLoaded || isPlaying) return;

    startAudio();
    isPlaying = true;
    playPauseButton.innerText = 'Pause';
    stopButton.disabled = false;
    scanNextColumn();
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
footerHomeButton.addEventListener('click', returnToLidHome);
closeScannerButton.addEventListener('click', returnToLidHome);
playPauseButton.addEventListener('click', () => (isPlaying ? pauseScanning() : startScanning()));
stopButton.addEventListener('click', stopScanning);
imageInput.addEventListener('change', handleMediaSelection);

speedRange.addEventListener('input', updateSettings);
resolutionRange.addEventListener('input', updateSettings);
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
