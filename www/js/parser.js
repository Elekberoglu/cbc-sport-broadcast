/* Qrafik cədvəlinin təhlili.
   Gözlənilən quruluş (bir və ya bir neçə vərəqdə):
   1) Yuxarıda oyunlar cədvəli: № | Tarix | Gün | Yığışma saatı | Başlama saatı | Oyun | Yer | İdman | Yayım | (Heyət)
   2) Aşağıda heyət matrisi:   Soyad Ad | Vəzifə | 1 | 2 | 3 ...  (xanada x / + / istənilən işarə = təyinat)
      Matris sütun başlıqları oyun nömrəsi, oyun adı və ya tarix ola bilər. */
(function (g) {
    'use strict';
    const C = g.CBC;

    const H = {
        num: /^(№|no|n|#|s ?s|sira|nomre|kod)$/,
        gather: /yigis|toplan|gather|cixis|yola dus/,
        start: /basla|start|kick|oyun saati|^saat$|vaxt/,
        date: /tarix|date|^gun tarix/,
        day: /^gun$|hefte/,
        match: /oyun|mac|match|cekilis|tedbir|event|komandalar|qarsilasma/,
        venue: /yer|stadion|venue|mekan|arena|meydanca|seher/,
        sport: /idman|sport|nov/,
        type: /yayim|canli|format|^tip|nov yayim/,
        crew: /heyet|crew|emekdaslar|briqada|isciler/,
        sts: /^sts$|^sng$|^sts sng|^sng sts|^peyk|^masin/,
        flash: /onc|flas|flash|matconu|matcsonu/
    };
    const NAME_H = /soyad|^ad$|^ad |emekdas|isci|^name|^adi/;
    const ROLE_H = /vezife|rol|position|pese|funksiya/;

    function cellText(v) {
        if (v == null) return '';
        if (typeof v === 'object') return (v.__date || '') + (v.__time ? ' ' + v.__time : '');
        return String(v).trim();
    }

    function parseDate(v, refYear) {
        if (v == null || v === '') return null;
        if (typeof v === 'object' && v.__date) return v.__date;
        if (typeof v === 'number' && v > 20000 && v < 80000) {
            const d = new Date(Math.round((v - 25569) * 86400000));
            return d.getUTCFullYear() + '-' + C.pad(d.getUTCMonth() + 1) + '-' + C.pad(d.getUTCDate());
        }
        const s = C.norm(String(v));
        let m = /(\d{4}) (\d{1,2}) (\d{1,2})/.exec(s);
        if (m) return m[1] + '-' + C.pad(m[2]) + '-' + C.pad(m[3]);
        m = /(\d{1,2}) (\d{1,2})(?: (\d{2,4}))?/.exec(s);
        if (m && +m[2] <= 12) {
            let y = m[3] ? +m[3] : refYear;
            if (y < 100) y += 2000;
            return y + '-' + C.pad(m[2]) + '-' + C.pad(m[1]);
        }
        const months = C.MONTHS.map(C.norm);
        m = /(\d{1,2}) ([a-z]+)(?: (\d{4}))?/.exec(s);
        if (m) {
            const mi = months.findIndex(mm => m[2].startsWith(mm.slice(0, 3)));
            if (mi >= 0) return (m[3] ? +m[3] : refYear) + '-' + C.pad(mi + 1) + '-' + C.pad(m[1]);
        }
        return null;
    }

    /** "07:00 BOS" → {time:'07:00', note:'BOS'} */
    function parseTime(v) {
        if (v == null || v === '') return { time: '', note: '' };
        if (typeof v === 'object' && v.__time) return { time: v.__time, note: '' };
        if (typeof v === 'number' && v >= 0 && v < 1) {
            const mins = Math.round(v * 1440);
            return { time: C.pad(Math.floor(mins / 60) % 24) + ':' + C.pad(mins % 60), note: '' };
        }
        if (typeof v === 'number' && v >= 1 && v < 24) {
            const h = Math.floor(v), mm = Math.round((v - h) * 100);
            if (mm < 60) return { time: C.pad(h) + ':' + C.pad(mm), note: '' };
        }
        const s = String(v).trim();
        const m = /(\d{1,2})\s*[:.\-]\s*(\d{2})/.exec(s);
        if (m && +m[1] < 24) {
            const note = (s.slice(0, m.index) + ' ' + s.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
            return { time: C.pad(m[1]) + ':' + m[2], note };
        }
        const h = /^(\d{1,2})$/.exec(s);
        if (h && +h[1] < 24) return { time: C.pad(h[1]) + ':00', note: '' };
        return { time: '', note: s };
    }

    function parseType(v) {
        const s = C.norm(cellText(v));
        if (!s) return 'canlı';
        if (/yazi|record|rec|^y$|video/.test(s)) return 'yazı';
        return 'canlı';
    }

    function classifyHeader(cell) {
        const raw = cellText(cell).trim();
        if (/^(№|#|n°|no\.?)$/i.test(raw)) return 'num';
        const s = C.norm(raw);
        if (!s) return null;
        // Sıra vacibdir: "Yığışma saatı" həm də "saat" sözünü daşıyır
        if (/yeri$|^yer$|stadion|mekan|venue|arena/.test(s)) return 'venue';
        for (const k of ['num', 'sts', 'flash', 'gather', 'crew', 'type', 'sport', 'date', 'day', 'start', 'match', 'venue']) {
            if (H[k].test(s)) return k;
        }
        return null;
    }

    function findMatchHeader(rows) {
        for (let r = 0; r < rows.length; r++) {
            const cols = {};
            (rows[r] || []).forEach((cell, ci) => {
                const k = classifyHeader(cell);
                if (k && cols[k] == null) cols[k] = ci;
            });
            const score = ['date', 'match', 'start', 'gather', 'venue'].filter(k => cols[k] != null).length;
            if (cols.match != null && score >= 3) return { row: r, cols };
        }
        return null;
    }

    /** Heyət cədvəlinin başlığıdır? (oyunlar cədvəlini burada dayandırmaq üçün) */
    function isStrongMatrixHeader(row) {
        const t = (row || []).map(c => C.norm(cellText(c)));
        return t.some(s => /soyad|emekdas|isci|^ad soyad$|^name$/.test(s)) || (t.some(s => NAME_H.test(s)) && t.some(s => ROLE_H.test(s)));
    }
    function isMatrixHeader(row) {
        const t = (row || []).map(c => C.norm(cellText(c)));
        return t.some(s => NAME_H.test(s)) && (t.some(s => ROLE_H.test(s)) || t.filter(Boolean).length >= 3);
    }

    // Qısaldılmış oyun adını (məs. "A/K Kəpəz - Baku S", "U 15", "Basketbol") cədvəldəki oyunla tutuşdurur
    function tokens(t) { return C.norm(t).split(' ').filter(x => x.length >= 2 || /\d/.test(x)); }
    function matchScore(cell, shoot) {
        const a = tokens(cell);
        if (!a.length) return 0;
        const b = tokens(shoot.match);
        let sc = 0;
        a.forEach(t => {
            if (b.includes(t)) sc += 2;
            else if (b.some(u => u.length > 3 && t.length > 3 && (u.startsWith(t) || t.startsWith(u)))) sc += 1;
        });
        if (shoot.sport && a.includes(C.norm(shoot.sport))) sc += 2;
        return sc;
    }

    function splitCrew(v) {
        return cellText(v).split(/[,;\n\/]+/).map(s => s.trim()).filter(s => s.length > 1);
    }

    function parse(sheets, opts) {
        const refYear = (opts && opts.refYear) || new Date().getFullYear();
        const shoots = [];
        const people = {};
        const warnings = [];

        // 1) Oyunlar cədvəli
        for (const sh of sheets) {
            const rows = sh.rows;
            const hdr = findMatchHeader(rows);
            if (!hdr) continue;
            const c = hdr.cols;
            let lastDate = null, blank = 0;
            for (let r = hdr.row + 1; r < rows.length; r++) {
                const row = rows[r] || [];
                if (isStrongMatrixHeader(row)) break;
                if (findMatchHeader([row])) break;
                const match = cellText(row[c.match]);
                if (!row.some(v => cellText(v))) { if (++blank >= 2 && shoots.length) break; continue; }
                blank = 0;
                const date = c.date != null ? (parseDate(row[c.date], refYear) || lastDate) : lastDate;
                if (date) lastDate = date;
                if (!match || !date) continue;
                const st = parseTime(c.start != null ? row[c.start] : '');
                const ga = parseTime(c.gather != null ? row[c.gather] : '');
                const venue = c.venue != null ? cellText(row[c.venue]) : '';
                const sportCell = c.sport != null ? cellText(row[c.sport]) : '';
                const shoot = {
                    id: C.uid(),
                    num: c.num != null ? cellText(row[c.num]) : String(shoots.length + 1),
                    date,
                    start: st.time,
                    gather: ga.time,
                    gatherNote: ga.note,
                    match,
                    venue,
                    sport: C.guessSport(sportCell) || C.guessSport(match) || (sportCell ? (sportCell[0].toUpperCase() + sportCell.slice(1)) : 'Futbol'),
                    type: parseType(c.type != null ? row[c.type] : ''),
                    crew: c.crew != null ? splitCrew(row[c.crew]) : [],
                    sts: c.sts != null ? cellText(row[c.sts]) : '',
                    flash: c.flash != null ? cellText(row[c.flash]) : '',
                    order: shoots.length
                };
                if (!['Futbol', 'Basketbol', 'Voleybol', 'Futzal', 'Həndbol'].includes(shoot.sport)) shoot.sport = 'Digər';
                shoots.push(shoot);
            }
        }
        if (!shoots.length) {
            warnings.push('Oyunlar cədvəlinin başlığı tapılmadı (Tarix, Oyun, Başlama/Yığışma saatı, Yer sütunları olmalıdır).');
            return { shoots, people, warnings };
        }

        // Başlıqda il yoxdursa (məs. "27 oktyabr") — qrafikin öz ili
        const years = {};
        shoots.forEach(sh => { const y = sh.date.slice(0, 4); years[y] = (years[y] || 0) + 1; });
        const schedYear = +Object.keys(years).sort((a, b) => years[b] - years[a])[0] || refYear;

        // 2) Heyət matrisi
        let assigned = 0;
        for (const sh of sheets) {
            const rows = sh.rows;
            for (let r = 0; r < rows.length; r++) {
                if (!isMatrixHeader(rows[r])) continue;
                const head = rows[r];
                const hn = head.map(cc => C.norm(cellText(cc)));
                let nameCol = hn.findIndex(s => NAME_H.test(s));
                const roleCol = hn.findIndex(s => ROLE_H.test(s));
                if (nameCol < 0) continue;
                // Sütun → oyun(lar) xəritəsi
                const colMap = {};
                const dateOcc = {};   // eyni tarixli neçənci sütundur
                const colPos = {};
                head.forEach((h, ci) => {
                    if (ci === nameCol || ci === roleCol || h == null) return;
                    const txt = cellText(h);
                    const n = C.norm(txt);
                    if (!n) return;
                    let found = shoots.filter(s => s.num && C.norm(s.num) === n);
                    if (!found.length && /^\d+$/.test(n)) {
                        const idx = +n - 1;
                        if (shoots[idx]) found = [shoots[idx]];
                    }
                    if (!found.length) found = shoots.filter(s => C.norm(s.match) === n || (n.length > 4 && C.norm(s.match).includes(n)) || (n.length > 4 && n.includes(C.norm(s.match))));
                    if (!found.length) {
                        const d = parseDate(h, schedYear);
                        if (d) {
                            found = shoots.filter(s => s.date === d);
                            dateOcc[d] = (dateOcc[d] || 0) + 1;
                            colPos[ci] = dateOcc[d] - 1; // eyni tarixin 1-ci, 2-ci sütunu → həmin günün 1-ci, 2-ci oyunu
                        }
                    }
                    if (found.length) colMap[ci] = found;
                });
                if (!Object.keys(colMap).length) continue;
                for (let rr = r + 1; rr < rows.length; rr++) {
                    const row = rows[rr] || [];
                    const name = cellText(row[nameCol]);
                    if (!name) { if (!row.some(v => cellText(v))) continue; else continue; }
                    if (isMatrixHeader(row) || findMatchHeader([row])) break;
                    if (/^\d+([.,]\d+)?$/.test(name)) continue;
                    const role = roleCol >= 0 ? cellText(row[roleCol]) : '';
                    if (!people[name] || role) people[name] = role || people[name] || '';
                    Object.entries(colMap).forEach(([ci, list]) => {
                        const v = cellText(row[ci]);
                        const vn = C.norm(v);
                        if (!vn || /^(0|-|yox|no|off|istirahet|i)$/.test(vn)) return;
                        let targets = list;
                        if (list.length > 1) {
                            // Bir tarixə bir neçə oyun düşürsə — xanadakı nömrə/ada/idman növünə görə seç
                            const exact = list.filter(s => s.num && C.norm(s.num) === vn);
                            if (exact.length) targets = exact;
                            else {
                                const scored = list.map(s => ({ s, sc: matchScore(v, s) })).sort((a, b) => b.sc - a.sc);
                                if (scored[0].sc > 0 && scored[0].sc > (scored[1] ? scored[1].sc : 0)) targets = [scored[0].s];
                                else if (colPos[ci] != null && list[colPos[ci]]) targets = [list[colPos[ci]]];
                                else return; // qeyri-müəyyəndir — səhv təyinat etmirik
                            }
                        }
                        targets.forEach(s => { if (!s.crew.some(x => C.nameMatch(x, name))) { s.crew.push(name); assigned++; } });
                    });
                }
            }
        }
        shoots.forEach(s => s.crew.forEach(n => { if (!(n in people)) people[n] = ''; }));
        if (!assigned && !shoots.some(s => s.crew.length)) warnings.push('Heyət bölgüsü (ad-soyad matrisi) tapılmadı — yalnız oyunlar oxundu.');
        return { shoots, people, warnings };
    }

    g.CBC = Object.assign(g.CBC || {}, { parseSchedule: parse, parseDate, parseTime });
})(window);
