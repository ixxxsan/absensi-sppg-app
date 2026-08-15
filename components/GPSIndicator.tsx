'use client';

import { useEffect, useRef } from 'react';
import { Radio, Loader2, MapPin, AlertTriangle, XCircle } from 'lucide-react';
import { useCameraStore } from '@/lib/stores';
import { haversineDistance } from '@/lib/utils';

const TASK_LOCATION = { lat: -6.098751, lon: 106.653180 };
const GEOFENCE_RADIUS = 500;

interface GPSIndicatorProps {
  onLocationFound?: (lat: number, lon: number) => void;
}

export default function GPSIndicator({ onLocationFound }: GPSIndicatorProps) {
  const { gpsStatus, latitude, longitude, gpsAccuracy, distanceFromTask, tipeAbsen,
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
            const kodepos = addr.postcode || '';
            const provPos = [provinsi, kodepos].filter(Boolean).join(' ');
            
            const parts = [jalanLengkap, desa, kecamatan, kotaKab, provPos].filter(Boolean);
            const finalParts = parts.filter((item, pos, self) => self.indexOf(item) === pos);
            
            useCameraStore.getState().setAddressName(finalParts.join(', '));
          })
          .catch(e => {
            // fallback
            console.error(e);
          });
      }
    }
  }, [latitude, longitude, gpsStatus]);

  type Status = typeof gpsStatus;
  const { addressName } = useCameraStore();

  const statusUI: Record<Status, { icon: React.ReactNode; text: string; bg: string; border: string; textColor: string }> = {
    idle: {
      icon: <Radio className="w-4 h-4" />, text: 'GPS belum aktif',
      bg: 'rgba(7,30,73,0.6)', border: 'rgba(181,224,234,0.15)', textColor: 'rgba(181,224,234,0.6)',
    },
    searching: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />, text: 'Mencari lokasi GPS...',
      bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)', textColor: '#fde68a',
    },
    found: {
      icon: <MapPin className="w-4 h-4" />,
      text: addressName ? addressName : (latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Lokasi ditemukan'),
      bg: 'rgba(181,224,234,0.1)', border: 'rgba(181,224,234,0.35)', textColor: '#b5e0ea',
    },
    out_of_range: {
      icon: <AlertTriangle className="w-4 h-4" />,
      text: distanceFromTask ? `Di luar area (${Math.round(distanceFromTask)}m)` : 'Di luar area tugas',
      bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)', textColor: '#f87171',
    },
    error: {
      icon: <XCircle className="w-4 h-4" />, text: 'Izin GPS ditolak',
      bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.3)', textColor: '#f87171',
    },
  };

  const ui = statusUI[gpsStatus];

  // Hide UI as requested, keep only the GPS logic
  return null;
}
