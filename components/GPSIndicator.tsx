'use client';

import { useEffect, useRef } from 'react';
import { useCameraStore } from '@/lib/stores';
import { haversineDistance } from '@/lib/utils';
import { GEOFENCE } from '@/lib/config';

const TASK_LOCATION = { lat: GEOFENCE.lat, lon: GEOFENCE.lon };
const GEOFENCE_RADIUS = GEOFENCE.radiusMeters;

interface GPSIndicatorProps {
  onLocationFound?: (lat: number, lon: number) => void;
}

export default function GPSIndicator({ onLocationFound }: GPSIndicatorProps) {
  const { gpsStatus, latitude, longitude, tipeAbsen,
          setGPS, setGpsStatus, setDistanceFromTask } = useCameraStore();
  const watchIdRef = useRef<number | null>(null);
  const lastFetchedCoords = useRef<{lat: number, lon: number} | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) { setGpsStatus('error'); return; }
    setGpsStatus('searching');

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lon, accuracy } = pos.coords;
        
        setGPS(lat, lon, accuracy);

        const dist = haversineDistance(lat, lon, TASK_LOCATION.lat, TASK_LOCATION.lon);
        setDistanceFromTask(dist);
        if (dist <= GEOFENCE_RADIUS || tipeAbsen === 'pulang') { setGpsStatus('found'); onLocationFound?.(lat, lon); }
        else { setGpsStatus('out_of_range'); }
      },
      () => setGpsStatus('error'),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [setGPS, setGpsStatus, setDistanceFromTask, tipeAbsen, onLocationFound]);

  // Reverse geocoding
  useEffect(() => {
    if (latitude && longitude && (gpsStatus === 'found' || gpsStatus === 'out_of_range')) {
      const last = lastFetchedCoords.current;
      if (!last || haversineDistance(latitude, longitude, last.lat, last.lon) > 50) {
        lastFetchedCoords.current = { lat: latitude, lon: longitude };
        const tomtomKey = process.env.NEXT_PUBLIC_TOMTOM_API_KEY || '';
        const fetchUrl = `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${tomtomKey}`;
        
        const fallbackToNominatim = () => {
          fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`)
            .then(r => r.json())
            .then(data => {
              const addr = data.address || {};
              let jalan = addr.road || addr.pedestrian || addr.path || '';
              if (jalan && !jalan.toLowerCase().startsWith('jl') && !jalan.toLowerCase().startsWith('jalan')) {
                  jalan = `Jl. ${jalan}`;
              }
              const no = addr.house_number ? `No.${addr.house_number}` : '';
              const jalanLengkap = [jalan, no].filter(Boolean).join(' ');
              const desa = addr.village || addr.neighbourhood || addr.hamlet || '';
              let kecamatan = addr.district || addr.city_district || addr.municipality || addr.suburb || '';
              if (kecamatan && !kecamatan.toLowerCase().startsWith('kec')) {
                  kecamatan = `Kec. ${kecamatan}`;
              }
              const kotaKab = addr.city || addr.county || addr.town || '';
              const provinsi = addr.state || '';
              let kodepos = addr.postcode || '';
              const fullArea = (jalanLengkap + ' ' + desa + ' ' + kecamatan + ' ' + kotaKab).toLowerCase();
              if (fullArea.includes('teluknaga')) {
                  kodepos = '15510';
              }
              const provPos = [provinsi, kodepos].filter(Boolean).join(' ');
              const parts = [jalanLengkap, desa, kecamatan, kotaKab, provPos].filter(Boolean);
              const finalParts = parts.filter((item, pos, self) => self.indexOf(item) === pos);
              
              if (finalParts.length > 0) {
                useCameraStore.getState().setAddressName(finalParts.join(', '));
              } else {
                useCameraStore.getState().setAddressName('Lokasi tidak dikenal');
              }
            })
            .catch(err => {
              console.error('Nominatim fallback error:', err);
              useCameraStore.getState().setAddressName('Gagal mendapatkan alamat');
            });
        };

        if (tomtomKey) {
          fetch(fetchUrl)
            .then(async r => {
              if (!r.ok) throw new Error(`TomTom API error: ${r.status}`);
              return r.json();
            })
            .then(data => {
              const addrData = data.addresses && data.addresses[0] ? data.addresses[0].address : null;
              
              // Jika TomTom tidak memiliki data nama jalan untuk koordinat ini, 
              // kita fallback ke Nominatim yang seringkali memiliki data gang/jalan kecil dari komunitas OSM.
              if (!addrData || !addrData.streetName) {
                console.warn('TomTom tidak memiliki nama jalan. Mencoba Nominatim...');
                fallbackToNominatim();
                return;
              }
              
              let jalan = addrData.streetName || '';
              if (jalan && !jalan.toLowerCase().startsWith('jl') && !jalan.toLowerCase().startsWith('jalan')) {
                  jalan = `Jl. ${jalan}`;
              }
              
              const no = addrData.streetNumber ? `No.${addrData.streetNumber}` : '';
              const jalanLengkap = [jalan, no].filter(Boolean).join(' ');
              
              const desa = addrData.municipalitySubdivision || '';
              
              let kecamatan = addrData.municipalitySecondarySubdivision || '';
              if (kecamatan && !kecamatan.toLowerCase().startsWith('kec')) {
                  kecamatan = `Kec. ${kecamatan}`;
              }
              
              const kotaKab = addrData.municipality || '';
              const provinsi = addrData.countrySubdivision || '';
              let kodepos = addrData.postalCode || '';
              const fullArea = (jalanLengkap + ' ' + desa + ' ' + kecamatan + ' ' + kotaKab).toLowerCase();
              if (fullArea.includes('teluknaga')) {
                  kodepos = '15510';
              }
              const provPos = [provinsi, kodepos].filter(Boolean).join(' ');
              
              const parts = [jalanLengkap, desa, kecamatan, kotaKab, provPos].filter(Boolean);
              const finalParts = parts.filter((item, pos, self) => self.indexOf(item) === pos);
              
              useCameraStore.getState().setAddressName(finalParts.join(', '));
            })
            .catch(err => {
              console.warn('TomTom gagal/limit habis. Menggunakan Nominatim (OSM)...', err);
              fallbackToNominatim();
            });
        } else {
          fallbackToNominatim();
        }


      }
    }
  }, [latitude, longitude, gpsStatus]);


  // Hide UI as requested, keep only the GPS logic
  return null;
}
