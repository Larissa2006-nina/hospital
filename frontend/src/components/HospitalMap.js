'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Clock, Building2, Phone, Calendar, Compass, ShieldAlert } from 'lucide-react';
import Link from 'next/link';

export default function HospitalMap({ selectedHospitalId, onSelectHospital }) {
  // Default Cameroon location (Yaoundé / Douala center)
  const [userLocation, setUserLocation] = useState({ lat: 3.8480, lng: 11.5021, city: 'Cameroon (Default)' });
  const [hospitals, setHospitals] = useState([]);
  const [activeHospital, setActiveHospital] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [geoError, setGeoError] = useState(null);

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const routeLayerRef = useRef(null);

  // 1. Get User Location via Geolocation API
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            city: 'Your Live Location (Cameroon)',
          });
        },
        (err) => {
          console.warn('Geolocation access denied or unavailable, using Cameroon defaults:', err.message);
          setGeoError('Using Cameroon coordinates (Yaoundé / Douala).');
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  }, []);

  // 2. Fetch hospitals with distance from user location
  useEffect(() => {
    fetchHospitals();
  }, [userLocation]);

  const fetchHospitals = async () => {
    try {
      const res = await fetch(`/api/hospitals?lat=${userLocation.lat}&lng=${userLocation.lng}`);
      const data = await res.json();
      if (data.success) {
        setHospitals(data.hospitals || []);
        if (data.hospitals.length > 0 && !activeHospital) {
          const defaultHosp = selectedHospitalId
            ? data.hospitals.find(h => h.hospitalId === selectedHospitalId) || data.hospitals[0]
            : data.hospitals[0];
          setActiveHospital(defaultHosp);
          calculateRoute(defaultHosp);
        }
      }
    } catch (e) {
      console.error('Failed to fetch hospitals:', e);
    }
  };

  // 3. Initialize Leaflet Map (Client Side Only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet library dynamically if not loaded
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;

      if (!mapContainerRef.current) return;

      if (!leafletMapRef.current) {
        const map = L.map(mapContainerRef.current).setView([userLocation.lat, userLocation.lng], 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;
      } else {
        leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 12);
      }

      const map = leafletMapRef.current;

      // Clear existing markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      // Custom User Icon
      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `<div style="background:#2563eb; width:20px; height:20px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 10px rgba(37,99,235,0.6);"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b><br/>Cameroon Geolocation Origin');
      markersRef.current.push(userMarker);

      // Hospital Markers
      const hospitalIcon = L.divIcon({
        className: 'custom-hospital-marker',
        html: `<div style="background:#dc2626; color:#ffffff; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ffffff; box-shadow:0 0 12px rgba(220,38,38,0.5); font-weight:bold; font-size:14px;">🏥</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      hospitals.forEach((hosp) => {
        const marker = L.marker([hosp.latitude, hosp.longitude], { icon: hospitalIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif; padding:4px;">
              <strong style="color:#dc2626;">${hosp.name}</strong><br/>
              <span style="font-size:12px; color:#64748b;">${hosp.address}, ${hosp.city}</span><br/>
              <span style="font-size:12px; font-weight:600; color:#059669;">Stock: ${hosp.bloodBank?.availableUnitsCount || 0} Units</span>
            </div>
          `);

        marker.on('click', () => {
          setActiveHospital(hosp);
          if (onSelectHospital) onSelectHospital(hosp);
          calculateRoute(hosp);
        });

        markersRef.current.push(marker);
      });

      // Automatically center/fit bounds to hospitals if available in Cameroon
      if (hospitals.length > 0) {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          ...hospitals.map(h => [h.latitude, h.longitude])
        ]);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    };

    initLeaflet();
  }, [userLocation, hospitals]);

  // 4. Calculate Driving Route via OSRM API
  const calculateRoute = async (hospital) => {
    if (!hospital) return;
    setLoadingRoute(true);

    try {
      const res = await fetch('/api/geo/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startLat: userLocation.lat,
          startLng: userLocation.lng,
          endLat: hospital.latitude,
          endLng: hospital.longitude,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRouteInfo(data);

        // Draw Polyline on Leaflet
        if (typeof window !== 'undefined' && leafletMapRef.current && data.coordinates) {
          const L = (await import('leaflet')).default;
          const map = leafletMapRef.current;

          if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
          }

          // GeoJSON coordinates are [lng, lat], Leaflet polyline expects [lat, lng]
          const latLngs = data.coordinates.map(c => [c[1], c[0]]);
          const polyline = L.polyline(latLngs, {
            color: '#dc2626',
            weight: 5,
            opacity: 0.8,
            dashArray: '8, 8',
          }).addTo(map);

          routeLayerRef.current = polyline;
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });
        }
      }
    } catch (e) {
      console.error('Route calculation error:', e);
    } finally {
      setLoadingRoute(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
      {/* Interactive Map View */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', position: 'relative', minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={20} color="#dc2626" />
            <div>
              <strong style={{ fontSize: '15px' }}>Hospital Locations & Live Driving Navigation (Cameroon)</strong>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Powered by Leaflet, OpenStreetMap & OSRM Routing Engine</div>
            </div>
          </div>
          {geoError && (
            <span style={{ fontSize: '11px', color: '#b45309', background: '#fffbeb', padding: '4px 8px', borderRadius: '6px' }}>
              {geoError}
            </span>
          )}
        </div>

        <div ref={mapContainerRef} style={{ width: '100%', flex: 1, minHeight: '460px', zIndex: 1 }} />
      </div>

      {/* Hospital Details & Navigation Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Nearest Hospital Card */}
        {activeHospital ? (
          <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <span className="badge badge-danger" style={{ fontSize: '11px', marginBottom: '6px' }}>
                  {hospitals[0]?.hospitalId === activeHospital.hospitalId ? '⭐ Nearest Hospital' : 'Selected Hospital'}
                </span>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#0f172a' }}>{activeHospital.name}</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={16} color="#dc2626" />
                <span>{activeHospital.address}, {activeHospital.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={16} color="#2563eb" />
                <span>{activeHospital.contactNumber}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={16} color="#059669" />
                <span>Blood Bank: {activeHospital.bloodBank?.name || 'Active Center'} ({activeHospital.bloodBank?.availableUnitsCount || 0} units)</span>
              </div>
            </div>

            {/* Driving Calculations */}
            {loadingRoute ? (
              <div style={{ padding: '16px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                Calculating fastest driving route...
              </div>
            ) : routeInfo ? (
              <div style={{ background: '#fef2f2', padding: '14px', borderRadius: '10px', marginBottom: '16px', border: '1px solid #fee2e2' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: '#991b1b' }}>
                    <Navigation size={16} color="#dc2626" />
                    <span>{routeInfo.distanceKm} km driving distance</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: '#dc2626' }}>
                    <Clock size={16} />
                    <span>~{routeInfo.durationMin} mins</span>
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>
                  Straight line: {routeInfo.straightDistanceKm} km | Engine: {routeInfo.provider}
                </div>
              </div>
            ) : null}

            <Link
              href={`/donor/book?hospitalId=${activeHospital.hospitalId}`}
              className="btn btn-primary"
              style={{ width: '100%', textDecoration: 'none' }}
            >
              <Calendar size={16} />
              <span>Book Appointment at this Hospital</span>
            </Link>
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', color: '#64748b', padding: '32px' }}>
            Select a hospital to view route & distance.
          </div>
        )}

        {/* List of other nearby hospitals */}
        <div className="card" style={{ flex: 1 }}>
          <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px', color: '#334155' }}>
            All Registered Hospitals ({hospitals.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
            {hospitals.map((hosp) => (
              <div
                key={hosp.hospitalId}
                onClick={() => {
                  setActiveHospital(hosp);
                  if (onSelectHospital) onSelectHospital(hosp);
                  calculateRoute(hosp);
                }}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: activeHospital?.hospitalId === hosp.hospitalId ? '2px solid #dc2626' : '1px solid #e2e8f0',
                  background: activeHospital?.hospitalId === hosp.hospitalId ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{hosp.name}</strong>
                  {hosp.distanceKm !== null && (
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#dc2626' }}>
                      {hosp.distanceKm} km
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {hosp.city} &bull; Stock: {hosp.bloodBank?.availableUnitsCount || 0} Units
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
