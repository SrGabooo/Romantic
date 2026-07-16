document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica de Bienvenida ---
    const welcomeScreen = document.getElementById('welcome-screen');
    const enterBtn = document.getElementById('enter-btn');
    
    enterBtn.addEventListener('click', () => {
        welcomeScreen.classList.add('hidden');
    });

    const universe = document.getElementById('universe');
    const playerContainer = document.getElementById('player-container');
    const trackNameEl = document.getElementById('track-name');

    // Referencias HTML
    const canvasContainer = document.getElementById('canvas-container');
    const floatingUi = document.getElementById('floating-ui');
    const vinylDisc = document.getElementById('vinyl-disc');
    const volumeSlider = document.getElementById('volume-slider');
    const audioPlayer = document.getElementById('audio-player');

    // Configuración Three.js
    const scene = new THREE.Scene();
    
    // Cámara
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 300, 600); // Vista isométrica inicial
    
    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    canvasContainer.appendChild(renderer.domElement);

    // Controles de Órbita (Rotar, Zoom, Paneo)
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 2000;
    controls.minDistance = 100;

    // --- Luces ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); // Luz tenue general
    scene.add(ambientLight);
    
    const sunLight = new THREE.PointLight(0xffffff, 1.5, 2000); // Luz que emana del sol
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    // --- Generación del Fondo (Estrellas / Polvo Cósmico) ---
    function createBackground() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const starPos = new Float32Array(starCount * 3);
        for(let i=0; i < starCount * 3; i++) {
            starPos[i] = (Math.random() - 0.5) * 3000;
        }
        starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
        const starMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, transparent: true, opacity: 0.8 });
        const stars = new THREE.Points(starGeo, starMat);
        scene.add(stars);
    }
    createBackground();

    // --- Generación de Corazones Flotantes (Estética Romántica) ---
    function createHeartTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255, 0, 50, 1)';
        ctx.fillStyle = '#ff0044'; // Rojo intenso/neón
        
        ctx.beginPath();
        // Dibujo de corazón con curvas Bezier adaptado a 128x128
        ctx.moveTo(64, 40);
        ctx.bezierCurveTo(64, 30, 50, 10, 30, 10);
        ctx.bezierCurveTo(0, 10, 0, 50, 0, 50);
        ctx.bezierCurveTo(0, 75, 40, 100, 64, 120);
        ctx.bezierCurveTo(88, 100, 128, 75, 128, 50);
        ctx.bezierCurveTo(128, 10, 128, 10, 98, 10);
        ctx.bezierCurveTo(78, 10, 64, 30, 64, 40);
        
        ctx.fill();
        ctx.fill(); // Doble relleno para color más sólido y glow pronunciado
        
        return new THREE.CanvasTexture(canvas);
    }

    let heartsSystem;
    function createHearts() {
        const heartCount = 150; // Menos corazones flotantes
        const heartGeo = new THREE.BufferGeometry();
        const heartPos = new Float32Array(heartCount * 3);
        
        for(let i=0; i < heartCount * 3; i++) {
            heartPos[i] = (Math.random() - 0.5) * 2000; // Esparcidos en un volumen de 2000x2000x2000
        }
        heartGeo.setAttribute('position', new THREE.BufferAttribute(heartPos, 3));
        
        const heartMat = new THREE.PointsMaterial({
            size: 20, // Tamaño de los corazones
            map: createHeartTexture(),
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending, // Brillo aditivo para la estética espacial
            depthWrite: false
        });
        
        heartsSystem = new THREE.Points(heartGeo, heartMat);
        scene.add(heartsSystem);
    }
    createHearts();

    // Helper: Crear textura de gradiente radial para simular brillo y no color sólido
    function createGlowTexture(colorHex) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, '#ffffff'); // Centro blanco brillante
        
        // Convertir Hex a RGB
        const r = (colorHex >> 16) & 255;
        const g = (colorHex >> 8) & 255;
        const b = colorHex & 255;
        
        gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 1)`); // Color base
        gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`); // Borde transparente
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    // --- El Sol ---
    const sunRadius = 60; // Radio interactivo del sol para el clic
    const sunGeo = new THREE.SphereGeometry(sunRadius, 16, 16);
    const sunInteractMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
    const sun = new THREE.Mesh(sunGeo, sunInteractMat);
    sun.userData = { isSun: true }; // Identificador para el clic

    const sunTexture = createGlowTexture(0xff8c00);
    const sunMat = new THREE.SpriteMaterial({ map: sunTexture, color: 0xffffff, blending: THREE.AdditiveBlending, transparent: true });
    const sunSprite = new THREE.Sprite(sunMat);
    sunSprite.scale.set(200, 200, 1);
    sun.add(sunSprite);
    
    scene.add(sun);

    // --- Planetas Musicales ---
    const starColors = [
        0x00f3ff, 0xff00c8, 0xa200ff, 0x00ff88, 
        0xffaa00, 0xff0055, 0x5500ff, 0x00ffcc,
        0xffea00, 0xff5e00, 0xbfff00, 0xff0084
    ];
    
    const MIN_RADIUS = 120;
    const RADIUS_STEP = 20; // Órbitas menos alejadas
    
    // Lista para mantener referencia de los planetas clickeables
    const planets = [];

    if (typeof songs !== 'undefined') {
        songs.forEach((songPath, index) => {
            const radius = MIN_RADIUS + (index * RADIUS_STEP);
            const colorHex = starColors[index % starColors.length];
            
            // 1. Crear el Aro de Órbita
            const orbitGeo = new THREE.RingGeometry(radius, radius + 0.5, 64);
            const orbitMat = new THREE.MeshBasicMaterial({ 
                color: 0xffffff, 
                transparent: true, 
                opacity: 0.15,
                side: THREE.DoubleSide 
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2; // Acostar el aro
            scene.add(orbit);

            // 2. Crear el Planeta (Mesh esférico sólido para asegurar que el Raycaster lo detecte siempre)
            const planetRadius = 12 + Math.random() * 6; // Estrellas un poco más pequeñas
            const planetGeo = new THREE.SphereGeometry(planetRadius, 16, 16);
            // Material casi invisible, solo usado para detectar el clic con precisión matemática
            const planetMat = new THREE.MeshBasicMaterial({ 
                color: colorHex,
                transparent: true,
                opacity: 0.0, 
                depthWrite: false
            });
            const planet = new THREE.Mesh(planetGeo, planetMat);
            
            // El Sprite brillante visual como hijo del planeta
            const pTexture = createGlowTexture(colorHex);
            const spriteMat = new THREE.SpriteMaterial({ 
                map: pTexture, 
                color: 0xffffff,
                blending: THREE.AdditiveBlending,
                transparent: true
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(planetRadius * 3, planetRadius * 3, 1);
            planet.add(sprite); // Añadir sprite visual al mesh interactivo
            
            // Ángulo inicial y velocidad de órbita (MUY LENTA)
            const initialAngle = Math.random() * Math.PI * 2;
            const orbitSpeed = (0.0002 + Math.random() * 0.0004) * (Math.random() > 0.5 ? 1 : -1);
            
            planet.position.x = Math.cos(initialAngle) * radius;
            planet.position.z = Math.sin(initialAngle) * radius;
            
            // 3. Guardar info de la canción, estado y datos orbitales
            planet.userData = {
                songUrl: songPath,
                color: '#' + colorHex.toString(16).padStart(6, '0'),
                baseScale: 1, // La escala base del Mesh es 1
                angle: initialAngle,
                radius: radius,
                speed: orbitSpeed
            };
            
            scene.add(planet);
            planets.push(planet);
        });
    }

    // --- Interacción con Clic (Raycaster) ---
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let currentActivePlanet = null;

    let mouseDownPos = {x:0, y:0};

    // Cambiar cursor a mano en hover
    window.addEventListener('mousemove', (event) => {
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const interactables = [...planets, sun]; // Checar planetas y sol
        const intersects = raycaster.intersectObjects(interactables, false);
        
        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    });

    // Detectar clics de forma robusta sobre el canvas
    renderer.domElement.addEventListener('pointerdown', (event) => {
        mouseDownPos.x = event.clientX;
        mouseDownPos.y = event.clientY;
    });

    let sunMessageTimeout = null;

    renderer.domElement.addEventListener('pointerup', (event) => {
        // Ignorar si el usuario soltó sobre la UI de volumen
        if (event.target.closest('#floating-ui')) return;
        
        // Si movió el mouse más de 10 píxeles, fue un arrastre de cámara, ignorar.
        const dragDist = Math.hypot(event.clientX - mouseDownPos.x, event.clientY - mouseDownPos.y);
        if (dragDist > 10) return;

        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // Detectar colisión con las esferas invisibles (planetas y sol)
        const interactables = [...planets, sun];
        const intersects = raycaster.intersectObjects(interactables, false);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            
            if (clickedObject.userData.isSun) {
                // Mostrar mensaje romántico del sol
                const sunMsg = document.getElementById('sun-message');
                sunMsg.classList.remove('hidden');
                
                // Limpiar timeout anterior si existe
                if (sunMessageTimeout) clearTimeout(sunMessageTimeout);
                
                // Ocultar después de 4 segundos
                sunMessageTimeout = setTimeout(() => {
                    sunMsg.classList.add('hidden');
                }, 4000);
            } else {
                handlePlanetClick(clickedObject);
            }
        }
    });

    function handlePlanetClick(planet) {
        // Si tocamos el que ya está activo, pausar o reproducir
        if (currentActivePlanet === planet) {
            if (audioPlayer.paused) {
                audioPlayer.play().catch(e => console.error("Error reproduciendo:", e));
                vinylDisc.classList.add('spinning');
            } else {
                audioPlayer.pause();
                vinylDisc.classList.remove('spinning');
            }
            return;
        }

        // Resetear planeta anterior
        if (currentActivePlanet) {
            currentActivePlanet.scale.set(1, 1, 1);
        }

        // Activar nuevo planeta
        currentActivePlanet = planet;
        planet.scale.set(1.5, 1.5, 1.5); // Hacer el Mesh completo más grande
        
        // Reproducir Audio (encodeURI previene errores de rutas con espacios o tildes en 'Música')
        audioPlayer.src = encodeURI(planet.userData.songUrl);
        audioPlayer.load(); 
        
        let playPromise = audioPlayer.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error("Error al reproducir audio:", error);
            });
        }
        
        // Mostrar y configurar UI
        floatingUi.classList.remove('hidden');
        vinylDisc.style.setProperty('--vinyl-color', planet.userData.color);
        vinylDisc.classList.add('spinning');
    }

    // Control de volumen
    volumeSlider.addEventListener('input', (e) => {
        audioPlayer.volume = e.target.value;
    });

    // Cuando termina la canción
    audioPlayer.addEventListener('ended', () => {
        if (currentActivePlanet) {
            const bs = currentActivePlanet.userData.baseScale;
            currentActivePlanet.scale.set(bs, bs, 1);
            currentActivePlanet = null;
        }
        floatingUi.classList.add('hidden');
        vinylDisc.classList.remove('spinning');
    });

    // --- Redimensionamiento de ventana ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // --- Ciclo de Renderizado (Animación) ---
    function animate() {
        requestAnimationFrame(animate);

        // Actualizar posiciones de los planetas (Órbita)
        planets.forEach(planet => {
            planet.userData.angle += planet.userData.speed;
            const radius = planet.userData.radius;
            planet.position.x = Math.cos(planet.userData.angle) * radius;
            planet.position.z = Math.sin(planet.userData.angle) * radius;
        });
        
        // Animar corazones flotantes
        if (heartsSystem) {
            const positions = heartsSystem.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) { // El índice de Y
                positions[i] += 0.3; // Flotar hacia arriba suavemente
                if (positions[i] > 1000) {
                    positions[i] = -1000; // Reaparecer abajo
                }
            }
            heartsSystem.geometry.attributes.position.needsUpdate = true;
            heartsSystem.rotation.y += 0.0005; // Rotación muy sutil del cúmulo de corazones
        }
        
        // Actualizar controles de cámara
        controls.update();

        // Actualizar posición de la UI flotante si hay un planeta activo
        if (currentActivePlanet) {
            // Clonamos la posición del planeta
            const vector = currentActivePlanet.position.clone();
            
            // Lo proyectamos a coordenadas de pantalla 2D basadas en la cámara
            vector.project(camera);
            
            // Convertir a píxeles
            const x = (vector.x * .5 + .5) * window.innerWidth;
            const y = (vector.y * -.5 + .5) * window.innerHeight;
            
            // Posicionar la UI justo encima y a la derecha del planeta
            // Ocultar si el planeta se fue detrás de la cámara (z > 1)
            if (vector.z < 1) {
                floatingUi.style.display = 'flex';
                floatingUi.style.left = `${x + 20}px`;
                floatingUi.style.top = `${y - 60}px`;
            } else {
                floatingUi.style.display = 'none';
            }
        }

        renderer.render(scene, camera);
    }

    animate();
});
