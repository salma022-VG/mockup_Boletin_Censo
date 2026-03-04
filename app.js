(function () {
    'use strict';

    /* ---------- CONFIGURACIÓN ---------- */
    const BOGOTA_CENTER = [4.624, -74.064];
    const INITIAL_ZOOM = 11;

    /* ---------- AYUDANTES DE COLOR ---------- */
    const PALETTE = {
        0: { fill: 'rgba(255, 50, 50, 0.28)', stroke: '#ff3c3c', label: 'Urbano' },
        1: { fill: 'rgba(255, 200, 0, 0.25)', stroke: '#ffc800', label: 'Rural' }
    };

    function getStyle(feature) {
        const tipo = feature.properties.scatipo;
        const p = PALETTE[tipo] || PALETTE[0];
        return {
            fillColor: p.fill,
            color: p.stroke,
            weight: 1.6,
            opacity: 0.9,
            fillOpacity: 0.3
        };
    }

    function highlightStyle(feature) {
        const tipo = feature.properties.scatipo;
        const p = PALETTE[tipo] || PALETTE[0];
        return {
            fillColor: p.fill,
            color: '#fff',
            weight: 2.5,
            opacity: 1,
            fillOpacity: 0.55
        };
    }

    /* ================================================
       SISTEMA DE ANIMACIONES DINÁMICAS
       ================================================ */

    /* ---------- SCROLL REVEAL (Intersection Observer) ---------- */
    function initScrollReveal() {
        const revealElements = document.querySelectorAll('.reveal, .reveal-scale');

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target;
                        const delay = parseInt(el.dataset.delay || '0', 10);

                        setTimeout(() => {
                            el.classList.add('revealed');

                            // Si es una stat-card, iniciar el contador
                            const counter = el.querySelector('[data-counter]');
                            if (counter && !counter.dataset.started) {
                                counter.dataset.started = 'true';
                                animateCounter(counter);
                            }
                        }, delay);

                        observer.unobserve(el);
                    }
                });
            },
            {
                threshold: 0.15,
                rootMargin: '0px 0px -50px 0px'
            }
        );

        revealElements.forEach((el) => observer.observe(el));
    }

    /* ---------- CONTADORES ANIMADOS ---------- */
    function animateCounter(el) {
        const target = parseInt(el.dataset.counter, 10);
        const format = el.dataset.format || 'number';
        const prefix = el.dataset.prefix || '';
        const duration = 2000; // ms
        const startTime = performance.now();

        // Easing function (ease-out cubic)
        function easeOutCubic(t) {
            return 1 - Math.pow(1 - t, 3);
        }

        function formatValue(val) {
            if (format === 'currency') {
                // Formato simplificado para grandes cifras
                if (val >= 1e9) {
                    return prefix + (val / 1e9).toFixed(0) + '.000.000.000';
                }
                return prefix + val.toLocaleString('es-CO');
            }
            return val.toLocaleString('es-CO');
        }

        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            const current = Math.floor(easedProgress * target);

            el.textContent = formatValue(current);

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Asegurar el valor final exacto
                el.textContent = formatValue(target);
            }
        }

        requestAnimationFrame(tick);
    }

    /* ---------- PARALLAX SUAVE EN EL HERO ---------- */
    function initParallax() {
        const hero = document.getElementById('hero');
        const heroContent = hero ? hero.querySelector('.hero-content') : null;
        const particles = hero ? hero.querySelectorAll('.hero-particle') : [];

        if (!hero) return;

        let ticking = false;

        window.addEventListener('scroll', function () {
            if (!ticking) {
                requestAnimationFrame(function () {
                    const scrolled = window.pageYOffset;
                    const heroHeight = hero.offsetHeight;

                    if (scrolled < heroHeight * 1.5) {
                        // Parallax en el contenido del hero
                        if (heroContent) {
                            heroContent.style.transform =
                                'translateY(' + scrolled * 0.3 + 'px)';
                            heroContent.style.opacity =
                                1 - scrolled / heroHeight;
                        }

                        // Parallax diferente en cada partícula
                        particles.forEach(function (p, i) {
                            const speed = 0.1 + i * 0.05;
                            p.style.transform =
                                'translateY(' + scrolled * speed + 'px)';
                        });
                    }

                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    /* ---------- EFECTO TILT EN TARJETAS (mousemove) ---------- */
    function initCardTilt() {
        const cards = document.querySelectorAll('.service-card');

        cards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const rotateX = ((y - centerY) / centerY) * -4;
                const rotateY = ((x - centerX) / centerX) * 4;

                card.style.transform =
                    'translateY(-10px) scale(1.03) perspective(800px) rotateX(' +
                    rotateX +
                    'deg) rotateY(' +
                    rotateY +
                    'deg)';
            });

            card.addEventListener('mouseleave', function () {
                card.style.transform = '';
            });
        });
    }

    /* ---------- EFECTO RIPPLE EN BOTONES ---------- */
    function initRippleEffect() {
        const buttons = document.querySelectorAll('.service-btn');

        buttons.forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                // Crear elemento ripple
                var ripple = document.createElement('span');
                var rect = btn.getBoundingClientRect();
                var size = Math.max(rect.width, rect.height);
                var x = e.clientX - rect.left - size / 2;
                var y = e.clientY - rect.top - size / 2;

                ripple.style.cssText =
                    'position:absolute;border-radius:50%;background:rgba(255,255,255,0.4);' +
                    'width:' + size + 'px;height:' + size + 'px;' +
                    'left:' + x + 'px;top:' + y + 'px;' +
                    'transform:scale(0);animation:rippleAnim 0.6s ease-out;pointer-events:none;';

                btn.style.position = 'relative';
                btn.style.overflow = 'hidden';
                btn.appendChild(ripple);

                setTimeout(function () {
                    ripple.remove();
                }, 600);
            });
        });

        // Inyectar keyframes de ripple
        if (!document.getElementById('ripple-keyframes')) {
            var style = document.createElement('style');
            style.id = 'ripple-keyframes';
            style.textContent =
                '@keyframes rippleAnim { to { transform: scale(4); opacity: 0; } }';
            document.head.appendChild(style);
        }
    }



    /* ================================================
       PARTÍCULAS DEL BOTÓN SPARKLE
       ================================================ */
    function initSparkleParticles() {
        var pen = document.getElementById('particle-pen');
        if (!pen) return;
        var STAR = '<svg viewBox="0 0 15 15" fill="none"><path d="M14.187 8.096L15 5.25L15.813 8.096C16.023 8.831 16.417 9.5 16.958 10.042C17.498 10.583 18.167 10.977 18.902 11.188L21.75 12L18.904 12.813C18.169 13.023 17.499 13.417 16.958 13.958C16.417 14.498 16.023 15.167 15.812 15.902L15 18.75L14.187 15.904C13.977 15.169 13.583 14.499 13.042 13.958C12.502 13.417 11.833 13.023 11.098 12.812L8.25 12L11.096 11.187C11.831 10.977 12.501 10.583 13.042 10.042C13.583 9.502 13.977 8.833 14.188 8.098L14.187 8.096Z"/></svg>';
        var count = 30;
        for (var i = 0; i < count; i++) {
            var particle = document.createElement('span');
            particle.className = 'particle';
            particle.innerHTML = STAR;
            particle.style.setProperty('--x', (Math.random() * 100).toFixed(0));
            particle.style.setProperty('--y', (Math.random() * 100).toFixed(0));
            particle.style.setProperty('--duration', (Math.random() * 6 + 6).toFixed(1));
            particle.style.setProperty('--delay', (Math.random() * 10).toFixed(1));
            particle.style.setProperty('--alpha', (Math.random() * 0.6 + 0.4).toFixed(2));
            particle.style.setProperty('--size', (Math.random() * 0.4 + 0.15).toFixed(2));
            particle.style.setProperty('--origin-x', (Math.random() < 0.5 ? (Math.random() * 600 - 300) : (Math.random() * 600 + 300)).toFixed(0) + '%');
            particle.style.setProperty('--origin-y', (Math.random() < 0.5 ? (Math.random() * 600 - 300) : (Math.random() * 600 + 300)).toFixed(0) + '%');
            pen.appendChild(particle);
        }
    }

    /* ================================================
       INICIALIZACIÓN DEL MAPA
       ================================================ */
    const map = L.map('map', {
        center: BOGOTA_CENTER,
        zoom: INITIAL_ZOOM,
        zoomControl: true,
        attributionControl: true
    });

    // Capa de mosaicos oscuros (CartoDB Dark Matter – estilo futurista)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);

    /* ---------- ELEMENTOS ---------- */
    const overlay = document.getElementById('loading-overlay');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const infoPanel = document.getElementById('info-panel');
    const closePanel = document.getElementById('close-panel');
    const filterUrbano = document.getElementById('filter-urbano');
    const filterRural = document.getElementById('filter-rural');

    /* ---------- ESTADO ---------- */
    let geoLayer = null;
    let selectedLayer = null;
    let featureIndex = []; // para búsqueda
    let allLayerEntries = []; // referencia a cada layer + feature para filtrar

    /* ---------- PANEL DE INFORMACIÓN ---------- */
    function showPanel(props) {
        document.getElementById('panel-title').textContent = props.scanombre || '—';
        document.getElementById('panel-code').textContent = props.scacodigo || '—';
        document.getElementById('detail-code').textContent = props.scacodigo || '—';
        document.getElementById('detail-type').textContent =
            (PALETTE[props.scatipo] ? PALETTE[props.scatipo].label : 'Desconocido') + ' (' + props.scatipo + ')';
        document.getElementById('detail-movement').textContent = props.MOVEMENT_ID || '—';
        document.getElementById('detail-perimeter').textContent =
            props.shape_leng ? (props.shape_leng * 111.32).toFixed(2) + ' km (aprox)' : '—';
        document.getElementById('detail-area').textContent =
            props.shape_area ? (props.shape_area * 111.32 * 111.32).toFixed(4) + ' km²' : '—';
        infoPanel.classList.remove('hidden');
    }

    function hidePanel() {
        infoPanel.classList.add('hidden');
        if (selectedLayer) {
            geoLayer.resetStyle(selectedLayer);
            selectedLayer = null;
        }
    }

    closePanel.addEventListener('click', hidePanel);

    /* ---------- TOOLTIP PERSONALIZADO ---------- */
    const mapTooltip = document.getElementById('map-tooltip');
    let currentTooltipName = '';

    function showMapTooltip(name, e) {
        if (!name) return;
        currentTooltipName = name;
        mapTooltip.textContent = name;
        mapTooltip.classList.add('visible');
        moveTooltip(e);
    }

    function hideMapTooltip() {
        currentTooltipName = '';
        mapTooltip.classList.remove('visible');
    }

    function moveTooltip(e) {
        if (!mapTooltip.classList.contains('visible')) return;
        // Usar coordenadas nativas del evento del navegador
        var x = (e.originalEvent || e).clientX;
        var y = (e.originalEvent || e).clientY;
        mapTooltip.style.left = (x + 14) + 'px';
        mapTooltip.style.top = (y - 30) + 'px';
    }

    /* ---------- INTERACCIÓN CON ELEMENTOS ---------- */
    function onEachFeature(feature, layer) {
        const props = feature.properties;
        const tooltipName = props.scanombre || props.scacodigo || '';

        // Clic
        layer.on('click', function () {
            if (selectedLayer) geoLayer.resetStyle(selectedLayer);
            layer.setStyle(highlightStyle(feature));
            layer.bringToFront();
            selectedLayer = layer;
            showPanel(props);
        });

        // Pasar el mouse
        layer.on('mouseover', function (e) {
            if (layer !== selectedLayer) {
                layer.setStyle({ weight: 2.2, fillOpacity: 0.45, opacity: 1 });
                layer.bringToFront();
            }
            showMapTooltip(tooltipName, e);
        });

        layer.on('mousemove', function (e) {
            moveTooltip(e);
        });

        layer.on('mouseout', function () {
            if (layer !== selectedLayer) {
                geoLayer.resetStyle(layer);
            }
            hideMapTooltip();
        });

        // Índice para búsqueda
        featureIndex.push({
            name: (props.scanombre || '').toUpperCase(),
            code: props.scacodigo || '',
            displayName: props.DISPLAY_NAME || props.scanombre || props.scacodigo,
            layer: layer,
            feature: feature
        });
    }

    /* ---------- BÚSQUEDA ---------- */
    searchInput.addEventListener('input', function () {
        const q = this.value.trim().toUpperCase();
        searchResults.innerHTML = '';
        if (q.length < 2) {
            searchResults.classList.remove('visible');
            return;
        }

        const matches = featureIndex.filter(f =>
            f.name.includes(q) || f.code.includes(q)
        ).slice(0, 12);

        if (matches.length === 0) {
            searchResults.classList.remove('visible');
            return;
        }

        matches.forEach(m => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = '<span class="result-name">' + (m.feature.properties.scanombre || '—') +
                '</span><span class="result-code">' + m.code + '</span>';
            div.addEventListener('click', function () {
                searchResults.classList.remove('visible');
                searchInput.value = m.feature.properties.scanombre || m.code;
                // Volar y seleccionar
                map.fitBounds(m.layer.getBounds(), { padding: [60, 60], maxZoom: 15 });
                if (selectedLayer) geoLayer.resetStyle(selectedLayer);
                m.layer.setStyle(highlightStyle(m.feature));
                m.layer.bringToFront();
                selectedLayer = m.layer;
                showPanel(m.feature.properties);
            });
            searchResults.appendChild(div);
        });

        searchResults.classList.add('visible');
    });

    // Ocultar búsqueda al hacer clic fuera
    document.addEventListener('click', function (e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('visible');
        }
    });

    /* ---------- FILTROS RURAL / URBANO ---------- */
    function applyFilters() {
        var showUrbano = filterUrbano.checked;
        var showRural = filterRural.checked;
        var visibleCount = 0;

        allLayerEntries.forEach(function (entry) {
            var tipo = entry.feature.properties.scatipo;
            var visible = false;

            if (tipo === 0 || tipo === '0') {
                visible = showUrbano;
            } else if (tipo === 1 || tipo === '1') {
                visible = showRural;
            } else {
                visible = true; // tipos desconocidos siempre visibles
            }

            if (visible) {
                if (!map.hasLayer(entry.layer)) {
                    map.addLayer(entry.layer);
                }
                visibleCount++;
            } else {
                if (map.hasLayer(entry.layer)) {
                    map.removeLayer(entry.layer);
                }
                // Si está seleccionado, deseleccionar
                if (entry.layer === selectedLayer) {
                    selectedLayer = null;
                    hidePanel();
                }
            }
        });

        // Actualizar contador visible
        var sectorCountEl = document.getElementById('stat-total');
        if (sectorCountEl) {
            sectorCountEl.textContent = visibleCount.toLocaleString('es-CO');
        }
    }

    filterUrbano.addEventListener('change', applyFilters);
    filterRural.addEventListener('change', applyFilters);

    /* ---------- CARGAR DATOS ---------- */
    try {
        const data = BOGOTA_DATA;

        geoLayer = L.geoJSON(data, {
            style: getStyle,
            onEachFeature: function (feature, layer) {
                onEachFeature(feature, layer);
                allLayerEntries.push({ feature, layer });
            }
        }).addTo(map);

        // Actualizar estadísticas del encabezado
        var sectorCountEl = document.getElementById('stat-total');
        if (sectorCountEl) {
            sectorCountEl.dataset.counter = data.features.length;
        }

        // Ajustar límites
        map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });

        // Ocultar cargador y luego inicializar animaciones
        overlay.classList.add('fade-out');
        setTimeout(function () {
            overlay.style.display = 'none';

            // Forzar a Leaflet a recalcular dimensiones del contenedor
            map.invalidateSize();
            // Iniciar todos los sistemas de animación
            initScrollReveal();
            initParallax();
            initCardTilt();
            initRippleEffect();
            initSparkleParticles();
            initPropertyFlip();
            initCharts();
        }, 700);
    } catch (err) {
        console.error(err);
        overlay.querySelector('.loader-text').textContent = 'Error: ' + err.message;
        overlay.querySelector('.loader-ring').style.display = 'none';
    }

    /* ================================================
       TARJETAS INTERACTIVAS – FLIP AL CLIC
       ================================================ */
    function initPropertyFlip() {
        var cards = document.querySelectorAll('.property-card');
        cards.forEach(function (card) {
            card.addEventListener('click', function () {
                card.classList.toggle('flipped');
            });
        });
    }

    /* ================================================
       GRÁFICAS DINÁMICAS – Chart.js
       ================================================ */
    function initCharts() {
        if (typeof Chart === 'undefined') return;

        var fontFamily = "'Inter', sans-serif";
        var red = 'rgba(196, 30, 30, 1)';
        var redLight = 'rgba(196, 30, 30, 0.15)';
        var yellow = 'rgba(245, 166, 35, 1)';
        var yellowLight = 'rgba(245, 166, 35, 0.15)';

        Chart.defaults.font.family = fontFamily;
        Chart.defaults.font.size = 11;
        Chart.defaults.color = '#777';

        // ───── GRÁFICA DE BARRAS: Arriendo promedio por localidad ─────
        (function () {
            var ctx = document.getElementById('chart-bar');
            if (!ctx) return;

            var localidades = [
                'Chapinero', 'Usaquén', 'Suba', 'Kennedy',
                'Fontibón', 'Engativá', 'Teusaquillo', 'Barrios Unidos',
                'Santa Fe', 'Bosa'
            ];
            var arriendos = [
                2850000, 2400000, 1680000, 980000,
                1520000, 1200000, 1950000, 1650000,
                850000, 720000
            ];

            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: localidades,
                    datasets: [{
                        label: 'Arriendo promedio (COP)',
                        data: arriendos,
                        backgroundColor: function (context) {
                            var chart = context.chart;
                            var ctx2 = chart.ctx;
                            var area = chart.chartArea;
                            if (!area) return red;
                            var gradient = ctx2.createLinearGradient(0, area.bottom, 0, area.top);
                            gradient.addColorStop(0, 'rgba(196, 30, 30, 0.6)');
                            gradient.addColorStop(1, 'rgba(245, 166, 35, 0.85)');
                            return gradient;
                        },
                        borderColor: red,
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false,
                        hoverBackgroundColor: red
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: 'rgba(30,30,30,0.92)',
                            titleFont: { weight: '600' },
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function (ctx) {
                                    return '$ ' + ctx.raw.toLocaleString('es-CO');
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { maxRotation: 45, minRotation: 30, font: { size: 10 } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                callback: function (v) {
                                    return '$' + (v / 1000000).toFixed(1) + 'M';
                                }
                            }
                        }
                    }
                }
            });
        })();

        // ───── GRÁFICA DE PASTEL: Distribución por tipo de inmueble ─────
        (function () {
            var ctx = document.getElementById('chart-pie');
            if (!ctx) return;

            var tipos = ['Apartamentos', 'Casas', 'Oficinas', 'Locales', 'Bodegas', 'Habitaciones'];
            var porcentajes = [42, 22, 14, 10, 7, 5];
            var colores = [
                'rgba(196, 30, 30, 0.85)',
                'rgba(245, 166, 35, 0.85)',
                'rgba(52, 152, 219, 0.85)',
                'rgba(46, 204, 113, 0.85)',
                'rgba(155, 89, 182, 0.85)',
                'rgba(149, 165, 166, 0.85)'
            ];
            var bordecolores = [
                'rgba(196, 30, 30, 1)',
                'rgba(245, 166, 35, 1)',
                'rgba(52, 152, 219, 1)',
                'rgba(46, 204, 113, 1)',
                'rgba(155, 89, 182, 1)',
                'rgba(149, 165, 166, 1)'
            ];

            new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: tipos,
                    datasets: [{
                        data: porcentajes,
                        backgroundColor: colores,
                        borderColor: bordecolores,
                        borderWidth: 2,
                        hoverOffset: 12,
                        spacing: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '55%',
                    animation: {
                        animateRotate: true,
                        duration: 1400,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: {
                                padding: 14,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 11, weight: '500' }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30,30,30,0.92)',
                            padding: 12,
                            cornerRadius: 8,
                            callbacks: {
                                label: function (ctx) {
                                    return ctx.label + ': ' + ctx.raw + '%';
                                }
                            }
                        }
                    }
                }
            });
        })();

        // ───── GRÁFICA DE LÍNEAS: Comparación anual Arriendos vs Ventas ─────
        (function () {
            var ctx = document.getElementById('chart-line');
            if (!ctx) return;

            var anios = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026'];
            var arriendos = [38500, 34200, 41800, 52300, 61700, 68400, 74200, 79500];
            var ventas = [22400, 18700, 26100, 31500, 35800, 39200, 42100, 45600];

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: anios,
                    datasets: [
                        {
                            label: 'Arriendos (transacciones)',
                            data: arriendos,
                            borderColor: red,
                            backgroundColor: redLight,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: red,
                            pointBorderWidth: 2,
                            pointHoverBackgroundColor: red
                        },
                        {
                            label: 'Ventas (transacciones)',
                            data: ventas,
                            borderColor: yellow,
                            backgroundColor: yellowLight,
                            fill: true,
                            tension: 0.4,
                            borderWidth: 2.5,
                            pointRadius: 4,
                            pointHoverRadius: 7,
                            pointBackgroundColor: '#fff',
                            pointBorderColor: yellow,
                            pointBorderWidth: 2,
                            pointHoverBackgroundColor: yellow
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    animation: {
                        duration: 1600,
                        easing: 'easeOutQuart'
                    },
                    plugins: {
                        legend: {
                            labels: {
                                padding: 20,
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 12, weight: '500' }
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(30,30,30,0.92)',
                            titleFont: { weight: '600' },
                            padding: 14,
                            cornerRadius: 8,
                            callbacks: {
                                label: function (ctx) {
                                    return ctx.dataset.label + ': ' + ctx.raw.toLocaleString('es-CO');
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: 'rgba(0,0,0,0.03)' },
                            ticks: { font: { size: 11, weight: '500' } }
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: 'rgba(0,0,0,0.04)' },
                            ticks: {
                                callback: function (v) {
                                    return (v / 1000).toFixed(0) + 'K';
                                }
                            }
                        }
                    }
                }
            });
        })();
    }

})();
