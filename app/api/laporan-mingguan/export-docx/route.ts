import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { isAdminRole } from '@/lib/utils';
import { db } from '@/lib/db';
import { menuHarian } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import path from 'path';
import fs from 'fs/promises';
import JSZip from 'jszip';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import dayjs from 'dayjs';
import 'dayjs/locale/id';

dayjs.locale('id');

const DEFAULT_MENU_DOCX = [
  'Nasi Putih, Chicken Teriyaki, Tahu Cabai Garam, Capcay, Semangka',
  'Nasi Putih, Sate Taichan, Tahu Crispy, Tumis Wortel & Jagung, Kelengkeng',
  'Nasi Putih, Ayam Lada Hitam, Steam Tofu, Sup Kimlo, Semangka',
  'Nasi Putih, Steam Fuyunghai, Tempe Crispy, Nutrijell Strawberry, Anggur Hitam',
  'Kentang Goreng, Dimsum, Kacang Polong, Mix Vegetables, Anggur Merah, Susu Full Cream',
];

/**
 * Cleanly sets cell text without leaving old paragraphs or runs.
 * Prevents duplicate/stacked text from appearing in Word cells.
 */
function setCellText(cell: unknown, newText: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = cell as any;
  if (!c || !c.ownerDocument) return;

  const doc = c.ownerDocument;
  const ps = Array.from(c.getElementsByTagName('w:p')) as Element[];

  if (ps.length === 0) {
    const newP = doc.createElement('w:p');
    const newR = doc.createElement('w:r');
    const newT = doc.createElement('w:t');
    newT.textContent = newText;
    newR.appendChild(newT);
    newP.appendChild(newR);
    c.appendChild(newP);
    return;
  }

  // Target the first paragraph
  const targetP = ps[0];

  // Remove all other paragraphs in this cell so old text NEVER persists
  for (let i = 1; i < ps.length; i++) {
    c.removeChild(ps[i]);
  }

  // Remove all children of targetP except w:pPr (to preserve paragraph alignment/spacing)
  const children = Array.from(targetP.childNodes);
  for (const child of children) {
    if (child.nodeName !== 'w:pPr') {
      targetP.removeChild(child);
    }
  }

  // Add clean run with new text
  const r = doc.createElement('w:r');
  const t = doc.createElement('w:t');
  t.textContent = newText;
  r.appendChild(t);
  targetP.appendChild(r);
}

/**
 * Updates a specific paragraph's text (e.g. date heading in process tables)
 * while preserving its paragraph properties (w:pPr) and bold styling.
 */
function setParagraphText(p: unknown, newText: string, isBold: boolean = true) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pNode = p as any;
  if (!pNode || !pNode.ownerDocument) return;

  const doc = pNode.ownerDocument;

  // Remove all children of pNode except w:pPr
  const children = Array.from(pNode.childNodes) as Element[];
  for (const child of children) {
    if (child.nodeName !== 'w:pPr') {
      pNode.removeChild(child);
    }
  }

  // Create clean run with bold
  const r = doc.createElement('w:r');
  const rPr = doc.createElement('w:rPr');
  if (isBold) {
    rPr.appendChild(doc.createElement('w:b'));
    rPr.appendChild(doc.createElement('w:bCs'));
  }
  r.appendChild(rPr);
  const t = doc.createElement('w:t');
  t.textContent = newText;
  r.appendChild(t);
  pNode.appendChild(r);
}

/**
 * Parses width and height from PNG, JPEG, or WebP buffer without external dependencies.
 */
function getImageDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (!buffer || buffer.length < 30) return null;
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    if (width > 0 && height > 0) return { width, height };
  }
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length - 8) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buffer.readUInt16BE(offset + 5);
        const width = buffer.readUInt16BE(offset + 7);
        if (width > 0 && height > 0) return { width, height };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  // WebP: RIFF .... WEBP
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const type = buffer.toString('ascii', 12, 16);
    if (type === 'VP8 ' && buffer.length >= 30) {
      const width = buffer.readUInt16LE(26) & 0x3fff;
      const height = buffer.readUInt16LE(28) & 0x3fff;
      if (width > 0 && height > 0) return { width, height };
    } else if (type === 'VP8L' && buffer.length >= 25) {
      const b1 = buffer[21], b2 = buffer[22], b3 = buffer[23], b4 = buffer[24];
      const width = 1 + (((b2 & 0x3f) << 8) | b1);
      const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
      if (width > 0 && height > 0) return { width, height };
    } else if (type === 'VP8X' && buffer.length >= 30) {
      const width = 1 + (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16));
      const height = 1 + (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16));
      if (width > 0 && height > 0) return { width, height };
    }
  }
  return null;
}

/**
 * Removes Word template crop settings (<a:srcRect>) and adjusts cx/cy
 * to preserve the natural aspect ratio of the uploaded food photo.
 */
function fixRowImageDrawing(row: unknown, imgDimensions: { width: number; height: number } | null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = row as any;
  if (!r) return;

  // 1. Remove ALL a:srcRect cropping tags from this row (master template crops bottom by 35%)
  const srcRects = Array.from(r.getElementsByTagName('a:srcRect')) as Element[];
  for (const sr of srcRects) {
    if (sr.parentNode) {
      sr.parentNode.removeChild(sr);
    }
  }

  // 2. Adjust cx and cy to preserve natural aspect ratio without stretching
  const maxCx = 2400000; // ~6.67 cm (fits cleanly within 5906 dxa cell)
  const maxCy = 1800000; // ~5.00 cm
  let finalCx = maxCx;
  let finalCy = maxCy;

  if (imgDimensions && imgDimensions.width > 0 && imgDimensions.height > 0) {
    const aspect = imgDimensions.width / imgDimensions.height;
    if (aspect >= maxCx / maxCy) {
      finalCx = maxCx;
      finalCy = Math.round(maxCx / aspect);
    } else {
      finalCy = maxCy;
      finalCx = Math.round(maxCy * aspect);
    }
  } else {
    // Default food tray landscape proportion (4:3)
    finalCx = 2400000;
    finalCy = 1800000;
  }

  const extents = r.getElementsByTagName('wp:extent');
  for (let i = 0; i < extents.length; i++) {
    extents[i].setAttribute('cx', finalCx.toString());
    extents[i].setAttribute('cy', finalCy.toString());
  }

  const aExts = r.getElementsByTagName('a:ext');
  for (let i = 0; i < aExts.length; i++) {
    if (aExts[i].getAttribute('cx')) {
      aExts[i].setAttribute('cx', finalCx.toString());
      aExts[i].setAttribute('cy', finalCy.toString());
    }
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const arrayBuf = await res.arrayBuffer();
    return Buffer.from(arrayBuf);
  } catch (e) {
    console.error('Failed to fetch image buffer for docx:', url, e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!isAdminRole(session?.user?.role)) {
      return NextResponse.json({ error: 'Unauthorized: Hanya admin yang dapat mengekspor laporan.' }, { status: 403 });
    }

    const body = await req.json();
    const dates: string[] = body.dates;

    if (!Array.isArray(dates) || dates.length !== 5) {
      return NextResponse.json({ error: 'Harap tentukan 5 hari kerja operasional.' }, { status: 400 });
    }

    // Fetch menus from DB
    const menus = await db
      .select()
      .from(menuHarian)
      .where(inArray(menuHarian.tanggal, dates));

    const menuMap = new Map(menus.map(m => [m.tanggal, m]));

    // Format 5 operational days
    // Each chosen date maps to Pemberian Ke-1 s/d Ke-5 in exact selected order
    const daysData = dates.map((d, idx) => {
      const dayObj = dayjs(d).locale('id');
      const m = menuMap.get(d);
      return {
        dayIdx: idx,
        pemberianKe: idx + 1,
        dateStr: d,
        hariTanggalLengkap: dayObj.format('dddd, DD MMMM YYYY'),
        hariTanggalSingkat: dayObj.format('dddd, DD/MM/YYYY'),
        namaMenu: m?.namaMenu || DEFAULT_MENU_DOCX[idx],
        fotoSekolahPorsiBesarUrl: m?.fotoPorsiBesarUrl || '',
        fotoPosyanduBumilUrl: m?.fotoBumilUrl || '',
      };
    });

    // Read template
    const templatePath = path.join(process.cwd(), 'templates', 'Laporan_Pelaksanaan_Program_MBG_Master.docx');
    const templateBytes = await fs.readFile(templatePath);
    const zip = await JSZip.loadAsync(templateBytes);

    const docXmlStr = await zip.file('word/document.xml')?.async('string');
    const relsXmlStr = await zip.file('word/_rels/document.xml.rels')?.async('string');
    if (!docXmlStr || !relsXmlStr) {
      return NextResponse.json({ error: 'Template Word tidak valid.' }, { status: 500 });
    }

    const doc = new DOMParser().parseFromString(docXmlStr, 'text/xml');
    const relsDoc = new DOMParser().parseFromString(relsXmlStr, 'text/xml');
    const tables = doc.getElementsByTagName('w:tbl');

    // 1. Update Title Date: "LAPORAN MINGGUAN [Start] – [End]"
    const startStr = dayjs(dates[0]).locale('id').format('DD MMMM');
    const endStr = dayjs(dates[4]).locale('id').format('DD MMMM YYYY');
    const newTitle = `LAPORAN MINGGUAN ${startStr} – ${endStr}`;

    const paragraphs = doc.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const text = p.textContent || '';
      if (text.includes('LAPORAN MINGGUAN')) {
        const runs = Array.from(p.getElementsByTagName('w:r'));
        if (runs.length > 0) {
          const firstRun = runs[0];
          let t = firstRun.getElementsByTagName('w:t')[0];
          if (!t) {
            t = doc.createElement('w:t');
            firstRun.appendChild(t);
          }
          t.textContent = newTitle;
          for (let rIdx = 1; rIdx < runs.length; rIdx++) {
            p.removeChild(runs[rIdx]);
          }
        }
        break;
      }
    }

    // 2. Update Dates in Lampiran Kegiatan:
    // Table 1 (1. Persiapan), Table 2 (2. Pengolahan), Table 3 (3. Pemorsian dan Packing)
    // Each row's first paragraph (p[0]) in cell 1 holds the day's date
    for (const tblIdx of [1, 2, 3]) {
      const tbl = tables[tblIdx];
      if (!tbl) continue;
      const rows = tbl.getElementsByTagName('w:tr');
      for (let rIdx = 0; rIdx < Math.min(rows.length, 5); rIdx++) {
        const cells = rows[rIdx].getElementsByTagName('w:tc');
        if (cells.length >= 2) {
          const ps = cells[1].getElementsByTagName('w:p');
          if (ps.length > 0) {
            setParagraphText(ps[0], daysData[rIdx].hariTanggalLengkap, true);
          }
        }
      }
    }

    // 3. Update Table 2.2 (Tables 9, 10, 11, 12 in template)
    // Clear all old paragraphs properly to prevent doubled text
    // Matches Pemberian Ke- (1..5) directly to daysData[keNum - 1]
    for (const tblIdx of [9, 10, 11, 12]) {
      const tbl = tables[tblIdx];
      if (!tbl) continue;
      const rows = tbl.getElementsByTagName('w:tr');
      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const cells = rows[rIdx].getElementsByTagName('w:tc');
        if (cells.length >= 5) {
          const keText = cells[2].textContent?.trim() || '';
          const keNum = parseInt(keText, 10);
          if (keNum >= 1 && keNum <= 5) {
            const hasExistingDateOrMenu =
              (cells[3].textContent?.trim().length ?? 0) > 0 ||
              (cells[4].textContent?.trim().length ?? 0) > 0;
            if (hasExistingDateOrMenu) {
              const dInfo = daysData[keNum - 1];
              setCellText(cells[3], dInfo.hariTanggalLengkap);
              setCellText(cells[4], dInfo.namaMenu);
            }
          }
        }
      }
    }

    // 4. Update Table 2.3 (Sekolah): Table 13 (Row 1..3) & Table 14 (Row 0..1)
    const t13 = tables[13];
    if (t13) {
      const r13 = t13.getElementsByTagName('w:tr');
      if (r13[1]) {
        const c = r13[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[0].namaMenu); setCellText(c[1], daysData[0].hariTanggalSingkat); }
      }
      if (r13[2]) {
        const c = r13[2].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[1].namaMenu); setCellText(c[1], daysData[1].hariTanggalSingkat); }
      }
      if (r13[3]) {
        const c = r13[3].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[2].namaMenu); setCellText(c[1], daysData[2].hariTanggalSingkat); }
      }
    }
    const t14 = tables[14];
    if (t14) {
      const r14 = t14.getElementsByTagName('w:tr');
      if (r14[0]) {
        const c = r14[0].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[3].namaMenu); setCellText(c[1], daysData[3].hariTanggalSingkat); }
      }
      if (r14[1]) {
        const c = r14[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[4].namaMenu); setCellText(c[1], daysData[4].hariTanggalSingkat); }
      }
    }

    // 5. Update Table 2.4 (Posyandu): Table 15 (Row 1..3) & Table 16 (Row 0..1)
    const t15 = tables[15];
    if (t15) {
      const r15 = t15.getElementsByTagName('w:tr');
      if (r15[1]) {
        const c = r15[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[0].namaMenu); setCellText(c[1], daysData[0].hariTanggalSingkat); }
      }
      if (r15[2]) {
        const c = r15[2].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[1].namaMenu); setCellText(c[1], daysData[1].hariTanggalSingkat); }
      }
      if (r15[3]) {
        const c = r15[3].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[2].namaMenu); setCellText(c[1], daysData[2].hariTanggalSingkat); }
      }
    }
    const t16 = tables[16];
    if (t16) {
      const r16 = t16.getElementsByTagName('w:tr');
      if (r16[0]) {
        const c = r16[0].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[3].namaMenu); setCellText(c[1], daysData[3].hariTanggalSingkat); }
      }
      if (r16[1]) {
        const c = r16[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[4].namaMenu); setCellText(c[1], daysData[4].hariTanggalSingkat); }
      }
    }

    // 6. Separate Posyandu (Table 2.4) relationship IDs (rId106 - rId110)
    // Standard OpenXML sequential numeric IDs
    const relsRoot = relsDoc.documentElement;
    if (!relsRoot) {
      return NextResponse.json({ error: 'Relasi Word tidak valid.' }, { status: 500 });
    }
    const posyanduRelIds = ['rId106', 'rId107', 'rId108', 'rId109', 'rId110'];
    posyanduRelIds.forEach((rid, i) => {
      let exists = false;
      const childRels = relsDoc.getElementsByTagName('Relationship');
      for (let j = 0; j < childRels.length; j++) {
        if (childRels[j].getAttribute('Id') === rid) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        const newRel = relsDoc.createElement('Relationship');
        newRel.setAttribute('Id', rid);
        newRel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image');
        newRel.setAttribute('Target', `media/posyandu_day_${i + 1}.png`);
        relsRoot.appendChild(newRel);
      }
    });

    const setBlipEmbed = (row: unknown, relId: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blips = (row as any).getElementsByTagName('a:blip');
      if (blips.length > 0) {
        blips[0].setAttribute('r:embed', relId);
      }
    };

    if (t15) {
      const r15 = t15.getElementsByTagName('w:tr');
      if (r15[1]) setBlipEmbed(r15[1], posyanduRelIds[0]);
      if (r15[2]) setBlipEmbed(r15[2], posyanduRelIds[1]);
      if (r15[3]) setBlipEmbed(r15[3], posyanduRelIds[2]);
    }
    if (t16) {
      const r16 = t16.getElementsByTagName('w:tr');
      if (r16[0]) setBlipEmbed(r16[0], posyanduRelIds[3]);
      if (r16[1]) setBlipEmbed(r16[1], posyanduRelIds[4]);
    }

    // 7. Update Closing Date Paragraph: "Teluk Naga, 04 September 2026"
    const closingDateStr = `Teluk Naga, ${dayjs(dates[4]).locale('id').format('DD MMMM YYYY')}`;
    for (let i = paragraphs.length - 1; i >= Math.max(0, paragraphs.length - 20); i--) {
      const p = paragraphs[i];
      const text = p.textContent || '';
      if (text.includes('Teluk Naga,')) {
        const runs = Array.from(p.getElementsByTagName('w:r'));
        if (runs.length > 0) {
          const firstRun = runs[0];
          let t = firstRun.getElementsByTagName('w:t')[0];
          if (!t) {
            t = doc.createElement('w:t');
            firstRun.appendChild(t);
          }
          t.textContent = closingDateStr;
          for (let rIdx = 1; rIdx < runs.length; rIdx++) {
            p.removeChild(runs[rIdx]);
          }
        }
        break;
      }
    }

    // 8. Update Food Images in word/media/
    // Strictly:
    // Tabel 2.3 (Sekolah) strictly uses Porsi Besar (fotoPorsiBesarUrl) -> image27.png .. image31.png
    // Tabel 2.4 (Posyandu) strictly uses Porsi Bumil/Busui (fotoBumilUrl) -> posyandu_day_1.png .. posyandu_day_5.png
    const sekolahReplacements = [
      { media: 'word/media/image27.png', url: daysData[0].fotoSekolahPorsiBesarUrl },
      { media: 'word/media/image28.png', url: daysData[1].fotoSekolahPorsiBesarUrl },
      { media: 'word/media/image29.png', url: daysData[2].fotoSekolahPorsiBesarUrl },
      { media: 'word/media/image30.png', url: daysData[3].fotoSekolahPorsiBesarUrl },
      { media: 'word/media/image31.png', url: daysData[4].fotoSekolahPorsiBesarUrl },
    ];

    const posyanduReplacements = [
      { media: 'word/media/posyandu_day_1.png', url: daysData[0].fotoPosyanduBumilUrl, fallback: 'word/media/image27.png' },
      { media: 'word/media/posyandu_day_2.png', url: daysData[1].fotoPosyanduBumilUrl, fallback: 'word/media/image28.png' },
      { media: 'word/media/posyandu_day_3.png', url: daysData[2].fotoPosyanduBumilUrl, fallback: 'word/media/image29.png' },
      { media: 'word/media/posyandu_day_4.png', url: daysData[3].fotoPosyanduBumilUrl, fallback: 'word/media/image30.png' },
      { media: 'word/media/posyandu_day_5.png', url: daysData[4].fotoPosyanduBumilUrl, fallback: 'word/media/image32.png' },
    ];

    // Download & replace Sekolah (Porsi Besar) + record image dimensions
    const sekolahDimensions = await Promise.all(
      sekolahReplacements.map(async item => {
        if (item.url) {
          const buf = await fetchImageBuffer(item.url);
          if (buf) {
            zip.file(item.media, buf);
            return getImageDimensions(buf);
          }
        }
        // Fallback: read existing image from zip so dimensions are known
        const existing = zip.file(item.media);
        if (existing) {
          const buf = await existing.async('nodebuffer');
          return getImageDimensions(buf);
        }
        return null;
      })
    );

    // Download & replace Posyandu (Porsi Bumil/Busui) + record image dimensions
    const posyanduDimensions = await Promise.all(
      posyanduReplacements.map(async item => {
        if (item.url) {
          const buf = await fetchImageBuffer(item.url);
          if (buf) {
            zip.file(item.media, buf);
            return getImageDimensions(buf);
          }
        }
        // Fallback to default image in template if bumil url not yet uploaded
        const fb = zip.file(item.fallback);
        if (fb) {
          const fbData = await fb.async('nodebuffer');
          zip.file(item.media, fbData);
          return getImageDimensions(fbData);
        }
        return null;
      })
    );

    // 9. Fix Image Drawings in Table 2.3 & 2.4:
    // Remove crop settings (<a:srcRect>) and preserve natural aspect ratio
    if (t13) {
      const r13 = t13.getElementsByTagName('w:tr');
      if (r13[1]) fixRowImageDrawing(r13[1], sekolahDimensions[0]);
      if (r13[2]) fixRowImageDrawing(r13[2], sekolahDimensions[1]);
      if (r13[3]) fixRowImageDrawing(r13[3], sekolahDimensions[2]);
    }
    if (t14) {
      const r14 = t14.getElementsByTagName('w:tr');
      if (r14[0]) fixRowImageDrawing(r14[0], sekolahDimensions[3]);
      if (r14[1]) fixRowImageDrawing(r14[1], sekolahDimensions[4]);
    }

    if (t15) {
      const r15 = t15.getElementsByTagName('w:tr');
      if (r15[1]) fixRowImageDrawing(r15[1], posyanduDimensions[0]);
      if (r15[2]) fixRowImageDrawing(r15[2], posyanduDimensions[1]);
      if (r15[3]) fixRowImageDrawing(r15[3], posyanduDimensions[2]);
    }
    if (t16) {
      const r16 = t16.getElementsByTagName('w:tr');
      if (r16[0]) fixRowImageDrawing(r16[0], posyanduDimensions[3]);
      if (r16[1]) fixRowImageDrawing(r16[1], posyanduDimensions[4]);
    }

    // Save modified XML and rels back into the zip
    const serializer = new XMLSerializer();
    zip.file('word/document.xml', serializer.serializeToString(doc));
    zip.file('word/_rels/document.xml.rels', serializer.serializeToString(relsDoc));

    // Generate output DOCX
    const outputBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const safeFilename = `Laporan_Mingguan_MBG_${dates[0]}_sd_${dates[4]}.docx`;

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
        'Content-Length': outputBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating weekly report docx:', error);
    return NextResponse.json({ error: 'Gagal membuat file laporan Word.' }, { status: 500 });
  }
}
