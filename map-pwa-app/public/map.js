// Coordenadas de Valencia
const VALENCIA_COORDS = [39.4699, -0.3763];
const DEFAULT_ZOOM = 13;

let map;
let userMarker;
let accuracyCircle;

// Inicializar mapa
function initMap() {
    map = L.map('map').setView(VALENCIA_COORDS, DEFAULT_ZOOM);
    
    // Usar tile layer moderno estilo Google Maps
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap contributors © CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);
    
    // Iniciar seguimiento de ubicación
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                updateUserLocation(
                    position.coords.latitude,
                    position.coords.longitude,
                    position.coords.accuracy
                );
            },
            (error) => {
                console.error('Error obteniendo ubicación:', error);
                document.getElementById('location-status').textContent = 'Error al obtener ubicación';
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 5000
            }
        );
    }
}

// Actualizar posición del usuario
function updateUserLocation(lat, lon, accuracy) {
    const userIcon = L.icon({
        iconUrl: 'data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="#fff" stroke-width="2"/>
            </svg>
        `),
        iconSize: [24, 24],
        iconAnchor: [12, 12]
    });
    
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    if (accuracyCircle) {
        map.removeLayer(accuracyCircle);
    }
    
    userMarker = L.marker([lat, lon], { icon: userIcon }).addTo(map);
    accuracyCircle = L.circle([lat, lon], {
        radius: accuracy,
        color: '#4285f4',
        fillColor: '#4285f4',
        fillOpacity: 0.1,
        weight: 1
    }).addTo(map);
    
    map.setView([lat, lon], map.getZoom());
    
    document.getElementById('location-status').textContent = 
        `Ubicación: ${lat.toFixed(5)}, ${lon.toFixed(5)} (±${Math.round(accuracy)}m)`;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initMap);
