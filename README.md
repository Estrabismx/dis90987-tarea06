# dis90987-tarea06

Integrantes:
- Isidora Alvarez
- Camila Ramirez

# Traductor de Bits (Escáner Sónico de Imágenes)

**1. Concepto y relación imagen–sonido**  

Nuestro proyecto consiste en el diseño de una página web que permite al usuario subir cualquier fotografía para traducirla en audio en tiempo real. La plataforma escanea los píxeles de la imagen cargada y, según su brillo, color y distribución, genera sonidos utilizando distintos tipos de ondas o "sabores" de audio. El objetivo principal es que el espectador pueda escuchar la luz y las sombras de la foto elegida, las zonas más oscuras generan frecuencias graves, mientras que las áreas más iluminadas se traducen en notas agudas, permitiendo percibir la textura visual a través del sentido auditivo. A nivel visual y conceptual, el diseño adopta la estética de la consola Nintendo Wii, haciendo referencia directa al uso de controles inalámbricos a distancia mediante la integración de la tecnología MediaPipe, que permite interactuar y mover el cursor escáner en el espacio utilizando los movimientos de la mano sin necesidad de tocar el mouse.

**2. Banco de sonidos y disparador**  

El disparador visual se activa al cargar un archivo de imagen en la página web. El sistema divide la imagen horizontalmente en columnas y un cursor las recorre de lado a lado. Mediante el modo libre o el seguimiento de gestos con MediaPipe, el usuario puede desplazar el cursor sobre la imagen usando la mano frente a la cámara web.
En cuanto al banco de sonidos, utilizamos síntesis basada en formas de onda y efectos generados en tiempo real por código:
* **Onda Senoidal:** Sintetizador web de tono suave y fluido.
* **Onda Triangular:** Sintetizador web con un sonido equilibrado y armónico.
* **Onda Cuadrada:** Sintetizador web de estilo retro 8-bit.
* **Onda Diente de Sierra:** Sintetizador web de carácter más agresivo y brillante.

**3. Parámetros y gráfica**  

La página web permite modificar diversos parámetros sonoros que tienen un sentido técnico y conceptual dentro de la herramienta, se puede ajustar la cantidad de columnas, para definir la velocidad rítmica del escaneo, la velocidad de lectura, el ataque y release para suavizar o cortar las notas, y un filtro pasa-bajos junto con reverb (eco) para aportar profundidad espacial. Además, la plataforma incorpora un **sistema de control MIDI** completo que permite conectar cualquier controlador físico externo. Mediante los botones de "Asignar MIDI" en el panel de ajustes, el usuario puede vincular los controles físicos directamente a los parámetros del sintetizador y del escáner para manipular el sonido en tiempo real de forma táctil.

La página web permite cambiar varios ajustes del sonido según lo que necesites: puedes modificar la cantidad de columnas para cambiar el ritmo del escaneo, ajustar la velocidad de lectura, suavizar o cortar el inicio y el final de las notas, y agregar un efecto de eco para darle más profundidad al sonido. Además, la plataforma cuenta con un sistema para conectar cualquier control físico externo (como perillas o deslizadores). Usando los botones de "Asignar MIDI" en el panel de ajustes, puedes conectar tus controles físicos directamente a los parámetros de la página para modificar el sonido en tiempo real con las manos.

A nivel gráfico, la interfaz adopta una tipografía limpia (Inter), una paleta de colores basada en blancos, grises y azul eléctrico que nos da toda la vibra de los menús de la consola Nintendo Wii (reforzando la idea de control interactivo e inalámbrico), y un canvas central que muestra una barra azul de resaltado indicando exactamente qué parte de la imagen está sonando en tiempo real.


| Inicio | MIDI | MediaPipe |
|---|---|---|
| ![Inicio](./imagenes/inicio.png) | ![MIDI](./imagenes/MIDI.png) | ![MediaPipe](./imagenes/Mediapipe.png) |


**4. Reflexión**  

El mundo digital posee diferentes categorias que ayudan a comprender y estructurar la complejidad de su propio mundo, en estas puede ocurrir que el mismo elemento tenga diferentes interpretaciones ocurriendo a la vez, es decir que si tenemos una fotografía, esta puede ser `.jpeg`, `.png`, `.webp` e incluso `.pdf`. Entonces nos preguntamos _¿Que es realmente una foto?_

Es información y no solo con las imagenes, tambien con cualquier elemento existente en este _mundo digital_ y esto ocurre gracias a que todo está construido a partir del "_bit_", la mínima expresión de información. Es decir, que un video, un modelo 3D, un archivo Illustrator e incluso un archivo de audio `.mp3`

A partir de esto nos preguntamos _¿Es posible realizar una traducción de un formato a otro?_ Más específicamente, convertir los _`bit`_ de una imagen en sonido y viceversa.

Al finalizar esta exploración y ver como funciona, solo nos queda cuestionarnos _¿Cual es el límite para aplicar este concepto?_

## **Video de la Web en funcionamieto**

| Video del proyecto |
|---|
| [![Ver video en YouTube](https://img.youtube.com/vi/DgT-glhhPsQ/hqdefault.jpg)](https://youtube.com/shorts/DgT-glhhPsQ?feature=share) |
