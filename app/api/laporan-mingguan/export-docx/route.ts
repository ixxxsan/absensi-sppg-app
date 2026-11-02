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

function setCellText(cell: unknown, newText: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = cell as any;
  const p = c.getElementsByTagName('w:p')[0];
  if (!p || !c.ownerDocument) return;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const runs = Array.from(p.getElementsByTagName('w:r')) as any[];
  if (runs.length > 0) {
    const firstRun = runs[0];
    let t = firstRun.getElementsByTagName('w:t')[0];
    if (!t) {
      t = c.ownerDocument.createElement('w:t');
      firstRun.appendChild(t);
    }
    t.textContent = newText;
    // Remove subsequent runs so old text doesn't persist
    for (let i = 1; i < runs.length; i++) {
      p.removeChild(runs[i]);
    }
  } else {
    const r = c.ownerDocument.createElement('w:r');
    const t = c.ownerDocument.createElement('w:t');
    t.textContent = newText;
    r.appendChild(t);
    p.appendChild(r);
  }
}

async function fetchImageBuffer(url: string): Promise<Buffer | null> {
  if (!url || !url.startsWith('http')) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
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
      return NextResponse.json({ error: 'Harap tentukan 5 hari kerja (Senin - Jumat).' }, { status: 400 });
    }

    // Fetch menus from DB
    const menus = await db
      .select()
      .from(menuHarian)
      .where(inArray(menuHarian.tanggal, dates));

    const menuMap = new Map(menus.map(m => [m.tanggal, m]));

    // Format days
    // Requirement:
    // Tabel 2.3 (Sekolah): strictly from Porsi Besar (fotoPorsiBesarUrl)
    // Tabel 2.4 (Posyandu): strictly from Porsi Bumil/Busui (fotoBumilUrl)
    const daysData = dates.map((d, idx) => {
      const dayObj = dayjs(d).locale('id');
      const m = menuMap.get(d);
      return {
        dayIdx: idx,
        pemberianKe: idx + 1,
        dateStr: d,
        hariTanggalLengkap: dayObj.format('dddd, DD MMMM YYYY'),
        hariTanggalSingkat: dayObj.format('dddd, DD/MM/YYYY'),
        namaMenu: m?.namaMenu || 'Menu belum ditentukan',
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

    // 2. Update Table 2.2 (Tables 9, 10, 11, 12 in template)
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
            const hasExistingDateOrMenu = (cells[3].textContent?.trim().length ?? 0) > 0 || (cells[4].textContent?.trim().length ?? 0) > 0;
            if (hasExistingDateOrMenu) {
              const dInfo = daysData[keNum - 1];
              setCellText(cells[3], dInfo.hariTanggalLengkap);
              setCellText(cells[4], dInfo.namaMenu);
            }
          }
        }
      }
    }

    // 3. Update Table 2.3 (Sekolah): Table 13 (Row 1..3) & Table 14 (Row 0..1)
    const t13 = tables[13];
    if (t13) {
      const r13 = t13.getElementsByTagName('w:tr');
      // Row 1: Day 1 (Senin)
      if (r13[1]) {
        const c = r13[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[0].namaMenu); setCellText(c[1], daysData[0].hariTanggalSingkat); }
      }
      // Row 2: Day 2 (Selasa)
      if (r13[2]) {
        const c = r13[2].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[1].namaMenu); setCellText(c[1], daysData[1].hariTanggalSingkat); }
      }
      // Row 3: Day 3 (Rabu)
      if (r13[3]) {
        const c = r13[3].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[2].namaMenu); setCellText(c[1], daysData[2].hariTanggalSingkat); }
      }
    }
    const t14 = tables[14];
    if (t14) {
      const r14 = t14.getElementsByTagName('w:tr');
      // Row 0: Day 4 (Kamis)
      if (r14[0]) {
        const c = r14[0].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[3].namaMenu); setCellText(c[1], daysData[3].hariTanggalSingkat); }
      }
      // Row 1: Day 5 (Jumat)
      if (r14[1]) {
        const c = r14[1].getElementsByTagName('w:tc');
        if (c.length >= 2) { setCellText(c[0], daysData[4].namaMenu); setCellText(c[1], daysData[4].hariTanggalSingkat); }
      }
    }

    // 4. Update Table 2.4 (Posyandu): Table 15 (Row 1..3) & Table 16 (Row 0..1)
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

    // 5. Ensure Posyandu (Table 2.4) has independent image relationships so it doesn't share with Sekolah
    // Add separate relationships for Posyandu Day 1..5 in document.xml.rels
    const relsRoot = relsDoc.documentElement;
    if (!relsRoot) {
      return NextResponse.json({ error: 'Relasi Word tidak valid.' }, { status: 500 });
    }
    const posyanduRelIds = ['rIdPosyandu1', 'rIdPosyandu2', 'rIdPosyandu3', 'rIdPosyandu4', 'rIdPosyandu5'];
    posyanduRelIds.forEach((rid, i) => {
      // Check if already exists, else create
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

    // Helper to set blip embed
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

    // 6. Update Closing Date Paragraph: "Teluk Naga, 04 September 2026"
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

    // 7. Update Food Images in word/media/
    // Requirement strictly applied:
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

    // Download & replace Sekolah (Porsi Besar)
    await Promise.all(
      sekolahReplacements.map(async item => {
        if (!item.url) return;
        const buf = await fetchImageBuffer(item.url);
        if (buf) {
          zip.file(item.media, buf);
        }
      })
    );

    // Download & replace Posyandu (Porsi Bumil/Busui)
    await Promise.all(
      posyanduReplacements.map(async item => {
        if (item.url) {
          const buf = await fetchImageBuffer(item.url);
          if (buf) {
            zip.file(item.media, buf);
            return;
          }
        }
        // Fallback to default image in template if bumil url not yet uploaded
        const fb = zip.file(item.fallback);
        if (fb) {
          const fbData = await fb.async('nodebuffer');
          zip.file(item.media, fbData);
        }
      })
    );

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
