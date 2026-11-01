/* Operatorlar cədvəli: Tarix | STUDIYA | Şirkətdən kənar çəkilişlər | STS-1 | STS-2 | STS-3 | Növbətçi
   Xanalarda: ilk sətirdə saat (məs. 09:00) və ya STS üçün oyun/idman adı, sonra operatorların adları.
   Adlar yalnız ad kimi yazılır; "Anar İs." kimi qısaltmalar əvvəlki adla birləşdirilir. */
(function (g) {
    'use strict';
    const C = g.CBC;

    const KINDS = [
        { re: /^studiya/, kind: 'studio', label: 'Studiya' },
        { re: /kenar|sirketden/, kind: 'outside', label: 'Şirkətdən kənar çəkiliş' },
        { re: /^sts ?(\d)/, kind: 'sts', label: null },
        { re: /^novbetci|^novbe/, kind: 'duty', label: 'Növbətçi' }
    ];

    function text(v) {
        if (v == null) return '';
        if (typeof v === 'object') return (v.__date || '') + (v.__time ? ' ' + v.__time : '');
        return String(v);
    }
    function classify(cell) {
        const n = C.norm(text(cell));
        if (!n) return null;
        for (const k of KINDS) {
            const m = k.re.exec(n);
            if (m) return { kind: k.kind, label: k.kind === 'sts' ? 'STS-' + m[1] : k.label };
        }
        return null;
    }

    /** Adları ayırır: "Zaur Anar İs." → ["Zaur", "Anar İs."]; "+3" əlavə say kimi qaytarılır */
    function splitNames(lines) {
        const names = [];
        let extra = 0;
        lines.join(' ').split(/[\s,;]+/).filter(Boolean).forEach(t => {
            if (/^\+\d+$/.test(t)) { extra += +t.slice(1); return; }
            if (/\.$/.test(t) && t.length <= 5 && names.length) { names[names.length - 1] += ' ' + t; return; }
            if (/^[A-Za-zƏəÖöÜüĞğİıŞşÇçIi'’-]+$/.test(t) && t.length > 1) names.push(t);
        });
        return { names, extra };
    }

    function parseCell(v, kind) {
        let lines = text(v).split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        if (!lines.length) return null;
        let time = '', title = '';
        const tm = /^(\d{1,2})[:.](\d{2})\b\s*(.*)$/.exec(lines[0]);
        if (tm && +tm[1] < 24) {
            time = C.pad(tm[1]) + ':' + tm[2];
            lines[0] = tm[3];
            lines = lines.filter(Boolean);
        } else if (kind === 'sts') {
            if (lines.length > 1) title = lines.shift();
            else { const p = lines[0].split(/\s+/); title = p.shift(); lines = [p.join(' ')].filter(Boolean); }
        }
        const { names, extra } = splitNames(lines);
        if (!names.length && !title) return null;
        return { time, title, names, extra };
    }

    // Tarixdə il yoxdursa (məs. "02.11.") — bu günə ən yaxın il
    function nearestYear(iso) {
        if (!iso) return iso;
        const md = iso.slice(4), now = new Date();
        let best = iso, bestD = Infinity;
        [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].forEach(y => {
            const d = Math.abs(C.parseISO(y + md) - now);
            if (d < bestD) { bestD = d; best = y + md; }
        });
        return best;
    }

    /** Operator cədvəlidirsə nəticə qaytarır, deyilsə null */
    function parse(sheets) {
        for (const sh of sheets) {
            const rows = sh.rows;
            for (let r = 0; r < Math.min(rows.length, 15); r++) {
                const cols = {};
                (rows[r] || []).forEach((cell, ci) => { const k = classify(cell); if (k) cols[ci] = k; });
                const kinds = new Set(Object.values(cols).map(k => k.kind));
                if (Object.keys(cols).length < 3 || !kinds.has('sts')) continue;
                // Tarix sütunu: başlıqda boş və ya "tarix" olan, aşağıda tarix olan ilk sütun
                const firstCol = Math.min(...Object.keys(cols).map(Number));
                let dateCol = 0;
                for (let c = 0; c < firstCol; c++) {
                    if ((rows.slice(r + 1, r + 6)).some(row => row && C.parseDate(row[c], new Date().getFullYear()))) { dateCol = c; break; }
                }
                const shoots = [];
                const people = {};
                let lastDate = null;
                for (let rr = r + 1; rr < rows.length; rr++) {
                    const row = rows[rr] || [];
                    let d = C.parseDate(row[dateCol], new Date().getFullYear());
                    if (d && !/\d{4}/.test(text(row[dateCol]).replace(/^\d{4}-/, '')) && typeof row[dateCol] !== 'object') d = nearestYear(d);
                    if (d) lastDate = d;
                    const date = d || lastDate;
                    if (!date) continue;
                    Object.entries(cols).forEach(([ci, k]) => {
                        const cell = parseCell(row[ci], k.kind);
                        if (!cell) return;
                        cell.names.forEach(n => { people[n] = people[n] || 'Operator'; });
                        const sportGuess = C.guessSport(cell.title);
                        shoots.push({
                            id: C.uid(),
                            source: 'operator',
                            kind: k.kind,
                            opLabel: k.label,
                            date,
                            gather: cell.time,
                            start: '',
                            gatherNote: '',
                            match: k.kind === 'sts' ? (cell.title || k.label) : k.label,
                            venue: '',
                            sport: k.kind === 'sts' ? (sportGuess || 'Futbol') : 'Digər',
                            type: 'canlı',
                            sts: k.kind === 'sts' ? k.label : '',
                            flash: '',
                            crew: cell.names,
                            extra: cell.extra
                        });
                    });
                }
                if (shoots.length) return { type: 'operator', shoots, people, warnings: [] };
            }
        }
        return null;
    }

    /** Operator adı ilə dəqiq uyğunluq ("Anar" ≠ "Anar İs.") */
    function sameName(a, b) { return C.norm(a) === C.norm(b) && !!C.norm(a); }

    g.CBC = Object.assign(g.CBC || {}, { parseOperatorSchedule: parse, opSameName: sameName });
})(window);
