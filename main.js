// Referencias del DOM
const imageInput = document.getElementById('imageInput');
const resolutionSlider = document.getElementById('resolution');
const resValue = document.getElementById('resValue');
const speedSlider = document.getElementById('speed');
const speedValue = document.getElementById('speedValue');
const waveType = document.getElementById('waveType');

const attackSlider = document.getElementById('attack');
const attackValue = document.getElementById('attackValue');
const releaseSlider = document.getElementById('release');
const releaseValue = document.getElementById('releaseValue');
const filterSlider = document.getElementById('filter');
const filterValue = document.getElementById('filterValue');
const reverbSlider = document.getElementById('reverb');
const reverbValue = document.getElementById('reverbValue');

const btnPlay = document.getElementById('btnPlay');
const btnPause = document.getElementById('btnPause');
const btnStop = document.getElementById('btnStop');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

const statusText = document.getElementById('statusText');
const pixelInfo = document.getElementById('pixelInfo');
const hexCode = document.getElementById('hexCode');
const hzValue = document.getElementById('hzValue');

// Estado de la aplicación
let imgData = null;       // Guardará la imagen original
let isPlaying = false;
let isPaused = false;
let playIndex = 0;        // Índice de la columna actual
let playTimeout = null;
let synth = null;
let filterNode = null;
let reverbNode = null;

// Limites de frecuencias para la escala logarítmica (A2 a A6 aprox)
const minFreq = 110;
const maxFreq = 1760;

// Inicializar o actualizar Sintetizador
function initSynth() {
    if (!synth) {
        // 1. Crear nodos de efectos
        filterNode = new Tone.Filter(parseInt(filterSlider.value), "lowpass");
        reverbNode = new Tone.Freeverb({ roomSize: 0.8, dampening: 3000 });
        reverbNode.wet.value = parseFloat(reverbSlider.value); // Nivel inicial de reverb

        // 2. Crear sintetizador con envolvente conectada a los controles
        synth = new Tone.Synth({
            envelope: {
                attack: parseFloat(attackSlider.value),
                decay: 0.1,
                sustain: 0.5,
                release: parseFloat(releaseSlider.value)
            }
        });

        // 3. Conectar en cadena: Sintetizador -> Filtro -> Reverb -> Salida Maestro
        synth.chain(filterNode, reverbNode, Tone.Destination);
        Tone.Destination.volume.value = -8; // Bajar el master para evitar saturación con efectos
    }
    synth.oscillator.type = waveType.value;
}

// Eventos de controles UI
resolutionSlider.addEventListener('input', (e) => {
    resValue.innerText = e.target.value;
    if (imgData && !isPlaying) drawImage(); // Redibujar imagen limpia
});

speedSlider.addEventListener('input', (e) => speedValue.innerText = e.target.value);

waveType.addEventListener('change', () => {
    if (synth) synth.oscillator.type = waveType.value;
});

attackSlider.addEventListener('input', (e) => {
    attackValue.innerText = e.target.value + 's';
    if(synth) synth.envelope.attack = parseFloat(e.target.value);
});

releaseSlider.addEventListener('input', (e) => {
    releaseValue.innerText = e.target.value + 's';
    if(synth) synth.envelope.release = parseFloat(e.target.value);
});

filterSlider.addEventListener('input', (e) => {
    filterValue.innerText = e.target.value + 'Hz';
    if(filterNode) filterNode.frequency.value = parseInt(e.target.value);
});

reverbSlider.addEventListener('input', (e) => {
    reverbValue.innerText = Math.round(e.target.value * 100) + '%';
    if(reverbNode) reverbNode.wet.value = parseFloat(e.target.value);
});

// Cargar Imagen sin deformar
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            imgData = img;
            drawImage();
            statusText.innerText = "Imagen cargada. Lista para escanear.";
            statusText.className = "text-green-400 font-medium";
            resetPlayback();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Dibuja la imagen manteniendo su proporción
function drawImage() {
    if (!imgData) return;

    // Definimos un ancho máximo para el canvas
    const maxCanvasWidth = 800;
    const ratio = imgData.height / imgData.width;

    canvas.width = maxCanvasWidth;
    canvas.height = maxCanvasWidth * ratio;

    // Dibujar la imagen completa y limpia
    ctx.drawImage(imgData, 0, 0, canvas.width, canvas.height);
}

// Utilidades matemáticas y de color
function rgbToHex(r, g, b) {
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
}

function getFrequencyLog(brightness) {
    // F = Fmin * (Fmax/Fmin)^(brillo/255)
    const freq = minFreq * Math.pow((maxFreq / minFreq), (brightness / 255));
    return freq;
}

function playNextColumn() {
    if (!isPlaying || isPaused) return;

    const columns = parseInt(resolutionSlider.value);

    // Si llegamos al final de las columnas
    if (playIndex >= columns) {
        resetPlayback();
        statusText.innerText = "¡Escaneo completado!";
        statusText.className = "text-purple-400 font-medium";
        return;
    }

    // Redibujar la imagen para limpiar el cursor de la columna anterior
    drawImage();

    // Calcular las dimensiones de la columna actual
    const colWidth = canvas.width / columns;
    const startX = Math.floor(playIndex * colWidth);
    const w = Math.max(1, Math.ceil(colWidth)); // Mínimo 1 pixel de ancho
    const h = canvas.height;

    // Extraer los datos de TODOS los píxeles en esta columna (Eje Y completo)
    const frameData = ctx.getImageData(startX, 0, w, h).data;

    let sumR = 0, sumG = 0, sumB = 0;
    const pixelCount = frameData.length / 4;

    // Sumar los valores RGB
    for(let i = 0; i < frameData.length; i += 4) {
        sumR += frameData[i];
        sumG += frameData[i+1];
        sumB += frameData[i+2];
    }

    // Promediar los colores
    const avgR = Math.round(sumR / pixelCount);
    const avgG = Math.round(sumG / pixelCount);
    const avgB = Math.round(sumB / pixelCount);

    // Convertir a valores audibles y visuales
    const hex = rgbToHex(avgR, avgG, avgB);
    const brightness = (avgR + avgG + avgB) / 3;
    const freq = getFrequencyLog(brightness);

    // Tocar el sintetizador
    initSynth();
    // La duración de la nota depende de la velocidad elegida
    const dur = (parseInt(speedSlider.value) / 1000) * 0.8;
    synth.triggerAttackRelease(freq, dur);

    // Actualizar Interfaz (UI)
    pixelInfo.classList.remove('hidden');
    statusText.innerText = `Escaneando columna ${playIndex + 1} de ${columns}...`;
    statusText.className = "text-green-400 font-medium";

    hexCode.innerText = hex;
    hexCode.style.color = hex;
    hzValue.innerText = `${Math.round(freq)} Hz`;

    // Dibujar el cursor (barra vertical semi-transparente)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; // Relleno blanco transparente
    ctx.fillRect(startX, 0, w, h);

    ctx.strokeStyle = hex; // Borde del color promedio encontrado
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, 0, w, h);

    // Avanzar y agendar la siguiente columna
    playIndex++;
    playTimeout = setTimeout(playNextColumn, parseInt(speedSlider.value));
}

btnPlay.addEventListener('click', async () => {
    if (!imgData) return;

    await Tone.start(); // Requerido por los navegadores para reproducir audio

    if (playIndex >= parseInt(resolutionSlider.value)) {
        playIndex = 0; // Reiniciar si había terminado
    }

    isPlaying = true;
    isPaused = false;

    btnPlay.disabled = true;
    btnPause.disabled = false;
    btnStop.disabled = false;

    playNextColumn();
});

btnPause.addEventListener('click', () => {
    if (!isPlaying) return;

    isPaused = true;
    isPlaying = false;
    clearTimeout(playTimeout);

    if (synth) synth.triggerRelease();

    btnPlay.disabled = false;
    btnPause.disabled = true;

    statusText.innerText = "Escaneo pausado.";
    statusText.className = "text-yellow-400 font-medium";
});

btnStop.addEventListener('click', resetPlayback);

function resetPlayback() {
    isPlaying = false;
    isPaused = false;
    playIndex = 0;
    clearTimeout(playTimeout);

    if (synth) synth.triggerRelease();

    btnPlay.disabled = !imgData; // Habilitar solo si hay imagen
    btnPause.disabled = true;
    btnStop.disabled = true;

    if(imgData) {
        drawImage(); // Limpiar el cursor del canvas
        statusText.innerText = "Listo para escanear.";
        statusText.className = "text-gray-400 font-medium";
    }

    pixelInfo.classList.add('hidden');
}
