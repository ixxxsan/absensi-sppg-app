import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const WIB = 'Asia/Jakarta';

/**
 * Get current time locked to WIB (UTC+7)
 */
export const nowWIB = () => dayjs().tz(WIB);

/**
 * Format current time as HH:mm:ss WIB
 */
export const formatTimeWIB = (d?: dayjs.Dayjs) => {
  const dt = d ?? nowWIB();
  return dt.format('HH:mm:ss');
};

/**
 * Format date in Indonesian long format
 * e.g. "Kamis, 14 Agustus 2025"
 */
export const formatDateLong = (d?: dayjs.Dayjs) => {
  const dt = d ?? nowWIB();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return `${days[dt.day()]}, ${dt.date()} ${months[dt.month()]} ${dt.year()}`;
};

/**
 * Format date as YYYY-MM-DD for database
 */
export const formatDateISO = (d?: dayjs.Dayjs) => {
  return (d ?? nowWIB()).format('YYYY-MM-DD');
};

/**
 * Watermark timestamp string
 * e.g. "14/08/2025 • 08:27:43 WIB"
 */
export const formatWatermarkTimestamp = (d?: dayjs.Dayjs) => {
  const dt = d ?? nowWIB();
  return `${dt.format('DD/MM/YYYY')} • ${dt.format('HH:mm:ss')} WIB`;
};

/**
 * Greeting based on hour
 */
export const getGreeting = () => {
  const hour = nowWIB().hour();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 18) return 'Selamat sore';
  return 'Selamat malam';
};

/**
 * Calculate distance between two GPS coordinates in meters (Haversine formula)
 */
export const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Format GPS coordinate for display
 * e.g. -6.2088, 106.8456
 */
export const formatCoords = (lat: number, lon: number) => {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};

/**
 * Apply watermark text onto a canvas with captured photo
 * Returns Promise<Blob> of the watermarked image in WebP format
 */
export const applyWatermark = (
  sourceCanvas: HTMLCanvasElement,
  opts: {
    latitude: number;
    longitude: number;
    addressName?: string | null;
    namaRelawan: string;
    idRelawan: string;
    divisi: string;
    tipeAbsen: 'masuk' | 'pulang';
  }
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = sourceCanvas.width;
    canvas.height = sourceCanvas.height;
    const ctx = canvas.getContext('2d')!;

    // Draw original image
    ctx.drawImage(sourceCanvas, 0, 0);

    const W = canvas.width;
    const H = canvas.height;

    // Semi-transparent watermark background bar at bottom
    const barHeight = H * 0.35; // increased for new layout
    const gradient = ctx.createLinearGradient(0, H - barHeight, 0, H);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.2, 'rgba(0, 0, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, H - barHeight, W, barHeight);

    // Text settings
    const baseFontSize = Math.round(W * 0.035);
    ctx.textBaseline = 'top';

    // 1. Draw Time block (White rounded rect with dark blue text)
    const timeText = nowWIB().format('HH:mm');
    ctx.font = `900 ${baseFontSize * 1.8}px "Plus Jakarta Sans", sans-serif`;
    const timeWidth = ctx.measureText(timeText).width;
    const timeBoxW = timeWidth + (W * 0.06);
    const timeBoxH = baseFontSize * 2.2;
    const timeX = W * 0.04;
    const timeY = H - barHeight + (barHeight * 0.1);
    const radius = W * 0.015;

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(timeX + radius, timeY);
    ctx.lineTo(timeX + timeBoxW - radius, timeY);
    ctx.quadraticCurveTo(timeX + timeBoxW, timeY, timeX + timeBoxW, timeY + radius);
    ctx.lineTo(timeX + timeBoxW, timeY + timeBoxH - radius);
    ctx.quadraticCurveTo(timeX + timeBoxW, timeY + timeBoxH, timeX + timeBoxW - radius, timeY + timeBoxH);
    ctx.lineTo(timeX + radius, timeY + timeBoxH);
    ctx.quadraticCurveTo(timeX, timeY + timeBoxH, timeX, timeY + timeBoxH - radius);
    ctx.lineTo(timeX, timeY + radius);
    ctx.quadraticCurveTo(timeX, timeY, timeX + radius, timeY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0c2860'; // Dark blue
    ctx.fillText(timeText, timeX + (W * 0.03), timeY + (baseFontSize * 0.2));

    // 2. Tipe absen badge on the right side of the time block
    const tipeText = opts.tipeAbsen === 'masuk' ? 'ABSEN MASUK' : 'ABSEN PULANG';
    ctx.font = `800 ${baseFontSize * 0.8}px "Plus Jakarta Sans", sans-serif`;
    const tipeWidth = ctx.measureText(tipeText).width;
    const badgePadX = W * 0.03;
    const badgeW = tipeWidth + (badgePadX * 2);
    const badgeH = baseFontSize * 1.6;
    const badgeX = W - badgeW - W * 0.04;
    const badgeY = timeY + (timeBoxH / 2) - (badgeH / 2);

    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    } else {
      ctx.rect(badgeX, badgeY, badgeW, badgeH); // fallback
    }
    ctx.fill();

    ctx.fillStyle = '#0c2860';
    ctx.fillText(tipeText, badgeX + badgePadX, badgeY + (baseFontSize * 0.35));

    // 3. Green vertical line
    const startLineY = timeY + timeBoxH + (barHeight * 0.05);
    const lineX = timeX + (W * 0.005);
    
    // Calculate heights to know line length
    let yOffset = startLineY;

    // 4. Draw Date
    const dateText = formatDateLong();
    ctx.font = `800 ${baseFontSize * 1.1}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(dateText, timeX + (W * 0.03), yOffset);
    yOffset += baseFontSize * 1.4;

    // 5. Draw Address
    const addressText = opts.addressName || `📍 ${formatCoords(opts.latitude, opts.longitude)}`;
    ctx.font = `400 ${baseFontSize * 0.85}px "Plus Jakarta Sans", sans-serif`;
    ctx.fillStyle = '#E2E8F0';
    const maxWidth = W * 0.85;
    const words = addressText.split(' ');
    let line = '';
    const lineHeight = baseFontSize * 1.2;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, timeX + (W * 0.03), yOffset);
        line = words[n] + ' ';
        yOffset += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, timeX + (W * 0.03), yOffset);
    yOffset += lineHeight;

    // 6. Draw User Info (Name, ID, Divisi)
    ctx.fillStyle = '#10B981'; // Green accent
    ctx.font = `700 ${baseFontSize * 0.85}px "Plus Jakarta Sans", sans-serif`;
    const userInfo = `${opts.namaRelawan} (${opts.idRelawan}) — Divisi: ${opts.divisi}`;
    ctx.fillText(userInfo, timeX + (W * 0.03), yOffset);
    yOffset += baseFontSize * 1.2;

    // Draw the green line now that we know the final height
    const endLineY = yOffset;
    ctx.fillStyle = '#10B981'; // Green
    ctx.fillRect(lineX, startLineY, W * 0.01, endLineY - startLineY - (baseFontSize * 0.5));

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      'image/webp',
      0.6
    );
  });
};

/**
 * Compress image (JPG/PNG/WEBP) for faster upload using HTML5 Canvas
 */
export const compressImage = (file: File, quality: number = 0.7): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Optionally scale down if width > 1200
        const MAX_WIDTH = 1200;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
           reject(new Error('Canvas context is null'));
           return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // C4 Fix: Try WebP first, fall back to JPEG if browser doesn't support WebP encoding
        canvas.toBlob((blob) => {
          if (blob && blob.type === 'image/webp') {
            resolve(blob);
          } else {
            // Fallback: browser didn't produce WebP, try JPEG
            canvas.toBlob((jpegBlob) => {
              if (jpegBlob) resolve(jpegBlob);
              else reject(new Error('Canvas toBlob failed'));
            }, 'image/jpeg', quality);
          }
        }, 'image/webp', quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};


/**
 * Re-exported from admin-roles.ts — single source of truth for admin role checks.
 */
export { isAdminRole } from './admin-roles';
