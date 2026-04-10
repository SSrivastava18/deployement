import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon broken by webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const containerStyle = {
  width: '100%',
  height: '450px',
  marginTop: '20px',
};

const MapComponent = ({ location }) => {
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!location) return;

    const fetchCoords = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await response.json();
        if (data.length > 0) {
          setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        } else {
          setError('Location not found.');
        }
      } catch (err) {
        setError('Failed to fetch coordinates.');
      }
    };

    fetchCoords();
  }, [location]);

  const googleMapsUrl = coords
    ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
    : '#';

  return (
    <div style={{ width: '100%' }}>
      {coords ? (
        <>
          <MapContainer center={coords} zoom={13} style={containerStyle}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={coords}>
              <Popup>{location}</Popup>
            </Marker>
          </MapContainer>

          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
              <button style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                See on Google Maps
              </button>
            </a>
          </div>
        </>
      ) : error ? (
        <div style={{ color: 'red', textAlign: 'center', paddingTop: '50px' }}>{error}</div>
      ) : (
        <div style={{ textAlign: 'center', paddingTop: '50px' }}>Loading map...</div>
      )}
    </div>
  );
};

export default MapComponent;