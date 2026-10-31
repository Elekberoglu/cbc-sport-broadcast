/* CBC Sport Broadcast — ümumi köməkçilər və sabitlər */
(function (g) {
    'use strict';

    const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];
    const MONTHS_CAP = MONTHS.map(m => m[0].toUpperCase() + m.slice(1));
    const WEEKDAYS = ['Bazar', 'Bazar ertəsi', 'Çərşənbə axşamı', 'Çərşənbə', 'Cümə axşamı', 'Cümə', 'Şənbə'];

    // Bakıdan kənar şəhərlər (ezamiyyət). Qrafikdə bunlardan biri yoxdursa — Bakı.
    const CITIES = [
        { name: 'Gəncə', keys: ['gence', 'ganja'], lat: 40.6828, lon: 46.3606 },
        { name: 'Qəbələ', keys: ['qebele', 'gabala'], lat: 40.9814, lon: 47.8458 },
        { name: 'Yevlax', keys: ['yevlax', 'yevlakh'], lat: 40.6172, lon: 47.15 },
        { name: 'Tovuz', keys: ['tovuz'], lat: 40.9925, lon: 45.6286 },
        { name: 'Şamaxı', keys: ['samaxi', 'shamakhi'], lat: 40.6303, lon: 48.6414 },
        { name: 'Şəki', keys: ['seki', 'sheki'], lat: 41.1919, lon: 47.1706 },
        { name: 'Lənkəran', keys: ['lenkeran', 'lankaran'], lat: 38.7543, lon: 48.8506 },
        { name: 'Mingəçevir', keys: ['mingecevir', 'mingachevir'], lat: 40.7703, lon: 47.0496 },
        { name: 'Quba', keys: ['quba', 'guba'], lat: 41.3611, lon: 48.5134 },
        { name: 'Qusar', keys: ['qusar', 'gusar'], lat: 41.4275, lon: 48.4302 },
        { name: 'Xaçmaz', keys: ['xacmaz', 'khachmaz'], lat: 41.4591, lon: 48.8028 },
        { name: 'İmişli', keys: ['imisli', 'imishli'], lat: 39.8709, lon: 48.0599 },
        { name: 'Ağdam', keys: ['agdam', 'aghdam'], lat: 39.9911, lon: 46.9297 },
        { name: 'Şuşa', keys: ['susa', 'shusha'], lat: 39.7583, lon: 46.7483 },
        { name: 'Füzuli', keys: ['fuzuli'], lat: 39.6006, lon: 47.1453 },
        { name: 'Naxçıvan', keys: ['naxcivan', 'nakhchivan'], lat: 39.2089, lon: 45.4122 },
        { name: 'Zaqatala', keys: ['zaqatala', 'zagatala'], lat: 41.6316, lon: 46.6433 },
        { name: 'Masallı', keys: ['masalli'], lat: 39.0342, lon: 48.6656 },
        { name: 'Şəmkir', keys: ['semkir', 'shamkir'], lat: 40.8298, lon: 46.0178 },
        { name: 'Göygöl', keys: ['goygol'], lat: 40.5853, lon: 46.3189 },
        { name: 'Bərdə', keys: ['berde', 'barda'], lat: 40.3747, lon: 47.1266 },
        { name: 'Ağsu', keys: ['agsu', 'aghsu'], lat: 40.5683, lon: 48.4008 },
        { name: 'Sabirabad', keys: ['sabirabad'], lat: 40.0087, lon: 48.4770 },
        { name: 'Salyan', keys: ['salyan'], lat: 39.5962, lon: 48.9848 },
        { name: 'Qazax', keys: ['qazax', 'gazakh'], lat: 41.0933, lon: 45.3661 },
        { name: 'Şirvan', keys: ['sirvan', 'shirvan'], lat: 39.9381, lon: 48.9290 },
        { name: 'Ağdaş', keys: ['agdas', 'aghdash'], lat: 40.6469, lon: 47.4738 },
        { name: 'Kürdəmir', keys: ['kurdemir'], lat: 40.3453, lon: 48.1609 }
    ];
    const BAKU = { name: 'Bakı', keys: ['baki', 'baku'], lat: 40.4093, lon: 49.8671 };

    function translit(s) {
        return String(s == null ? '' : s)
            .replace(/İ/g, 'i').replace(/I/g, 'ı').toLowerCase()
            .replace(/ə/g, 'e').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g')
            .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ü/g, 'u');
    }
    function norm(s) {
        return translit(s).replace(/[^a-z0-9]+/g, ' ').trim();
    }

    /** Məkan mətnindən şəhəri tapır. Tapılmasa — Bakı. */
    function detectCity(venue) {
        const v = ' ' + norm(venue) + ' ';
        if (!v.trim()) return BAKU;
        for (const c of CITIES) {
            for (const k of c.keys) {
                if (v.includes(' ' + k)) return c;
            }
        }
        return BAKU;
    }
    function isTrip(venue) { return detectCity(venue) !== BAKU; }

    /** İki adı müqayisə edir: söz sırası, hərf fərqləri və inisiallar nəzərə alınır. */
    function nameMatch(a, b) {
        const A = norm(a).split(' ').filter(Boolean);
        const B = norm(b).split(' ').filter(Boolean);
        if (!A.length || !B.length) return false;
        const [small, large] = A.length <= B.length ? [A, B] : [B, A];
        const used = new Set();
        return small.every(t => {
            const i = large.findIndex((u, idx) => !used.has(idx) && (u === t || (t.length === 1 && u[0] === t) || (u.length === 1 && t[0] === u)));
            if (i < 0) return false;
            used.add(i);
            return true;
        });
    }

    function pad(n) { return String(n).padStart(2, '0'); }
    function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
    function todayISO() { return isoDate(new Date()); }
    function parseISO(iso) {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
        return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    }
    function dateTime(iso, hhmm) {
        const d = parseISO(iso);
        if (!d) return null;
        const t = /^(\d{1,2}):(\d{2})/.exec(hhmm || '');
        if (t) d.setHours(+t[1], +t[2], 0, 0); else d.setHours(23, 59, 0, 0);
        return d;
    }
    function fmtDate(iso, withDay) {
        const d = parseISO(iso);
        if (!d) return iso || '—';
        const s = pad(d.getDate()) + ' ' + MONTHS[d.getMonth()];
        return withDay ? s + ', ' + WEEKDAYS[d.getDay()] : s;
    }
    function weekday(iso) { const d = parseISO(iso); return d ? WEEKDAYS[d.getDay()] : ''; }
    function monthKey(iso) { return (iso || '').slice(0, 7); }
    function monthLabel(key) {
        const [y, m] = key.split('-');
        return MONTHS_CAP[+m - 1] + ' ' + y;
    }
    function initials(name) {
        const p = String(name || '').trim().split(/\s+/).filter(Boolean);
        return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
    }
    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }
    function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
    function hashInt(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
        return Math.abs(h) % 2000000000 + 1;
    }

    function guessSport(text) {
        const t = ' ' + norm(text) + ' ';
        if (/ basketbol| bk /.test(t)) return 'Basketbol';
        if (/ voleybol| vk /.test(t)) return 'Voleybol';
        if (/ futzal/.test(t)) return 'Futzal';
        if (/ hendbol/.test(t)) return 'Həndbol';
        if (/ futbol/.test(t)) return 'Futbol';
        return null;
    }
    function sportIcon(sport) {
        switch (sport) {
            case 'Basketbol': return 'fa-basketball text-orange-500';
            case 'Voleybol': return 'fa-volleyball text-amber-500';
            case 'Həndbol': return 'fa-hand text-purple-500';
            case 'Digər': return 'fa-trophy text-gray-500';
            default: return 'fa-futbol text-blue-600';
        }
    }

    /** ISO → GG/AA/İİİİ */
    function fmtDMY(iso) {
        const d = parseISO(iso);
        return d ? pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() : '';
    }
    /** GG/AA/İİİİ → ISO, etibarsızdırsa null */
    function parseDMY(str) {
        const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(str || '').trim());
        if (!m) return null;
        const d = +m[1], mo = +m[2], y = +m[3];
        if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1) return null;
        const dt = new Date(y, mo - 1, d);
        if (dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
        return isoDate(dt);
    }

    g.CBC = Object.assign(g.CBC || {}, {
        MONTHS, MONTHS_CAP, WEEKDAYS, CITIES, BAKU,
        translit, norm, detectCity, isTrip, nameMatch,
        pad, isoDate, todayISO, parseISO, dateTime, fmtDate, weekday, monthKey, monthLabel,
        initials, esc, uid, hashInt, guessSport, sportIcon, fmtDMY, parseDMY
    });
})(window);
