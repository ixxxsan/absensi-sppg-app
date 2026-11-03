import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth-server';
import { isAdminRole } from '@/lib/utils';
import { db } from '@/lib/db';
import { menuHarian } from '@/lib/db/schema';
import { DISTRIBUSI_PHOTOS } from '@/lib/constants/laporan-mingguan';
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
  if (!url) return null;
  if (url.startsWith('data:image/')) {
    const commaIdx = url.indexOf(',');
    if (commaIdx !== -1) {
      try {
        return Buffer.from(url.substring(commaIdx + 1), 'base64');
      } catch (err) {
        console.error('Failed to parse base64 image data:', err);
        return null;
      }
    }
  }
  if (!url.startsWith('http')) return null;
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
    const dates: string[] = body.dates; // Full 5 days for range title
    const rawActiveDates: string[] = Array.isArray(body.activeDates) && body.activeDates.length > 0
      ? body.activeDates
      : dates;
    const customImages: {
      suratJalan?: string[];
      persiapan?: string[];
      pengolahan?: string[];
      pemorsian?: string[];
      distribusi?: string[];
      dokumentasiDistribusi?: string[];
    } = body.customImages || {};

    if (!Array.isArray(dates) || dates.length === 0) {
      return NextResponse.json({ error: 'Harap tentukan tanggal operasional.' }, { status: 400 });
    }

    // Filter valid active dates (skips days off)
    const activeDates = rawActiveDates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d));
    if (activeDates.length === 0) {
      return NextResponse.json({ error: 'Minimal harus ada 1 hari operasional.' }, { status: 400 });
    }

    // Fetch menus from DB for all referenced dates
    const allQueryDates = Array.from(new Set([...dates, ...activeDates]));
    const menus = await db
      .select()
      .from(menuHarian)
      .where(inArray(menuHarian.tanggal, allQueryDates));

    const menuMap = new Map(menus.map(m => [m.tanggal, m]));

    // Format active operational days (Pemberian Ke-1, Ke-2, etc. strictly sequential)
    const activeDaysData = activeDates.map((d, idx) => {
      const dayObj = dayjs(d).locale('id');
      const m = menuMap.get(d);
      return {
        dayIdx: idx,
        pemberianKe: idx + 1,
        dateStr: d,
        hariTanggalLengkap: dayObj.format('dddd, DD MMMM YYYY'),
        hariTanggalSingkat: dayObj.format('dddd, DD/MM/YYYY'),
        namaMenu: m?.namaMenu || DEFAULT_MENU_DOCX[idx % DEFAULT_MENU_DOCX.length],
        fotoSekolahPorsiBesarUrl: m?.fotoPorsiBesarUrl || '',
        fotoPosyanduBumilUrl: m?.fotoBumilUrl || '',
      };
    });

    const activeCount = activeDaysData.length;

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
    const endStr = dayjs(dates[dates.length - 1]).locale('id').format('DD MMMM YYYY');
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
    // Only includes active operational days; excess day-off rows are completely removed
    for (const tblIdx of [1, 2, 3]) {
      const tbl = tables[tblIdx] as any;
      if (!tbl) continue;
      const rows = Array.from(tbl.getElementsByTagName('w:tr')) as any[];
      for (let rIdx = 0; rIdx < Math.min(rows.length, activeCount); rIdx++) {
        const cells = rows[rIdx].getElementsByTagName('w:tc');
        if (cells.length >= 2) {
          const ps = cells[1].getElementsByTagName('w:p');
          if (ps.length > 0) {
            setParagraphText(ps[0], activeDaysData[rIdx].hariTanggalLengkap, true);
          }
        }
      }
      // Remove excess rows beyond activeCount
      for (let rIdx = rows.length - 1; rIdx >= activeCount; rIdx--) {
        if (rows[rIdx].parentNode) {
          tbl.removeChild(rows[rIdx]);
        }
      }
    }

    // 3. Update Table 2.2 (Tables 9, 10, 11, 12 in template)
    // Collect all 45 data rows across tables 9, 10, 11, 12
    const allTable22Rows: { tbl: any; tr: any }[] = [];
    const t9 = tables[9] as any;
    if (t9) {
      const r = t9.getElementsByTagName('w:tr');
      for (let i = 1; i < r.length; i++) allTable22Rows.push({ tbl: t9, tr: r[i] });
    }
    const t10 = tables[10] as any;
    if (t10) {
      const r = t10.getElementsByTagName('w:tr');
      for (let i = 0; i < r.length; i++) allTable22Rows.push({ tbl: t10, tr: r[i] });
    }
    const t11 = tables[11] as any;
    if (t11) {
      const r = t11.getElementsByTagName('w:tr');
      for (let i = 0; i < r.length; i++) allTable22Rows.push({ tbl: t11, tr: r[i] });
    }
    const t12 = tables[12] as any;
    if (t12) {
      const r = t12.getElementsByTagName('w:tr');
      for (let i = 0; i < r.length; i++) allTable22Rows.push({ tbl: t12, tr: r[i] });
    }

    // 5 groups of 9 institutions
    for (let g = 0; g < 5; g++) {
      const groupRows = allTable22Rows.slice(g * 9, (g + 1) * 9);
      if (g < activeCount) {
        // Active operational day: set Pemberian Ke- (g + 1)
        const dInfo = activeDaysData[g];
        const pemberianKeStr = (g + 1).toString();
        groupRows.forEach((item, rowIdx) => {
          const cells = item.tr.getElementsByTagName('w:tc');
          if (cells.length >= 5) {
            setCellText(cells[2], pemberianKeStr);
            if (rowIdx === 0 || rowIdx === 4 || (g === 3 && rowIdx === 6)) {
              setCellText(cells[3], dInfo.hariTanggalLengkap);
              setCellText(cells[4], dInfo.namaMenu);
            } else {
              setCellText(cells[3], '');
              setCellText(cells[4], '');
            }
          }
        });
      } else {
        // Day-off / inactive group: remove rows completely so no table exists for this day
        groupRows.forEach(item => {
          if (item.tr.parentNode) {
            item.tbl.removeChild(item.tr);
          }
        });
      }
    }

    // If activeCount === 4: merge Day 4 rows (3 rows from t12) into t11 so all 9 institutions fit on 1 page cleanly
    if (activeCount === 4 && t11 && t12) {
      const r12 = Array.from(t12.getElementsByTagName('w:tr')) as any[];
      for (let i = 0; i < 3; i++) {
        if (r12[i]) {
          t11.appendChild(r12[i]);
        }
      }
    }

    // Remove any table in 9..12 that now has 0 rows and remove its preceding section break paragraph
    for (const tbl of [tables[9], tables[10], tables[11], tables[12]] as any[]) {
      if (tbl && tbl.getElementsByTagName('w:tr').length === 0 && tbl.parentNode) {
        let pBefore = tbl.previousSibling;
        while (pBefore && pBefore.nodeName !== 'w:p') pBefore = pBefore.previousSibling;
        if (pBefore && pBefore.getElementsByTagName('w:sectPr').length > 0 && pBefore.parentNode) {
          pBefore.parentNode.removeChild(pBefore);
        }
        tbl.parentNode.removeChild(tbl);
      }
    }

    // 4. Update Table 2.3 (Sekolah) and Table 2.4 (Posyandu)
    const sekolahRows: { tbl: any; tr: any }[] = [];
    const t13 = tables[13] as any;
    if (t13) {
      const r = t13.getElementsByTagName('w:tr');
      if (r[1]) sekolahRows.push({ tbl: t13, tr: r[1] });
      if (r[2]) sekolahRows.push({ tbl: t13, tr: r[2] });
      if (r[3]) sekolahRows.push({ tbl: t13, tr: r[3] });
    }
    const t14 = tables[14] as any;
    if (t14) {
      const r = t14.getElementsByTagName('w:tr');
      if (r[0]) sekolahRows.push({ tbl: t14, tr: r[0] });
      if (r[1]) sekolahRows.push({ tbl: t14, tr: r[1] });
    }

    const posyanduRows: { tbl: any; tr: any }[] = [];
    const t15 = tables[15] as any;
    if (t15) {
      const r = t15.getElementsByTagName('w:tr');
      if (r[1]) posyanduRows.push({ tbl: t15, tr: r[1] });
      if (r[2]) posyanduRows.push({ tbl: t15, tr: r[2] });
      if (r[3]) posyanduRows.push({ tbl: t15, tr: r[3] });
    }
    const t16 = tables[16] as any;
    if (t16) {
      const r = t16.getElementsByTagName('w:tr');
      if (r[0]) posyanduRows.push({ tbl: t16, tr: r[0] });
      if (r[1]) posyanduRows.push({ tbl: t16, tr: r[1] });
    }

    // When activeCount === 4: merge row 4 (Kamis) into t13 and t15 so all 4 days fit on 1 single page without awkward 1-row overflow
    if (activeCount === 4) {
      if (sekolahRows[3] && t13) {
        t13.appendChild(sekolahRows[3].tr);
        sekolahRows[3].tbl = t13;
      }
      if (posyanduRows[3] && t15) {
        t15.appendChild(posyanduRows[3].tr);
        posyanduRows[3].tbl = t15;
      }
    }

    // Populate active rows
    for (let i = 0; i < activeCount; i++) {
      const d = activeDaysData[i];
      if (sekolahRows[i]) {
        const c = sekolahRows[i].tr.getElementsByTagName('w:tc');
        if (c.length >= 2) {
          setCellText(c[0], d.namaMenu);
          setCellText(c[1], d.hariTanggalSingkat);
        }
      }
      if (posyanduRows[i]) {
        const c = posyanduRows[i].tr.getElementsByTagName('w:tc');
        if (c.length >= 2) {
          setCellText(c[0], d.namaMenu);
          setCellText(c[1], d.hariTanggalSingkat);
        }
      }
    }

    // Remove inactive day-off rows completely
    for (let i = 4; i >= activeCount; i--) {
      if (sekolahRows[i] && sekolahRows[i].tr.parentNode) {
        sekolahRows[i].tbl.removeChild(sekolahRows[i].tr);
      }
      if (posyanduRows[i] && posyanduRows[i].tr.parentNode) {
        posyanduRows[i].tbl.removeChild(posyanduRows[i].tr);
      }
    }

    // When t14 has 0 rows, remove it AND its preceding section break paragraph to eliminate the ghost blank page
    if (t14 && t14.getElementsByTagName('w:tr').length === 0 && t14.parentNode) {
      let pBefore = t14.previousSibling;
      while (pBefore && pBefore.nodeName !== 'w:p') pBefore = pBefore.previousSibling;
      if (pBefore && pBefore.getElementsByTagName('w:sectPr').length > 0 && pBefore.parentNode) {
        pBefore.parentNode.removeChild(pBefore);
      }
      t14.parentNode.removeChild(t14);
    }

    // When t16 has 0 rows, remove it AND its preceding section break paragraph to eliminate the ghost blank page
    if (t16 && t16.getElementsByTagName('w:tr').length === 0 && t16.parentNode) {
      let pBefore = t16.previousSibling;
      while (pBefore && pBefore.nodeName !== 'w:p') pBefore = pBefore.previousSibling;
      if (pBefore && pBefore.getElementsByTagName('w:sectPr').length > 0 && pBefore.parentNode) {
        pBefore.parentNode.removeChild(pBefore);
      }
      t16.parentNode.removeChild(t16);
    }

    // 5. Separate Posyandu (Table 2.4) relationship IDs (rId106 - rId110)
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

    for (let i = 0; i < Math.min(posyanduRows.length, activeCount); i++) {
      if (posyanduRows[i]?.tr) {
        setBlipEmbed(posyanduRows[i].tr, posyanduRelIds[i]);
      }
    }

    // 6. Update Closing Date Paragraph: "Teluk Naga, [Last Active Date]"
    const lastActiveDate = activeDaysData[activeCount - 1].dateStr;
    const closingDateStr = `Teluk Naga, ${dayjs(lastActiveDate).locale('id').format('DD MMMM YYYY')}`;
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

    // 7. Update Food Images in word/media/ for active operational days only
    const sekolahReplacements = activeDaysData.map((d, i) => ({
      media: `word/media/image${27 + i}.png`,
      url: d.fotoSekolahPorsiBesarUrl,
    }));

    const posyanduReplacements = activeDaysData.map((d, i) => ({
      media: `word/media/posyandu_day_${i + 1}.png`,
      url: d.fotoPosyanduBumilUrl,
      fallback: i === 4 ? 'word/media/image32.png' : `word/media/image${27 + i}.png`,
    }));

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
        const fb = zip.file(item.fallback);
        if (fb) {
          const fbData = await fb.async('nodebuffer');
          zip.file(item.media, fbData);
          return getImageDimensions(fbData);
        }
        return null;
      })
    );

    // 8. Fix Image Drawings in Table 2.3 & 2.4:
    // Remove crop settings (<a:srcRect>) and preserve natural aspect ratio
    for (let i = 0; i < activeCount; i++) {
      if (sekolahRows[i]) {
        fixRowImageDrawing(sekolahRows[i].tr, sekolahDimensions[i]);
      }
      if (posyanduRows[i]) {
        fixRowImageDrawing(posyanduRows[i].tr, posyanduDimensions[i]);
      }
    }

    // 9. Update Custom Dropped Images (if provided by user):
    // Persiapan (Table 1: image2.jpeg .. image6.jpeg)
    if (Array.isArray(customImages.persiapan)) {
      for (let i = 0; i < Math.min(customImages.persiapan.length, 5); i++) {
        if (customImages.persiapan[i]) {
          const buf = await fetchImageBuffer(customImages.persiapan[i]);
          if (buf) zip.file(`word/media/image${2 + i}.jpeg`, buf);
        }
      }
    }

    // Pengolahan (Table 2: image7.jpeg .. image11.jpeg)
    if (Array.isArray(customImages.pengolahan)) {
      for (let i = 0; i < Math.min(customImages.pengolahan.length, 5); i++) {
        if (customImages.pengolahan[i]) {
          const buf = await fetchImageBuffer(customImages.pengolahan[i]);
          if (buf) zip.file(`word/media/image${7 + i}.jpeg`, buf);
        }
      }
    }

    // Pemorsian & Packing (Table 3: image12.jpeg .. image16.jpeg)
    if (Array.isArray(customImages.pemorsian)) {
      for (let i = 0; i < Math.min(customImages.pemorsian.length, 5); i++) {
        if (customImages.pemorsian[i]) {
          const buf = await fetchImageBuffer(customImages.pemorsian[i]);
          if (buf) zip.file(`word/media/image${12 + i}.jpeg`, buf);
        }
      }
    }

    // Distribusi (Section 4: image17.jpeg & image18.jpeg)
    if (Array.isArray(customImages.distribusi)) {
      if (customImages.distribusi[0]) {
        const buf = await fetchImageBuffer(customImages.distribusi[0]);
        if (buf) zip.file('word/media/image17.jpeg', buf);
      }
      if (customImages.distribusi[1]) {
        const buf = await fetchImageBuffer(customImages.distribusi[1]);
        if (buf) zip.file('word/media/image18.jpeg', buf);
      }
    }

    // Dokumentasi Distribusi Sekolah dan Posyandu (Table 17: DISTRIBUSI_PHOTOS)
    if (Array.isArray(customImages.dokumentasiDistribusi)) {
      for (let i = 0; i < Math.min(customImages.dokumentasiDistribusi.length, DISTRIBUSI_PHOTOS.length); i++) {
        if (customImages.dokumentasiDistribusi[i]) {
          const buf = await fetchImageBuffer(customImages.dokumentasiDistribusi[i]);
          if (buf) zip.file(`word/media/${DISTRIBUSI_PHOTOS[i]}`, buf);
        }
      }
    }

    // Dokumentasi Surat Jalan Sekolah dan Posyandu (Table 18, 19, 20: image40.jpeg .. image81.jpeg)
    if (Array.isArray(customImages.suratJalan) && customImages.suratJalan.length > 0) {
      for (let i = 0; i < Math.min(customImages.suratJalan.length, 42); i++) {
        if (customImages.suratJalan[i]) {
          const buf = await fetchImageBuffer(customImages.suratJalan[i]);
          if (buf) zip.file(`word/media/image${40 + i}.jpeg`, buf);
        }
      }
    }

    // 7. Clean redundant empty spacer paragraphs that cause mid-page drift & awkward whitespace gaps
    const docBody = doc.getElementsByTagName('w:body')[0];
    if (docBody) {
      const allPs = Array.from(docBody.childNodes).filter((n: any) => n.nodeName === 'w:p') as any[];
      for (const p of allPs) {
        const text = (p.textContent || '').trim();
        const hasDrawings = p.getElementsByTagName('w:drawing').length > 0;
        const hasSectPr = p.getElementsByTagName('w:sectPr').length > 0;
        const hasBrPage = Array.from(p.getElementsByTagName('w:br')).some((b: any) => b.getAttribute('w:type') === 'page');

        if (!text && !hasDrawings && !hasSectPr && !hasBrPage) {
          if (p.parentNode === docBody) {
            docBody.removeChild(p);
          }
        }
      }

      // Ensure key chapter and section headers always start crisp at the top of a new page
      const ensurePageBreakBefore = (titleText: string) => {
        const ps = Array.from(docBody.getElementsByTagName('w:p')) as any[];
        for (let i = 0; i < ps.length; i++) {
          const p = ps[i];
          if (p.textContent && p.textContent.includes(titleText)) {
            let pPr = p.getElementsByTagName('w:pPr')[0];
            if (!pPr) {
              pPr = doc.createElement('w:pPr');
              p.insertBefore(pPr, p.firstChild);
            }
            if (pPr.getElementsByTagName('w:pageBreakBefore').length === 0) {
              pPr.appendChild(doc.createElement('w:pageBreakBefore'));
            }
            break;
          }
        }
      };

      ensurePageBreakBefore('BAB II PELAKSANAAN KEGIATAN');
      ensurePageBreakBefore('C. Pelaksaan');
      ensurePageBreakBefore('Tabel 2.3');
      ensurePageBreakBefore('Dokumentasi Surat Jalan');
      ensurePageBreakBefore('BAB IV PENUTUP');
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

    const safeFilename = `Laporan_Mingguan_MBG_${dates[0]}_sd_${dates[dates.length - 1]}.docx`;

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
