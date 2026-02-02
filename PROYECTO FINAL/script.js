// Coordenadas del centro de Valencia
const VALENCIA_CENTER = [39.4699, -0.3763];
const VALENCIA_ZOOM = 13;

// Límites geográficos de la ciudad de Valencia
const VALENCIA_BOUNDS = [
    [39.42, -0.45],
    [39.52, -0.30]
];

// Inicializar mapa
const map = L.map('map', {
    center: VALENCIA_CENTER,
    zoom: VALENCIA_ZOOM,
    minZoom: 12,
    maxZoom: 18,
    maxBounds: VALENCIA_BOUNDS,
    maxBoundsViscosity: 1.0,
    zoomControl: false
});

// Usar tile layer estilo Google Maps
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap contributors © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

let userMarker = null;
let routeControl = null;
let parkingMarkers = [];
let searchMarker = null;
let currentParkingMarker = null; // Variable para el marcador PMR actual

// Icono personalizado estilo Google Maps para ubicación del usuario
const userLocationIcon = L.divIcon({
    className: 'custom-user-marker',
    html: `
        <div style="position: relative;">
            <div style="
                width: 20px;
                height: 20px;
                background: #4285F4;
                border: 4px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(66, 133, 244, 0.6);
                position: absolute;
                top: -10px;
                left: -10px;
            "></div>
            <div style="
                width: 40px;
                height: 40px;
                background: rgba(66, 133, 244, 0.2);
                border-radius: 50%;
                position: absolute;
                top: -20px;
                left: -20px;
                animation: pulse-ring 2s infinite;
            "></div>
        </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
});

const searchMarkerIcon = L.divIcon({
    className: 'custom-search-marker',
    html: `
        <div style="position: relative; width: 30px; height: 40px;">
            <div style="
                width: 30px;
                height: 30px;
                background: #EA4335;
                border: 3px solid white;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                box-shadow: 0 4px 12px rgba(234, 67, 53, 0.5);
                position: absolute;
                top: 0;
                left: 0;
            ">
                <div style="
                    width: 12px;
                    height: 12px;
                    background: white;
                    border-radius: 50%;
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%) rotate(45deg);
                "></div>
            </div>
        </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
});

function locateMe() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                if (userMarker) {
                    map.removeLayer(userMarker);
                }
                
                userMarker = L.marker([lat, lng], { icon: userLocationIcon }).addTo(map);
                
                L.circle([lat, lng], {
                    radius: position.coords.accuracy,
                    color: '#4285F4',
                    fillColor: '#4285F4',
                    fillOpacity: 0.15,
                    weight: 1
                }).addTo(map);
                
                map.setView([lat, lng], 15, { animate: true });
                
                userMarker.bindPopup(`
                    <div style="font-family: 'Segoe UI', sans-serif; text-align: center;">
                        <strong style="color: #4285F4;">📍 Tu ubicación</strong><br>
                        <small>Precisión: ${Math.round(position.coords.accuracy)}m</small>
                    </div>
                `).openPopup();
            },
            (error) => {
                alert('No se pudo obtener tu ubicación. Por favor, permite el acceso al GPS.');
            }
        );
    }
}

function searchLocation() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) {
        alert('Por favor, ingresa una ubicación para buscar');
        return;
    }
    
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Valencia')}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                // Eliminar marcador anterior de búsqueda si existe
                if (searchMarker) {
                    map.removeLayer(searchMarker);
                }
                
                // Eliminar marcador temporal PMR si existe
                if (currentParkingMarker) {
                    map.removeLayer(currentParkingMarker);
                    currentParkingMarker = null;
                }
                
                // Eliminar ruta anterior
                if (routeControl) {
                    map.removeControl(routeControl);
                    routeControl = null;
                }
                
                searchMarker = L.marker([lat, lon], { icon: searchMarkerIcon }).addTo(map);
                searchMarker.bindPopup(`
                    <div style="font-family: 'Segoe UI', sans-serif; min-width: 250px;">
                        <div style="margin-bottom: 12px;">
                            <strong style="color: #EA4335; font-size: 16px;">${data[0].display_name}</strong>
                        </div>
                        <button onclick="startNavigationTo(${lat}, ${lon})" style="
                            width: 100%;
                            padding: 12px;
                            background: linear-gradient(135deg, #4285F4 0%, #1976D2 100%);
                            color: white;
                            border: none;
                            border-radius: 10px;
                            cursor: pointer;
                            font-size: 14px;
                            font-weight: 600;
                            box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
                            transition: all 0.3s ease;
                        " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(66, 133, 244, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(66, 133, 244, 0.4)'">
                            🚗 Cómo llegar
                        </button>
                    </div>
                `).openPopup();
                
                map.setView([lat, lon], 16, { animate: true });
            } else {
                alert('❌ No se encontró la ubicación. Intenta con otro término de búsqueda.');
            }
        })
        .catch(error => {
            console.error('Error en la búsqueda:', error);
            alert('❌ Error al realizar la búsqueda. Inténtalo de nuevo.');
        });
}

// Añadir listener para Enter en el input de búsqueda
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchLocation();
            }
        });
    }
});

function startNavigationTo(destLat, destLon) {
    if (!userMarker) {
        alert('Primero activa tu ubicación con el botón 📍');
        locateMe();
        return;
    }
    
    const userLatLng = userMarker.getLatLng();
    
    // Limpiar ruta anterior
    if (routeControl) {
        map.removeControl(routeControl);
    }
    
    // Limpiar marcador temporal anterior
    if (currentParkingMarker) {
        map.removeLayer(currentParkingMarker);
        currentParkingMarker = null;
    }
    
    // Crear marcador de destino si no existe el marcador de búsqueda
    if (!searchMarker) {
        const tempMarker = L.marker([destLat, destLon], { icon: searchMarkerIcon }).addTo(map);
        currentParkingMarker = tempMarker;
    }
    
    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(userLatLng.lat, userLatLng.lng),
            L.latLng(destLat, destLon)
        ],
        routeWhileDragging: true,
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        lineOptions: {
            styles: [{
                color: '#4285F4',
                opacity: 0.8,
                weight: 6
            }]
        },
        createMarker: function(i, waypoint, n) {
            if (i === 0) {
                return L.marker(waypoint.latLng, { icon: userLocationIcon });
            } else {
                return null; // No crear marcador, ya existe
            }
        },
        formatter: new L.Routing.Formatter({
            language: 'es'
        })
    }).addTo(map);
    
    // Escuchar cuando se calcula la ruta para mostrar instrucciones
    routeControl.on('routesfound', function(e) {
        const routes = e.routes;
        const summary = routes[0].summary;
        const instructions = routes[0].instructions;
        
        // Crear popup con información de la ruta
        let routeInfo = `
            <div style="font-family: 'Segoe UI', sans-serif; padding: 10px; min-width: 250px;">
                <div style="text-align: center; margin-bottom: 10px;">
                    <strong style="color: #4285F4; font-size: 16px;">🗺️ Ruta Calculada</strong>
                </div>
                <div style="background: #E3F2FD; padding: 10px; border-radius: 8px; margin-bottom: 8px;">
                    <div style="color: #1565C0; font-size: 13px; margin-bottom: 5px;">
                        📏 Distancia: <strong>${(summary.totalDistance / 1000).toFixed(2)} km</strong>
                    </div>
                    <div style="color: #1565C0; font-size: 13px;">
                        ⏱️ Tiempo estimado: <strong>${Math.round(summary.totalTime / 60)} min</strong>
                    </div>
                </div>`;
        
        // Agregar indicadores de tramos a pie si existen
        let walkingSegmentsFound = [];
        instructions.forEach((instruction, index) => {
            const text = instruction.text.toLowerCase();
            if (text.includes('caminar') || text.includes('andar') || text.includes('pie') || 
                text.includes('peatonal') || text.includes('paso de peatones') ||
                (instruction.distance < 100 && text.includes('girar'))) {
                walkingSegmentsFound.push({
                    index: index + 1,
                    text: instruction.text,
                    distance: instruction.distance
                });
            }
        });
        
        if (walkingSegmentsFound.length > 0) {
            routeInfo += `
                <div style="background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%); padding: 10px; border-radius: 8px; border-left: 4px solid #FF9800; margin-top: 8px;">
                    <div style="color: #E65100; font-size: 13px; font-weight: 600; margin-bottom: 6px; display: flex; align-items: center; gap: 5px;">
                        🚶 Tramos a pie detectados:
                    </div>`;
            
            walkingSegmentsFound.forEach(segment => {
                routeInfo += `
                    <div style="background: white; padding: 6px; border-radius: 5px; margin-top: 5px; font-size: 11px; color: #555;">
                        <strong>Paso ${segment.index}:</strong> ${segment.text}
                        ${segment.distance > 0 ? `<br><small style="color: #888;">📏 ${segment.distance}m</small>` : ''}
                    </div>`;
            });
            
            routeInfo += `</div>`;
        }
        
        routeInfo += `
                <div style="background: linear-gradient(135deg, #4285F4 0%, #1976D2 100%); padding: 10px; border-radius: 8px; text-align: center; margin-top: 10px; color: white;">
                    <small style="font-size: 12px;">💡 Sigue las indicaciones en el mapa</small>
                </div>
            </div>`;
        
        // Mostrar popup
        if (searchMarker) {
            searchMarker.bindPopup(routeInfo).openPopup();
        } else if (currentParkingMarker) {
            currentParkingMarker.bindPopup(routeInfo).openPopup();
        }
    });
    
    // Cerrar popups existentes
    map.closePopup();
}

function showRoutePanel() {
    document.getElementById('routePanel').classList.add('show');
}

function closeRoutePanel() {
    document.getElementById('routePanel').classList.remove('show');
}

function calculateRoute() {
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    
    if (!origin || !destination) {
        alert('Por favor, ingresa origen y destino');
        return;
    }
    
    // Limpiar marcadores anteriores
    if (searchMarker) {
        map.removeLayer(searchMarker);
        searchMarker = null;
    }
    
    if (currentParkingMarker) {
        map.removeLayer(currentParkingMarker);
        currentParkingMarker = null;
    }
    
    if (routeControl) {
        map.removeControl(routeControl);
    }
    
    Promise.all([
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(origin + ', Valencia')}&format=json&limit=1`),
        fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination + ', Valencia')}&format=json&limit=1`)
    ])
    .then(responses => Promise.all(responses.map(r => r.json())))
    .then(([originData, destData]) => {
        if (originData.length > 0 && destData.length > 0) {
            routeControl = L.Routing.control({
                waypoints: [
                    L.latLng(parseFloat(originData[0].lat), parseFloat(originData[0].lon)),
                    L.latLng(parseFloat(destData[0].lat), parseFloat(destData[0].lon))
                ],
                routeWhileDragging: true,
                lineOptions: {
                    styles: [{
                        color: '#4285F4',
                        opacity: 0.8,
                        weight: 6
                    }]
                },
                createMarker: function(i, waypoint, n) {
                    return L.marker(waypoint.latLng, {
                        icon: searchMarkerIcon
                    });
                },
                formatter: new L.Routing.Formatter({
                    language: 'es'
                })
            }).addTo(map);
            
            // Agregar el mismo listener para mostrar información de tramos a pie
            routeControl.on('routesfound', function(e) {
                const routes = e.routes;
                const instructions = routes[0].instructions;
                
                let walkingSegments = [];
                instructions.forEach((instruction, index) => {
                    const text = instruction.text.toLowerCase();
                    if (text.includes('caminar') || text.includes('andar') || text.includes('pie') || 
                        text.includes('peatonal') || text.includes('paso de peatones') ||
                        (instruction.distance < 100 && text.includes('girar'))) {
                        walkingSegments.push(instruction.text);
                    }
                });
                
                if (walkingSegments.length > 0) {
                    console.log('⚠️ Ruta con tramos a pie detectados:', walkingSegments);
                }
            });
        } else {
            alert('No se pudieron encontrar las ubicaciones');
        }
    });
}

function toggleAccessibility() {
    document.body.classList.toggle('high-contrast');
}

function showAccessibleParking() {
    // Limpiar marcadores anteriores
    parkingMarkers.forEach(marker => map.removeLayer(marker));
    parkingMarkers = [];
    
    if (currentParkingMarker) {
        map.removeLayer(currentParkingMarker);
        currentParkingMarker = null;
    }
    
    // Icono personalizado para aparcamiento accesible
    const parkingIcon = L.divIcon({
        className: 'parking-icon',
        html: `
            <div style="
                width: 40px;
                height: 40px;
                background: #2196F3;
                border: 3px solid white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                box-shadow: 0 4px 12px rgba(33, 150, 243, 0.5);
            ">♿</div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    // Mostrar indicador de carga
    console.log('Cargando plazas PMR...');
    
    // Obtener datos con límite de 500 registros para mejorar rendimiento
    fetch('https://valencia.opendatasoft.com/api/records/1.0/search/?dataset=aparcaments-persones-mobilitat-reduida-aparcamientos-personas-movilidad-reducida&rows=500')
        .then(response => response.json())
        .then(data => {
            if (data.records && data.records.length > 0) {
                console.log(`Mostrando ${data.records.length} plazas PMR`);
                
                // Usar clustering para mejor rendimiento
                data.records.forEach(record => {
                    const fields = record.fields;
                    
                    if (fields.geo_point_2d) {
                        const lat = fields.geo_point_2d[0];
                        const lon = fields.geo_point_2d[1];
                        
                        const distrito = fields.nom_districte || '';
                        const barrio = fields.nom_barri || '';
                        
                        const marker = L.marker([lat, lon], { icon: parkingIcon }).addTo(map);
                        marker.bindPopup(`
                            <div style="font-family: 'Segoe UI', sans-serif; padding: 12px; min-width: 280px;">
                                <div style="margin-bottom: 12px; text-align: center;">
                                    <strong style="color: #2196F3; font-size: 24px;">♿</strong>
                                    <div style="color: #2196F3; font-size: 17px; font-weight: bold; margin-top: 5px;">Aparcamiento PMR</div>
                                </div>
                                ${distrito ? `<div style="margin-bottom: 6px; padding: 8px; background: #FFF3E0; border-radius: 6px; border-left: 3px solid #FF9800;"><small style="color: #E65100; font-weight: 600;">📍 Distrito: ${distrito}</small></div>` : ''}
                                ${barrio ? `<div style="margin-bottom: 6px; padding: 8px; background: #E8F5E9; border-radius: 6px; border-left: 3px solid #4CAF50;"><small style="color: #1B5E20; font-weight: 600;">🏘️ Barrio: ${barrio}</small></div>` : ''}
                                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 12px; border-radius: 10px; text-align: center; margin-top: 12px; color: white; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);">
                                    <strong style="font-size: 15px;">🅿️ PLAZA RESERVADA PMR</strong>
                                </div>
                                <button onclick="startNavigationTo(${lat}, ${lon})" style="
                                    width: 100%;
                                    padding: 12px;
                                    background: linear-gradient(135deg, #4285F4 0%, #1976D2 100%);
                                    color: white;
                                    border: none;
                                    border-radius: 10px;
                                    cursor: pointer;
                                    font-size: 14px;
                                    font-weight: 600;
                                    box-shadow: 0 4px 12px rgba(66, 133, 244, 0.4);
                                    transition: all 0.3s ease;
                                    margin-top: 12px;
                                " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 16px rgba(66, 133, 244, 0.6)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(66, 133, 244, 0.4)'">
                                    🚗 Cómo llegar
                                </button>
                            </div>
                        `);
                        parkingMarkers.push(marker);
                    }
                });
                
                alert(`✅ Se cargaron ${data.records.length} plazas PMR en el mapa`);
            }
        })
        .catch(error => {
            console.error('Error al cargar aparcamientos:', error);
            alert('❌ Error al cargar las plazas PMR. Inténtalo de nuevo.');
        });
}
