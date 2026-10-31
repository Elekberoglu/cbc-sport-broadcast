/* Yüngül XLSX oxuyucu (JSZip əsasında). Hər vərəq üçün sətir massivi qaytarır.
   Tarix formatlı xanalar {__date:'YYYY-MM-DD'} və ya {__time:'HH:MM'} kimi qaytarılır. */
(function (g) {
    'use strict';

    const BUILTIN_DATE_FMTS = new Set([14, 15, 16, 17, 22, 27, 28, 29, 30, 31, 34, 35, 36, 50, 51, 52, 53, 54, 57, 58]);
    const BUILTIN_TIME_FMTS = new Set([18, 19, 20, 21, 45, 46, 47]);

    function byTag(node, tag) { return Array.from(node.getElementsByTagNameNS('*', tag)); }
    function xml(text) { return new DOMParser().parseFromString(text, 'application/xml'); }

    function colIndex(ref) {
        const letters = /^[A-Z]+/.exec(ref)[0];
        let n = 0;
        for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
        return n - 1;
    }
    function rowIndex(ref) { return parseInt(/\d+/.exec(ref)[0], 10) - 1; }

    function serialToParts(v) {
        const ms = Math.round((v - 25569) * 86400000);
        const d = new Date(ms);
        const date = d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
        const time = String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
        return { date, time };
    }

    async function readXlsx(buffer) {
        const zip = await g.JSZip.loadAsync(buffer);
        const read = p => zip.file(p) ? zip.file(p).async('string') : Promise.resolve(null);

        // Paylaşılan sətirlər
        const shared = [];
        const ssText = await read('xl/sharedStrings.xml');
        if (ssText) {
            byTag(xml(ssText), 'si').forEach(si => shared.push(byTag(si, 't').map(t => t.textContent).join('')));
        }

        // Üslublar: hansı xanalar tarix/saatdır
        const styleKind = [];
        const stText = await read('xl/styles.xml');
        if (stText) {
            const doc = xml(stText);
            const custom = {};
            byTag(doc, 'numFmt').forEach(f => { custom[+f.getAttribute('numFmtId')] = f.getAttribute('formatCode') || ''; });
            const cellXfs = byTag(doc, 'cellXfs')[0];
            if (cellXfs) {
                Array.from(cellXfs.children).forEach((xf, i) => {
                    const id = +xf.getAttribute('numFmtId');
                    let kind = null;
                    if (BUILTIN_DATE_FMTS.has(id)) kind = 'date';
                    else if (BUILTIN_TIME_FMTS.has(id)) kind = 'time';
                    else if (custom[id]) {
                        const code = custom[id].replace(/\[[^\]]*\]|"[^"]*"|\\./g, '').toLowerCase();
                        const hasDate = /[dy]/.test(code) || /(^|[^h:])m{3,}/.test(code);
                        const hasTime = /h|s/.test(code);
                        if (hasDate) kind = 'date'; else if (hasTime) kind = 'time';
                    }
                    styleKind[i] = kind;
                });
            }
        }

        // Vərəqlər
        const wb = xml(await read('xl/workbook.xml'));
        const relsText = await read('xl/_rels/workbook.xml.rels');
        const rels = {};
        if (relsText) byTag(xml(relsText), 'Relationship').forEach(r => { rels[r.getAttribute('Id')] = r.getAttribute('Target'); });

        const sheets = [];
        for (const s of byTag(wb, 'sheet')) {
            const rid = s.getAttribute('r:id') || s.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id');
            let target = rels[rid] || '';
            target = target.replace(/^\//, '');
            const path = target.startsWith('xl/') ? target : 'xl/' + target;
            const text = await read(path);
            if (!text) continue;
            const doc = xml(text);
            const rows = [];
            byTag(doc, 'c').forEach(c => {
                const ref = c.getAttribute('r');
                if (!ref) return;
                const r = rowIndex(ref), ci = colIndex(ref);
                const t = c.getAttribute('t');
                const vEl = byTag(c, 'v')[0];
                let val = null;
                if (t === 's') val = vEl ? shared[+vEl.textContent] : null;
                else if (t === 'inlineStr') val = byTag(c, 't').map(x => x.textContent).join('');
                else if (t === 'str') val = vEl ? vEl.textContent : null;
                else if (t === 'b') val = vEl ? vEl.textContent === '1' : null;
                else if (vEl) {
                    const num = parseFloat(vEl.textContent);
                    const kind = styleKind[+(c.getAttribute('s') || 0)];
                    if (kind && !isNaN(num)) {
                        const p = serialToParts(num);
                        if (num < 1) val = { __time: p.time };
                        else if (kind === 'time' && num % 1 !== 0) val = { __date: p.date, __time: p.time };
                        else val = num % 1 ? { __date: p.date, __time: p.time } : { __date: p.date };
                    } else val = isNaN(num) ? vEl.textContent : num;
                }
                if (val === null || val === '') return;
                (rows[r] = rows[r] || [])[ci] = val;
            });
            // Birləşdirilmiş xanaları doldur (məs. bir neçə sətrə yayılmış tarix)
            byTag(doc, 'mergeCell').forEach(m => {
                const [a, b] = (m.getAttribute('ref') || '').split(':');
                if (!a || !b) return;
                const r1 = rowIndex(a), c1 = colIndex(a), r2 = rowIndex(b), c2 = colIndex(b);
                const v = rows[r1] && rows[r1][c1];
                if (v == null) return;
                for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
                    if (r === r1 && c === c1) continue;
                    // Yalnız şaquli birləşmələri doldururuq (üfüqi başlıqlar təkrarlanmasın)
                    if (c !== c1) continue;
                    (rows[r] = rows[r] || [])[c] = v;
                }
            });
            for (let i = 0; i < rows.length; i++) rows[i] = rows[i] || [];
            sheets.push({ name: s.getAttribute('name'), rows });
        }
        return sheets;
    }

    function readCsv(text) {
        const delim = (text.split('\n')[0].match(/;/g) || []).length > (text.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
        const rows = [];
        let row = [], cur = '', q = false;
        for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (q) {
                if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
                else if (ch === '"') q = false;
                else cur += ch;
            } else if (ch === '"') q = true;
            else if (ch === delim) { row.push(cur); cur = ''; }
            else if (ch === '\n' || ch === '\r') {
                if (ch === '\r' && text[i + 1] === '\n') i++;
                row.push(cur); rows.push(row.map(v => v.trim() === '' ? undefined : v.trim())); row = []; cur = '';
            } else cur += ch;
        }
        if (cur || row.length) { row.push(cur); rows.push(row.map(v => v.trim() === '' ? undefined : v.trim())); }
        return [{ name: 'CSV', rows }];
    }

    g.CBC = Object.assign(g.CBC || {}, { readXlsx, readCsv });
})(window);
