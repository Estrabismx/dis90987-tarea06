// ==========================================
// TRADUCTOR DE BITS - SCRIPT PRINCIPAL (LID)
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Reloj en tiempo real en la barra superior
    const clockDisplay = document.getElementById("clockDisplay");
    const dateDisplay = document.getElementById("dateDisplay");

    function updateClock() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        if (clockDisplay) clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;

        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        if (dateDisplay) dateDisplay.textContent = now.toLocaleDateString('es-ES', options);
    }
    setInterval(updateClock, 1000);
    updateClock();

    // 2. Elementos del DOM y Controles de la Interfaz
    const imageInput = document.getElementById("imageInput");
    const mediaUploadZone = document.getElementById("mediaUploadZone");
    const mediaFileName = document.querySelector(".media-file-name");
    const playPauseButton = document.getElementById("playPauseButton");
    const stopButton = document.getElementById("stopButton");
    const downloadButton = document.getElementById("downloadButton");
    const convertButton = document.getElementById("convertButton");
    const freeModeToggle = document.getElementById("freeModeToggle");
    const canvas = document.getElementById("canvas");
    const ctx = canvas ? canvas.getContext("2d") : null;
    const scannerAppView = document.getElementById("scannerAppView");
    const canvasContainer = document.getElementById("canvasContainer");

    // Modales (Información y Ajustes)
    const infoButton = document.getElementById("infoButton");
    const infoModal = document.getElementById("infoModal");
    const closeInfoButton = document.getElementById("closeInfoButton");
    const infoConfirmButton = document.getElementById("infoConfirmButton");

    const settingsButton = document.getElementById("settingsButton");
    const settingsModal = document.getElementById("settingsModal");
    const closeSettingsButton = document.getElementById("closeSettingsButton");
    const settingsConfirmButton = document.getElementById("settingsConfirmButton");
    const soundSettingsTab = document.getElementById("soundSettingsTab");
    const visualSettingsTab = document.getElementById("visualSettingsTab");
    const soundSettingsPanel = document.getElementById("soundSettingsPanel");
    const visualSettingsPanel = document.getElementById("visualSettingsPanel");

    // Sliders de Configuración
    const resolutionSlider = document.getElementById("resolution");
    const resValue = document.getElementById("resValue");
    const speedSlider = document.getElementById("speed");
    const speedValue = document.getElementById("speedValue");
    const imageBrightnessSlider = document.getElementById("imageBrightness");
    const imageBrightnessValue = document.getElementById("imageBrightnessValue");

    // Estado del Reproductor y Sintetizador
    let isPlaying = false;
    let currentColumn = 0;
    let scanInterval = null;
    let loadedImage = null;
    let synth = null;
    let audioContextStarted = false;

    // Inicializar Sintetizador de Tone.js
    function initSynth() {
        if (!synth) {
            synth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.5 }
            }).toDestination();
        }
    }

    // Manejador de Modales
    function toggleModal(modal, show) {
        if (!modal) return;
        if (show) {
            modal.classList.remove("hidden");
        } else {
            modal.classList.add("hidden");
        }
    }

    if (infoButton) infoButton.addEventListener("click", () => toggleModal(infoModal, true));
    if (closeInfoButton) closeInfoButton.addEventListener("click", () => toggleModal(infoModal, false));
    if (infoConfirmButton) infoConfirmButton.addEventListener("click", () => toggleModal(infoModal, false));

    if (settingsButton) settingsButton.addEventListener("click", () => toggleModal(settingsModal, true));
    if (closeSettingsButton) closeSettingsButton.addEventListener("click", () => toggleModal(settingsModal, false));
    if (settingsConfirmButton) settingsConfirmButton.addEventListener("click", () => toggleModal(settingsModal, false));

    // Pestañas del Modal de Ajustes
    if (soundSettingsTab && visualSettingsTab) {
        soundSettingsTab.addEventListener("click", () => {
            soundSettingsTab.classList.add("border-blue-500", "text-blue-600");
            soundSettingsTab.classList.remove("border-transparent", "text-gray-500");
            visualSettingsTab.classList.add("border-transparent", "text-gray-500");
            visualSettingsTab.classList.remove("border-blue-500", "text-blue-600");
            soundSettingsPanel.classList.remove("hidden");
            visualSettingsPanel.classList.add("hidden");
        });

        visualSettingsTab.addEventListener("click", () => {
            visualSettingsTab.classList.add("border-blue-500", "text-blue-600");
            visualSettingsTab.classList.remove("border-transparent", "text-gray-500");
            soundSettingsTab.classList.add("border-transparent", "text-gray-500");
            soundSettingsTab.classList.remove("border-blue-500", "text-blue-600");
            visualSettingsPanel.classList.remove("hidden");
            soundSettingsPanel.classList.add("hidden");
        });
    }

    // Actualización de valores en los Sliders
    if (resolutionSlider && resValue) {
        resolutionSlider.addEventListener("input", (e) => {
            resValue.textContent = e.target.value;
        });
    }

    if (speedSlider && speedValue) {
        speedSlider.addEventListener("input", (e) => {
            speedValue.textContent = e.target.value;
        });
    }

    if (imageBrightnessSlider && imageBrightnessValue) {
        imageBrightnessSlider.addEventListener("input", (e) => {
            imageBrightnessValue.textContent = e.target.value + "%";
            if (loadedImage && ctx) drawImageToCanvas();
        });
    }

    // Carga y Procesamiento de Imágenes o Audio
    if (imageInput) {
        imageInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (mediaFileName) mediaFileName.textContent = file.name;
            const reader = new FileReader();

            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    loadedImage = img;
                    setupCanvasDimensions();
                    drawImageToCanvas();
                    
                    // Desbloquear botones de reproducción y descarga al cargar archivo
                    if (playPauseButton) playPauseButton.removeAttribute("disabled");
                    if (stopButton) stopButton.removeAttribute("disabled");
                    if (downloadButton) downloadButton.removeAttribute("disabled");
                    if (convertButton) convertButton.removeAttribute("disabled");

                    if (scannerAppView) scannerAppView.classList.add("has-media");
                    if (canvasContainer) canvasContainer.classList.add("has-media");
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function setupCanvasDimensions() {
        if (!loadedImage || !canvas) return;
        const maxWidth = 600;
        const maxHeight = 400;
        let width = loadedImage.width;
        let height = loadedImage.height;

        if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;
    }

    function drawImageToCanvas(highlightCol = -1) {
        if (!loadedImage || !ctx || !canvas) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const brightness = imageBrightnessSlider ? imageBrightnessSlider.value : 100;
        ctx.filter = `brightness(${brightness}%)`;
        ctx.drawImage(loadedImage, 0, 0, canvas.width, canvas.height);
        ctx.filter = 'none';

        if (highlightCol >= 0 && highlightCol < canvas.width) {
            ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
            ctx.fillRect(highlightCol, 0, 2, canvas.height);
        }
    }

    // Control de Reproducción (Play / Stop)
    if (playPauseButton) {
        playPauseButton.addEventListener("click", async () => {
            if (!audioContextStarted) {
                await Tone.start();
                audioContextStarted = true;
            }
            initSynth();

            if (!isPlaying) {
                startScanning();
            } else {
                pauseScanning();
            }
        });
    }

    if (stopButton) {
        stopButton.addEventListener("click", () => {
            stopScanning();
        });
    }

    if (downloadButton) {
        downloadButton.addEventListener("click", () => {
            if (!loadedImage) return;
            alert("Preparando descarga de audio...");
        });
    }

    if (convertButton) {
        convertButton.addEventListener("click", () => {
            if (!loadedImage) return;
            alert("Convirtiendo formato...");
        });
    }

    function startScanning() {
        if (!loadedImage || !canvas) return;
        isPlaying = true;
        const spanText = playPauseButton.querySelector("span:not(.btn-bg)");
        if (spanText) spanText.textContent = "Pausa";

        const speed = speedSlider ? parseInt(speedSlider.value) : 150;
        const cols = resolutionSlider ? parseInt(resolutionSlider.value) : 32;
        const step = canvas.width / cols;

        scanInterval = setInterval(() => {
            if (currentColumn >= canvas.width) {
                currentColumn = 0;
            }

            try {
                const imgData = ctx.getImageData(Math.floor(currentColumn), 0, 1, canvas.height);
                let totalBrightness = 0;
                for (let i = 0; i < imgData.data.length; i += 4) {
                    const r = imgData.data[i];
                    const g = imgData.data[i+1];
                    const b = imgData.data[i+2];
                    totalBrightness += (r + g + b) / 3;
                }
                const avgBrightness = totalBrightness / (imgData.data.length / 4);
                
                const freq = 150 + (avgBrightness / 255) * 1050;
                if (synth) {
                    synth.triggerAttackRelease(freq, "8n");
                }
            } catch (err) {
                console.error("Error al procesar píxeles:", err);
            }

            drawImageToCanvas(currentColumn);
            currentColumn += step;
        }, speed);
    }

    function pauseScanning() {
        isPlaying = false;
        const spanText = playPauseButton.querySelector("span:not(.btn-bg)");
        if (spanText) spanText.textContent = "Play";
        clearInterval(scanInterval);
    }

    function stopScanning() {
        pauseScanning();
        currentColumn = 0;
        drawImageToCanvas();
    }

    // Modo Libre (Interacción con el mouse sobre el canvas)
    let isMouseDown = false;
    if (canvas) {
        canvas.addEventListener("mousedown", async (e) => {
            if (!freeModeToggle || !freeModeToggle.checked) return;
            if (!audioContextStarted) {
                await Tone.start();
                audioContextStarted = true;
            }
            initSynth();
            isMouseDown = true;
            processMouseInteraction(e);
        });

        window.addEventListener("mouseup", () => {
            isMouseDown = false;
        });

        canvas.addEventListener("mousemove", (e) => {
            if (!freeModeToggle || !freeModeToggle.checked || !isMouseDown) return;
            processMouseInteraction(e);
        });
    }

    function processMouseInteraction(e) {
        if (!canvas || !loadedImage) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const scaleX = canvas.width / rect.width;
        const canvasX = Math.floor(x * scaleX);

        if (canvasX >= 0 && canvasX < canvas.width) {
            drawImageToCanvas(canvasX);
            try {
                const imgData = ctx.getImageData(canvasX, 0, 1, canvas.height);
                let totalBrightness = 0;
                for (let i = 0; i < imgData.data.length; i += 4) {
                    totalBrightness += (imgData.data[i] + imgData.data[i+1] + imgData.data[i+2]) / 3;
                }
                const avgBrightness = totalBrightness / (imgData.data.length / 4);
                const freq = 150 + (avgBrightness / 255) * 1050;
                if (synth) {
                    synth.triggerAttackRelease(freq, "8n");
                }
            } catch (err) {
                console.error("Error en modo libre:", err);
            }
        }
    }
});
