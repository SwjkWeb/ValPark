// This file contains the logic for rendering and interacting with the map. 
// It utilizes a mapping library (like Leaflet or Google Maps) to display geographical data.

import L from 'leaflet';

const map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
}).addTo(map);

const marker = L.marker([51.5, -0.09]).addTo(map);
marker.bindPopup('<b>Hello world!</b><br>I am a popup.').openPopup();