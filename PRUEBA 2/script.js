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
        <div style="
            width: 30px;
            height: 40px;
            background: #EA4335;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            box-shadow: 0 4px 12px rgba(234, 67, 53, 0.5);
            position: relative;
        ">
            <div style="
                width: 16px;
                height: 16px;
                background: white;
                border-radius: 50%;
                position: absolute;
                top: 7px;
                left: 7px;
            "></div>
        </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40]
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
    const query = document.getElementById('searchInput').value;
    if (!query) return;
    
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ', Valencia')}&format=json&limit=1`)
        .then(response => response.json())
        .then(data => {
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lon = parseFloat(data[0].lon);
                
                const marker = L.marker([lat, lon], { icon: searchMarkerIcon }).addTo(map);
                marker.bindPopup(`
                    <div style="font-family: 'Segoe UI', sans-serif;">
                        <strong style="color: #EA4335;">${data[0].display_name}</strong>
                    </div>
                `).openPopup();
                
                map.setView([lat, lon], 16, { animate: true });
            } else {
                alert('No se encontró la ubicación');
            }
        });
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
                }
            }).addTo(map);
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
    
    // Obtener datos reales de aparcamientos PMR de Valencia con todos los campos
    fetch('https://valencia.opendatasoft.com/api/records/1.0/search/?dataset=aparcaments-persones-mobilitat-reduida-aparcamientos-personas-movilidad-reducida&rows=2000')
        .then(response => response.json())
        .then(data => {
            if (data.records && data.records.length > 0) {
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
                                <div style="background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%); padding: 14px; border-radius: 10px; margin-bottom: 12px; border-left: 5px solid #2196F3; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <div style="color: #0D47A1; font-size: 13px; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">📍 COORDENADAS</div>
                                    <div style="color: #1565C0; font-size: 16px; font-weight: 700; line-height: 1.4;">Lat: ${lat.toFixed(6)}</div>
                                    <div style="color: #1565C0; font-size: 16px; font-weight: 700; line-height: 1.4;">Lon: ${lon.toFixed(6)}</div>
                                </div>
                                ${distrito ? `<div style="margin-bottom: 6px; padding: 8px; background: #FFF3E0; border-radius: 6px; border-left: 3px solid #FF9800;"><small style="color: #E65100; font-weight: 600;">📍 Distrito: ${distrito}</small></div>` : ''}
                                ${barrio ? `<div style="margin-bottom: 6px; padding: 8px; background: #E8F5E9; border-radius: 6px; border-left: 3px solid #4CAF50;"><small style="color: #1B5E20; font-weight: 600;">🏘️ Barrio: ${barrio}</small></div>` : ''}
                                <div style="background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%); padding: 12px; border-radius: 10px; text-align: center; margin-top: 12px; color: white; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);">
                                    <strong style="font-size: 15px;">🅿️ PLAZA RESERVADA PMR</strong>
                                </div>
                            </div>
                        `);
                        parkingMarkers.push(marker);
                    }
                });
            }
        })
        .catch(error => {
            console.error('Error al cargar aparcamientos:', error);
        });
}
