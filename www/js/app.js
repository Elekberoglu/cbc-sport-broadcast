/* CBC Sport Broadcast — əsas tətbiq məntiqi */
(function (g) {
    'use strict';
    const C = g.CBC;
    const $ = id => document.getElementById(id);
    const STORE = 'cbc_sport_broadcast_v1';
    const SHOOT_DURATION_H = 3;   // başlamadan sonra neçə saata "Tamamlandı" sayılır
    const HISTORY_MAX = 20;       // saxlanılan qrafik versiyalarının sayı

    // ---------- Vəziyyət ----------
    let state = load();
    let currentTab = 'my';
    let pendingFile = null;       // təsdiq gözləyən fayl
    const weatherCache = {};

    function defaultState() {
        return {
            profile: { name: 'Hüseynov Tamerlan', role: 'Rejissor', avatar: null },
            shoots: [],
            people: {},
            archive: [],
            history: [],
            meta: { version: 0, uploadedAt: null, fileName: null, image: null },
            notify: { enabled: false },
            theme: 'system'
        };
    }
    function load() {
        let s = null;
        try {
            const raw = localStorage.getItem(STORE);
            if (raw) s = Object.assign(defaultState(), JSON.parse(raw));
        } catch (e) { /* */ }
        s = s || defaultState();
        // Köhnə versiyadan qalan nümunə (saxta) məlumatı təmizlə
        if (s.meta && s.meta.sample) {
            s.shoots = []; s.people = {}; s.meta = defaultState().meta;
        }
        s.history = s.history || [];
        return s;
    }
    function save() {
        try { localStorage.setItem(STORE, JSON.stringify(state)); }
        catch (e) {
            // Yer çatmırsa, ən köhnə tarixçəni sil və yenidən cəhd et
            if (state.history.length > 3) { state.history = state.history.slice(-3); try { localStorage.setItem(STORE, JSON.stringify(state)); return; } catch (e2) { /* */ } }
            toast('Yaddaş doludur — şəkil ölçüsünü kiçildin');
        }
    }

    // ---------- Köhnə köməkçilər ----------
    function toast(msg, ms) {
        const t = $('toast');
        t.textContent = msg;
        t.style.opacity = '1';
        clearTimeout(toast._t);
        toast._t = setTimeout(() => { t.style.opacity = '0'; }, ms || 2600);
    }
    function openModal(id) { const m = $(id); m.classList.remove('hidden'); m.classList.add('flex'); }
    function closeModal(id) { const m = $(id); m.classList.add('hidden'); m.classList.remove('flex'); }
    function confirmBox(text) {
        return new Promise(res => {
            $('confirm-text').textContent = text;
            openModal('confirm-modal');
            const done = v => { closeModal('confirm-modal'); $('confirm-yes').onclick = $('confirm-no').onclick = null; res(v); };
            $('confirm-yes').onclick = () => done(true);
            $('confirm-no').onclick = () => done(false);
        });
    }
    function fileSize(n) { return n > 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB'; }
    function isImageFile(f) { return /^image\//.test(f.type) || /\.(png|jpe?g|heic|webp)$/i.test(f.name || ''); }

    function isMine(s) {
        if (s.manual || s.mine) return true;
        return (s.crew || []).some(n => C.nameMatch(n, state.profile.name));
    }
    function myShoots() { return state.shoots.filter(isMine); }

    function status(s) {
        const st = C.dateTime(s.date, s.start || '23:59');
        if (!st) return 'active';
        const end = s.start ? st.getTime() + SHOOT_DURATION_H * 3600e3 : st.getTime();
        return Date.now() > end ? 'completed' : 'active';
    }
    function sortKey(s) { const d = C.dateTime(s.date, s.start || s.gather || '23:59'); return d ? d.getTime() : 0; }

    // ---------- Profil ----------
    function renderProfile() {
        $('profile-name').textContent = state.profile.name || 'Adınızı daxil edin';
        fitName();
        $('profile-role').textContent = state.profile.role || 'Vəzifə';
        const av = $('avatar-container');
        if (state.profile.avatar) av.innerHTML = '<img src="' + state.profile.avatar + '" alt="" class="w-full h-full object-cover">';
        else av.textContent = C.initials(state.profile.name);
        const vl = $('version-label');
        vl.classList.toggle('hidden', !state.meta.version);
        vl.innerHTML = state.meta.version ? '<i class="fa-solid fa-code-branch mr-1"></i>Qrafik v' + state.meta.version + ' · tarixçə' : '';
    }

    /** Ad və soyad bir sətirdə qalsın: yer çatmırsa şrift kiçilir (kəsilmir) */
    function fitName() {
        const el = $('profile-name');
        let size = 17;
        el.style.fontSize = size + 'px';
        while (el.scrollWidth > el.clientWidth + 0.5 && size > 11) { size -= 0.5; el.style.fontSize = size + 'px'; }
    }

    function resizeImage(file, max, quality) {
        return new Promise((res, rej) => {
            const r = new FileReader();
            r.onerror = rej;
            r.onload = () => {
                const img = new Image();
                img.onerror = rej;
                img.onload = () => {
                    const k = Math.min(1, max / Math.max(img.width, img.height));
                    const cv = document.createElement('canvas');
                    cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
                    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
                    res(cv.toDataURL('image/jpeg', quality || 0.85));
                };
                img.src = r.result;
            };
            r.readAsDataURL(file);
        });
    }

    // ---------- Cədvəlim ----------
    function cardHTML(item, opts) {
        const trip = C.isTrip(item.venue);
        const city = C.detectCity(item.venue).name;
        const done = status(item) === 'completed';
        const today = item.date === C.todayISO();
        const locationBadge = trip
            ? '<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"><i class="fa-solid fa-bus mr-1"></i>Ezamiyyət: ' + C.esc(city) + '</span>'
            : '<span class="bg-gray-100 text-gray-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"><i class="fa-solid fa-building mr-1"></i>Bakı</span>';
        const broadcastBadge = item.type === 'yazı'
            ? '<span class="bg-gray-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm shrink-0">YAZI</span>'
            : '<span class="bg-red-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm shrink-0">CANLI</span>';
        const stateBadge = done
            ? '<span class="text-[10px] font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full"><i class="fa-solid fa-check mr-1"></i>Tamamlandı</span>'
            : (opts.next ? '<span class="text-[10px] font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">Növbəti</span>' : (today ? '<span class="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">Bu gün</span>' : ''));

        return '' +
        '<div class="bg-white rounded-2xl p-4 border transition relative ' + (done ? 'opacity-60 bg-gray-50 border-gray-200' : (opts.next ? 'border-blue-200 shadow-md ring-1 ring-blue-100' : 'border-gray-100 shadow-sm')) + '">' +
            '<div class="flex justify-between items-start mb-2 gap-2">' +
                '<div class="flex items-center flex-wrap gap-1.5 min-w-0">' +
                    '<span class="text-xs font-bold text-gray-500 whitespace-nowrap"><i class="fa-regular fa-calendar mr-1"></i>' + C.esc(C.fmtDate(item.date)) + ', ' + C.esc(C.weekday(item.date)) + '</span>' +
                    locationBadge + stateBadge +
                '</div>' +
                '<div class="relative shrink-0">' +
                    '<button data-menu="' + item.id + '" class="text-gray-400 w-8 h-8 -mr-2 -mt-1 flex items-center justify-center" aria-label="Menyu"><i class="fa-solid fa-ellipsis-vertical"></i></button>' +
                    '<div id="menu-' + item.id + '" class="menu hidden absolute right-0 top-7 bg-white border border-gray-100 rounded-xl shadow-lg z-20 py-1 w-32 text-xs">' +
                        '<button data-edit="' + item.id + '" class="w-full text-left px-3 py-2 text-gray-700 flex items-center"><i class="fa-solid fa-pen-to-square mr-2 text-blue-500"></i> Redaktə et</button>' +
                        '<button data-del="' + item.id + '" class="w-full text-left px-3 py-2 text-red-600 flex items-center"><i class="fa-solid fa-trash-can mr-2"></i> Sil</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="flex items-center justify-between my-2 gap-2">' +
                '<div class="flex items-center gap-2 min-w-0">' +
                    '<i class="fa-solid ' + C.sportIcon(item.sport) + ' text-base"></i>' +
                    '<h3 class="font-bold text-sm text-gray-900 leading-snug">' + C.esc(item.match) + '</h3>' +
                '</div>' +
                broadcastBadge +
            '</div>' +
            (item.venue ? '<p class="text-[11px] text-gray-500 -mt-1 mb-1"><i class="fa-solid fa-location-dot mr-1 text-gray-400"></i>' + C.esc(item.venue) + '</p>' : '') +
            (item.sts ? '<p class="text-[11px] text-gray-500 mb-1"><i class="fa-solid fa-truck mr-1 text-gray-400"></i>STS: <span class="font-semibold text-gray-700">' + C.esc(item.sts) + '</span></p>' : '') +
            (item.flash ? '<p class="text-[11px] text-gray-500 mb-1"><i class="fa-solid fa-bolt mr-1 text-amber-500"></i>Matçönü + flaş: <span class="font-semibold text-gray-700">' + C.esc(item.flash) + '</span></p>' : '') +
            '<div class="weather text-xs text-sky-700 bg-sky-50 px-2.5 py-2 rounded-xl my-2 border border-sky-100 font-medium" data-wx="' + item.id + '">' + weatherHTML(item) + '</div>' +
            '<div class="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-gray-100">' +
                '<div class="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5 text-center">' +
                    '<span class="text-[10px] text-blue-600 uppercase font-bold tracking-wide block mb-0.5">Yığışma Saatı</span>' +
                    '<span class="text-base font-black text-blue-900">' + C.esc(item.gather || '—') + '</span>' +
                    (item.gatherNote ? ' <span class="text-[10px] font-black text-blue-700 bg-blue-100 rounded px-1 align-middle">' + C.esc(item.gatherNote) + '</span>' : '') +
                '</div>' +
                '<div class="bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-center">' +
                    '<span class="text-[10px] text-gray-500 uppercase font-bold tracking-wide block mb-0.5">Başlama Saatı</span>' +
                    '<span class="text-base font-black text-gray-900">' + C.esc(item.start || '—') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function wxRow(label, w) {
        if (!w) return '<div class="flex items-center gap-1.5 text-sky-600/80"><span class="w-16 shrink-0 text-[10px] font-bold uppercase text-sky-600">' + label + '</span><span class="text-[11px]">Proqnoz yoxdur</span></div>';
        const precip = (w.snow > 0 ? 'qar ' + w.snow + ' sm' : (w.precip > 0 ? 'yağış ' + w.precip + ' mm' : ''));
        return '<div class="flex items-start gap-1.5">' +
            '<span class="w-16 shrink-0 text-[10px] font-bold uppercase text-sky-600 pt-0.5">' + label + ' ' + C.esc(w.time) + '</span>' +
            '<div class="min-w-0 flex-1">' +
                '<div class="flex items-center gap-1.5"><i class="fa-solid ' + w.icon + '"></i><strong>' + w.temp + '°C, ' + C.esc(w.txt) + ' ' + w.emoji + '</strong></div>' +
                '<div class="text-[10px] text-sky-600 mt-0.5 flex flex-wrap gap-x-2">' +
                    '<span><i class="fa-solid fa-droplet mr-0.5"></i>Yağıntı ehtimalı ' + (w.prob != null ? w.prob : '—') + '%</span>' +
                    (precip ? '<span>' + C.esc(precip) + '</span>' : '') +
                    '<span><i class="fa-solid fa-wind mr-0.5"></i>' + w.wind + ' km/s' + (w.gust ? ' (külək zərbəsi ' + w.gust + ')' : '') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function weatherHTML(item) {
        const w = weatherCache[item.id];
        if (w === undefined) return '<div class="flex items-center gap-1.5"><i class="fa-solid fa-spinner fa-spin text-sky-400"></i><span>Hava proqnozu yüklənir…</span></div>';
        if (w === null || w === 'error') {
            const d = C.parseISO(item.date);
            const days = d ? (d - new Date()) / 864e5 : 0;
            const msg = w === 'error' ? 'Hava proqnozu alınmadı (internet bağlantısını yoxlayın)'
                : days > 15 ? 'Proqnoz hələ açıqlanmayıb (16 gündən uzaq tarix)'
                : days < -2 ? 'Keçmiş tarix üçün proqnoz göstərilmir'
                : 'Bu tarix və yer üçün proqnoz mövcud deyil';
            return '<div class="flex items-center gap-1.5 text-sky-600"><i class="fa-solid fa-cloud text-sky-300"></i><span>' + msg + '</span></div>';
        }
        return '<div class="flex items-center justify-between mb-1.5"><span class="text-[10px] font-bold uppercase tracking-wide text-sky-600"><i class="fa-solid fa-cloud-sun mr-1"></i>Hava proqnozu · ' + C.esc(w.city) + '</span></div>' +
            '<div class="space-y-1.5">' +
                (w.day ? wxRow('Gün ərzində', w.day) : '') +
                (item.gather ? wxRow('Yığışma', w.gather) : '') +
                (item.start ? wxRow('Başlama', w.start) : '') +
            '</div>';
    }

    function loadWeather(items) {
        items.forEach(item => {
            if (weatherCache[item.id] !== undefined) return;
            C.weatherForShoot(item).then(w => { weatherCache[item.id] = w; }).catch(() => { weatherCache[item.id] = 'error'; }).then(() => {
                const el = document.querySelector('[data-wx="' + item.id + '"]');
                if (el) el.innerHTML = weatherHTML(item);
            });
        });
    }

    function renderSchedules() {
        const list = $('schedule-list');
        const mine = myShoots();
        const active = mine.filter(s => status(s) === 'active').sort((a, b) => sortKey(a) - sortKey(b));
        const done = mine.filter(s => status(s) === 'completed').sort((a, b) => sortKey(b) - sortKey(a));

        if (!mine.length) {
            list.innerHTML = '<div class="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-300">' +
                '<i class="fa-regular fa-calendar-xmark text-3xl text-gray-300 mb-2"></i>' +
                '<p class="text-sm font-semibold text-gray-600">Hələ çəkiliş yoxdur</p>' +
                '<p class="text-xs text-gray-400 mt-1">"Yüklə" düyməsi ilə Excel qrafikini seçin və ya çəkilişi "Əllə əlavə et" ilə yazın.</p>' +
                '</div>';
        } else {
            let html = active.map((s, i) => cardHTML(s, { next: i === 0 })).join('');
            if (done.length) {
                html += '<div class="flex items-center gap-2 pt-2"><div class="h-px bg-gray-200 flex-1"></div><span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tamamlananlar (' + done.length + ')</span><div class="h-px bg-gray-200 flex-1"></div></div>';
                html += done.map(s => cardHTML(s, {})).join('');
            }
            list.innerHTML = html;
            loadWeather(active.concat(done));
        }
    }

    // ---------- Bütün komanda ----------
    function renderTeam() {
        const q = C.norm($('team-search').value);
        const list = $('team-list');
        const map = {};
        state.shoots.forEach(s => (s.crew || []).forEach(n => {
            const key = Object.keys(map).find(k => C.nameMatch(k, n) && C.norm(k).split(' ').length === C.norm(n).split(' ').length) || n;
            (map[key] = map[key] || []).push(s);
        }));
        let names = Object.keys(map);
        names = names.filter(n => {
            if (!q) return true;
            const role = state.people[n] || '';
            return C.norm(n).includes(q) || C.norm(role).includes(q) || map[n].some(s => C.norm(s.match).includes(q));
        }).sort((a, b) => a.localeCompare(b, 'az'));

        if (!Object.keys(map).length) {
            list.innerHTML = '<p class="text-xs text-center text-gray-400 py-8">Komanda bölgüsü Excel qrafikindən oxunur.<br>Qrafik yükləndikdən sonra burada görünəcək.</p>';
            return;
        }
        if (!names.length) { list.innerHTML = '<p class="text-xs text-center text-gray-400 py-6">Nəticə tapılmadı.</p>'; return; }

        list.innerHTML = names.map(n => {
            const role = state.people[n] || '';
            const items = map[n].slice().sort((a, b) => sortKey(a) - sortKey(b));
            const me = C.nameMatch(n, state.profile.name);
            return '<div class="bg-white p-3.5 rounded-2xl border ' + (me ? 'border-blue-200' : 'border-gray-100') + ' shadow-sm text-xs">' +
                '<div class="flex items-center gap-2.5 mb-2">' +
                    '<div class="w-8 h-8 rounded-full ' + (me ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600') + ' font-bold flex items-center justify-center text-[11px] shrink-0">' + C.esc(C.initials(n)) + '</div>' +
                    '<div class="min-w-0"><h4 class="font-bold text-gray-900 truncate">' + C.esc(n) + (me ? ' <span class="text-[9px] text-blue-600">(Siz)</span>' : '') + '</h4>' +
                    (role ? '<p class="text-[10px] text-blue-600 font-semibold">' + C.esc(role) + '</p>' : '') + '</div>' +
                    '<span class="ml-auto text-[10px] font-bold text-gray-400 shrink-0">' + items.length + ' çəkiliş</span>' +
                '</div>' +
                '<div class="space-y-1.5">' + items.map(s => {
                    const trip = C.isTrip(s.venue);
                    const city = C.detectCity(s.venue).name;
                    const done = status(s) === 'completed';
                    return '<div class="flex items-center justify-between gap-2 ' + (done ? 'opacity-50' : '') + '">' +
                        '<p class="text-gray-600 min-w-0 truncate"><i class="fa-regular fa-calendar mr-1 text-gray-400"></i>' + C.esc(C.fmtDate(s.date)) + ' · ' + C.esc(s.start || '') + ' — <span class="font-semibold text-gray-800">' + C.esc(s.match) + '</span></p>' +
                        '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ' + (trip ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700') + '">' + (trip ? '<i class="fa-solid fa-bus mr-1"></i>' : '') + C.esc(city) + '</span>' +
                    '</div>';
                }).join('') + '</div>' +
            '</div>';
        }).join('');
    }

    // ---------- Statistika ----------
    function allMine() {
        const seen = new Set();
        return state.archive.concat(myShoots()).filter(s => {
            const k = s.date + '|' + C.norm(s.match);
            if (seen.has(k)) return false;
            seen.add(k); return true;
        });
    }
    function fillMonths() {
        const sel = $('stats-month');
        const months = new Set(allMine().map(s => C.monthKey(s.date)));
        months.add(C.monthKey(C.todayISO()));
        const keys = Array.from(months).filter(Boolean).sort().reverse();
        const cur = sel.value || C.monthKey(C.todayISO());
        sel.innerHTML = keys.map(k => '<option value="' + k + '"' + (k === cur ? ' selected' : '') + '>' + C.monthLabel(k) + '</option>').join('');
    }
    function updateStats() {
        const key = $('stats-month').value;
        const items = allMine().filter(s => C.monthKey(s.date) === key);
        const trips = items.filter(s => C.isTrip(s.venue));
        const tripDays = new Set(trips.map(s => s.date)).size;
        $('stat-total').textContent = items.length;
        $('stat-ezam').textContent = tripDays + ' gün';
        $('stat-baku').textContent = items.length - trips.length;
        $('stat-live').textContent = items.filter(s => s.type !== 'yazı').length;
        $('stat-rec').textContent = items.filter(s => s.type === 'yazı').length;
        $('stat-list').innerHTML = items.sort((a, b) => sortKey(a) - sortKey(b)).map(s =>
            '<div class="flex justify-between text-[11px] text-gray-600 px-1"><span class="truncate">' + C.esc(C.fmtDate(s.date)) + ' — ' + C.esc(s.match) + '</span><span class="shrink-0 ml-2 ' + (C.isTrip(s.venue) ? 'text-emerald-700' : 'text-gray-400') + '">' + C.esc(C.detectCity(s.venue).name) + '</span></div>'
        ).join('');
    }

    // ---------- Əllə əlavə / Redaktə ----------
    function setDateField(iso) {
        const b = $('f-date'), d = C.parseISO(iso);
        b.dataset.date = d ? iso : '';
        $('f-date-day').textContent = d ? C.pad(d.getDate()) : '--';
        $('f-date-mon').textContent = d ? C.MONTHS[d.getMonth()].slice(0, 3) : '';
        $('f-date-main').textContent = d ? C.fmtDMY(iso) : 'Tarix seçin';
        $('f-date-sub').textContent = d ? C.weekday(iso) + ' · ' + C.fmtDate(iso) : '';
    }
    function clearErrors() {
        document.querySelectorAll('#edit-form .err').forEach(e => { e.classList.add('hidden'); e.textContent = ''; });
        document.querySelectorAll('#edit-form .field-error').forEach(e => e.classList.remove('field-error'));
    }
    function setError(id, msg) {
        const e = document.querySelector('#edit-form [data-err="' + id + '"]');
        if (e) { e.textContent = msg; e.classList.remove('hidden'); }
        $(id).classList.add('field-error');
    }
    function clearError(id) {
        const e = document.querySelector('#edit-form [data-err="' + id + '"]');
        if (e) { e.classList.add('hidden'); e.textContent = ''; }
        $(id).classList.remove('field-error');
    }

    function openEdit(id) {
        $('edit-form').reset();
        clearErrors();
        const item = id ? state.shoots.find(s => s.id === id) : null;
        $('edit-title').textContent = item ? 'Çəkilişi Redaktə Et' : 'Yeni Çəkiliş Əlavə Et';
        $('f-id').value = item ? item.id : '';
        setDateField(item ? item.date : C.todayISO());
        $('f-gather').value = item ? (item.gather || '') : '';
        $('f-start').value = item ? (item.start || '') : '';
        $('f-gnote').value = item ? (item.gatherNote || '') : '';
        $('f-match').value = item ? item.match : '';
        $('f-venue').value = item ? item.venue : '';
        $('f-sport').value = item ? item.sport : 'Futbol';
        $('f-type').value = item ? item.type : 'canlı';
        openModal('edit-modal');
    }

    function validateForm() {
        clearErrors();
        const errs = [];
        const iso = $('f-date').dataset.date;
        if (!iso || !C.parseISO(iso)) errs.push(['f-date', 'Tarix mütləqdir — təqvimdən seçin.']);
        const gt = $('f-gather').value.trim(), st = $('f-start').value.trim();
        if (!gt) errs.push(['f-gather', 'Yığışma saatı mütləqdir.']);
        else if (!C.timePicker.isValid(gt)) errs.push(['f-gather', 'Saatı 24 saat formatında yazın (məs: 07:30).']);
        if (st && !C.timePicker.isValid(st)) errs.push(['f-start', 'Saatı 24 saat formatında yazın (məs: 15:30).']);
        if (!$('f-gnote').value.trim()) errs.push(['f-gnote', 'Yığışma qeydi mütləqdir.']);
        if (!$('f-match').value.trim()) errs.push(['f-match', 'Çəkilişin adını daxil edin.']);
        errs.forEach(([id, msg]) => setError(id, msg));
        if (errs.length) {
            const first = $(errs[0][0]);
            first.scrollIntoView({ block: 'center', behavior: 'smooth' });
            if (first.tagName === 'INPUT') first.focus({ preventScroll: true });
            return null;
        }
        return iso;
    }

    function saveEdit(e) {
        e.preventDefault();
        const iso = validateForm();
        if (!iso) return;
        const id = $('f-id').value;
        const old = id ? state.shoots.find(s => s.id === id) : null;
        const item = Object.assign({}, old || { id: C.uid(), manual: true, crew: [] }, {
            date: iso,
            gather: $('f-gather').value.trim(),
            start: $('f-start').value.trim(),
            gatherNote: $('f-gnote').value.trim(),
            match: $('f-match').value.trim(),
            venue: $('f-venue').value.trim(),
            sport: $('f-sport').value,
            type: $('f-type').value
        });
        delete item.weather; // köhnə əl ilə yazılmış hava dəyərləri artıq istifadə olunmur
        if (old) {
            if (isMine(old)) item.mine = true; // redaktə olunan çəkiliş istifadəçidə qalır
            state.shoots[state.shoots.indexOf(old)] = item;
        } else state.shoots.push(item);
        delete weatherCache[item.id];
        save();
        closeModal('edit-modal');
        refresh();
        toast(old ? 'Dəyişikliklər yadda saxlanıldı' : 'Çəkiliş əlavə olundu');
    }
    async function deleteShoot(id) {
        const item = state.shoots.find(s => s.id === id);
        if (!item) return;
        if (!(await confirmBox('"' + item.match + '" çəkilişini silmək istədiyinizə əminsiniz?'))) return;
        state.shoots = state.shoots.filter(s => s.id !== id);
        save();
        refresh();
        toast('Çəkiliş silindi');
    }

    // Tarix: müasir təqvim (X — bağla, Təsdiq et — tətbiq et)
    function bindDateField() {
        $('f-date').addEventListener('click', async () => {
            const v = await C.datePicker.open($('f-date').dataset.date);
            if (v) { setDateField(v); clearError('f-date'); }
        });
    }
    // Saat: 24 saat formatında yazmaq (məs. 1530 → 15:30) və ya təkərlə seçmək
    function bindTimeFields() {
        document.querySelectorAll('.time-input').forEach(inp => {
            inp.addEventListener('input', () => {
                const pos = inp.value.length;
                inp.value = C.timePicker.mask(inp.value);
                if (C.timePicker.isValid(inp.value)) clearError(inp.id);
            });
            inp.addEventListener('blur', () => {
                const v = inp.value.trim();
                if (/^\d{2}$/.test(v) && +v < 24) inp.value = v + ':00';
                if (inp.value && !C.timePicker.isValid(inp.value)) setError(inp.id, 'Saatı 24 saat formatında yazın (məs: 15:30).');
            });
        });
        document.querySelectorAll('[data-tp]').forEach(b => {
            b.addEventListener('click', async () => {
                const inp = $(b.dataset.tp);
                const v = await C.timePicker.open(b.dataset.title, inp.value || (inp.id === 'f-start' ? $('f-gather').value : ''));
                if (v) { inp.value = v; clearError(inp.id); }
            });
        });
        ['f-gnote', 'f-match'].forEach(id => $(id).addEventListener('input', () => { if ($(id).value.trim()) clearError(id); }));
    }

    // ---------- Qrafik yükləmə: seç → təsdiq et → oxu ----------
    function showUploadResult(kind, html) {
        const r = $('upload-result');
        const cls = { ok: 'bg-emerald-50 text-emerald-800 border border-emerald-100', warn: 'bg-amber-50 text-amber-800 border border-amber-200', err: 'bg-red-50 text-red-700 border border-red-100', info: 'bg-blue-50 text-blue-800 border border-blue-100' };
        r.className = 'text-xs rounded-xl p-3 leading-relaxed ' + (cls[kind] || cls.info);
        r.innerHTML = html;
        r.classList.remove('hidden');
    }
    function renderHistory() {
        const list = $('history-list');
        $('view-image').classList.toggle('hidden', !state.meta.image);
        if (!state.history.length) { list.innerHTML = '<p class="text-[11px] text-gray-400">Hələ heç bir qrafik təsdiqlənməyib.</p>'; return; }
        list.innerHTML = state.history.slice().reverse().map((h, i) => {
            const d = h.diff || {};
            const per = h.period ? C.fmtDMY(h.period[0]) + ' – ' + C.fmtDMY(h.period[1]) : '';
            return '<div class="border ' + (i === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-gray-50') + ' rounded-xl p-2.5 text-[11px]">' +
                '<div class="flex justify-between gap-2"><span class="font-bold text-gray-900">v' + h.version + (i === 0 ? ' · aktiv' : '') + '</span><span class="text-gray-400">' + new Date(h.uploadedAt).toLocaleString('az-AZ', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) + '</span></div>' +
                '<p class="text-gray-600 break-all">' + C.esc(h.fileName) + '</p>' +
                '<p class="text-gray-500">Dövr: ' + per + ' · sizin üçün ' + h.myCount + ' çəkiliş' +
                (h.prevVersion ? ' · əvvəlki (v' + h.prevVersion + ') ilə: +' + (d.added || 0) + ' / −' + (d.removed || 0) + ' / ✎' + (d.changed || 0) : '') + '</p>' +
            '</div>';
        }).join('');
    }
    function openHistory() {
        $('upload-result').classList.add('hidden');
        renderHistory();
        openModal('upload-modal');
    }

    function onFileChosen(file) {
        if (!file) return;
        pendingFile = file;
        const img = isImageFile(file);
        $('cu-name').textContent = file.name;
        $('cu-meta').textContent = (img ? 'Şəkil' : /\.csv$/i.test(file.name) ? 'CSV cədvəl' : 'Excel cədvəl') + ' · ' + fileSize(file.size);
        $('cu-icon').innerHTML = '<i class="fa-solid ' + (img ? 'fa-file-image' : 'fa-file-excel') + '"></i>';
        $('cu-text').innerHTML = img
            ? 'Diqqət: şəkildən cədvəlin avtomatik oxunması <strong>hələ mövcud deyil</strong>. Təsdiq etsəniz, şəkil yalnız baxmaq üçün saxlanılacaq; çəkilişlər idxal olunmayacaq.'
            : 'Təsdiq etdikdən sonra fayl oxunacaq və yalnız <strong>' + C.esc(state.profile.name) + '</strong> adına olan çəkilişlər əsas səhifədə göstəriləcək. Eyni dövr üçün köhnə qrafik bu versiya ilə əvəzlənəcək.';
        closeModal('upload-modal');
        openModal('confirm-upload-modal');
    }
    function cancelUpload() {
        pendingFile = null;
        closeModal('confirm-upload-modal');
        toast('Yükləmə ləğv edildi — heç nə dəyişmədi');
    }

    function shootKey(s) { return s.date + '|' + C.norm(s.match); }
    function diffMine(oldList, newList) {
        const o = new Map(oldList.map(s => [shootKey(s), s]));
        const n = new Map(newList.map(s => [shootKey(s), s]));
        let added = 0, removed = 0, changed = 0;
        const details = [];
        n.forEach((s, k) => {
            const p = o.get(k);
            if (!p) { added++; details.push('➕ ' + C.fmtDMY(s.date) + ' ' + s.match); return; }
            const diffs = [];
            if ((p.gather || '') !== (s.gather || '')) diffs.push('yığışma ' + (p.gather || '—') + '→' + (s.gather || '—'));
            if ((p.start || '') !== (s.start || '')) diffs.push('başlama ' + (p.start || '—') + '→' + (s.start || '—'));
            if (C.norm(p.venue) !== C.norm(s.venue)) diffs.push('yer dəyişdi');
            if (p.type !== s.type) diffs.push('yayım növü');
            if ((p.gatherNote || '') !== (s.gatherNote || '')) diffs.push('qeyd');
            if (diffs.length) { changed++; details.push('✎ ' + C.fmtDMY(s.date) + ' ' + s.match + ': ' + diffs.join(', ')); }
        });
        o.forEach((s, k) => { if (!n.has(k)) { removed++; details.push('➖ ' + C.fmtDMY(s.date) + ' ' + s.match); } });
        return { added, removed, changed, details };
    }

    function applyNewSchedule(res, fileName) {
        const dates = res.shoots.map(s => s.date).sort();
        const period = [dates[0], dates[dates.length - 1]];
        const inPeriod = s => s.date >= period[0] && s.date <= period[1];
        // Eyni dövrün əvvəlki idxal olunmuş versiyası (əllə əlavə edilənlər toxunulmur)
        const prevImported = state.shoots.filter(s => !s.manual && inPeriod(s));
        const prevMine = prevImported.filter(isMine);
        const newMine = res.shoots.filter(s => s.crew.some(n => C.nameMatch(n, state.profile.name)));
        const prevVersion = prevImported.length ? (prevImported[0].version || state.meta.version || null) : null;
        const diff = diffMine(prevMine, newMine);

        const version = (state.meta.version || 0) + 1;
        res.shoots.forEach(s => { s.version = version; });
        // Son təsdiqlənmiş versiya həmin dövr üçün əsasdır
        state.shoots = state.shoots.filter(s => s.manual || !inPeriod(s)).concat(res.shoots);
        Object.keys(res.people).forEach(n => { state.people[n] = res.people[n] || state.people[n] || ''; });
        state.history.push({
            version, prevVersion, uploadedAt: Date.now(), fileName, period,
            myCount: newMine.length, total: res.shoots.length,
            diff: { added: diff.added, removed: diff.removed, changed: diff.changed },
            previous: prevImported // əvvəlki versiyanın surəti tarixçədə saxlanılır
        });
        if (state.history.length > HISTORY_MAX) state.history = state.history.slice(-HISTORY_MAX);
        state.meta = Object.assign({}, state.meta, { version, uploadedAt: Date.now(), fileName });
        Object.keys(weatherCache).forEach(k => delete weatherCache[k]);
        save();
        return { version, period, newMine, diff, prevVersion };
    }

    async function confirmUpload() {
        const file = pendingFile;
        pendingFile = null;
        closeModal('confirm-upload-modal');
        if (!file) return;
        openModal('upload-modal');
        showUploadResult('info', '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Oxunur…');
        renderHistory();
        const name = file.name || 'fayl';
        try {
            if (isImageFile(file)) {
                state.meta.image = await resizeImage(file, 1800, 0.82);
                save();
                renderHistory();
                showUploadResult('warn', '<i class="fa-solid fa-triangle-exclamation mr-1"></i><strong>Şəkildən avtomatik oxuma hələ mövcud deyil.</strong><br>Şəkil yalnız baxmaq üçün saxlanıldı, heç bir çəkiliş idxal olunmadı. Çəkilişləri "Əllə əlavə et" ilə yaza və ya qrafiki Excel (.xlsx) formatında yükləyə bilərsiniz.');
                return;
            }
            let sheets;
            if (/\.csv$/i.test(name) || file.type === 'text/csv') sheets = C.readCsv(await file.text());
            else if (/\.xls$/i.test(name)) throw new Error('Köhnə .xls formatı dəstəklənmir. Faylı Excel-də "Save As → .xlsx" kimi saxlayın.');
            else sheets = await C.readXlsx(await file.arrayBuffer());

            const res = C.parseSchedule(sheets, { refYear: new Date().getFullYear() });
            if (!res.shoots.length) throw new Error(res.warnings.join(' ') || 'Cədvəldə çəkiliş tapılmadı.');

            const matched = res.shoots.filter(s => s.crew.some(n => C.nameMatch(n, state.profile.name)));
            if (!matched.length) {
                const crewCount = Object.keys(res.people).length;
                showUploadResult('warn', '<i class="fa-solid fa-user-xmark mr-1"></i><strong>"' + C.esc(state.profile.name) + '" adına çəkiliş tapılmadı.</strong><br>' +
                    'Qrafik <strong>idxal edilmədi</strong>, mövcud cədvəliniz dəyişməz qaldı.<br>' +
                    (crewCount ? 'Faylda ' + crewCount + ' əməkdaş və ' + res.shoots.length + ' çəkiliş var. Profil adınızın qrafikdəki yazılışla eyni olduğunu yoxlayın (adınıza toxunaraq dəyişə bilərsiniz).' : 'Faylda heyət bölgüsü (ad-soyad cədvəli) tapılmadı.'));
                return;
            }

            const r = applyNewSchedule(res, name);
            const d = r.diff;
            showUploadResult('ok',
                '<i class="fa-solid fa-circle-check mr-1"></i><strong>Qrafik v' + r.version + ' təsdiqləndi.</strong><br>' +
                'Dövr: ' + C.fmtDMY(r.period[0]) + ' – ' + C.fmtDMY(r.period[1]) + '. Sizin üçün <strong>' + r.newMine.length + '</strong> çəkiliş göstərilir.' +
                (r.prevVersion ? '<br>Əvvəlki versiya (v' + r.prevVersion + ') ilə müqayisə: ' + d.added + ' yeni, ' + d.changed + ' dəyişən, ' + d.removed + ' silinən.' +
                    (d.details.length ? '<div class="mt-1.5 space-y-0.5 text-[11px]">' + d.details.slice(0, 8).map(x => '<div>' + C.esc(x) + '</div>').join('') + '</div>' : '') : '') +
                (res.warnings.length ? '<br><span class="text-amber-700">⚠ ' + C.esc(res.warnings.join(' ')) + '</span>' : ''));
            renderHistory();
            refresh();
        } catch (err) {
            console.error(err);
            showUploadResult('err', '<i class="fa-solid fa-triangle-exclamation mr-1"></i>' + C.esc(err.message || 'Fayl oxunmadı') + '<br>Heç bir dəyişiklik edilmədi.');
        }
    }

    // ---------- Bildirişlər ----------
    async function syncNotifications() {
        const next = await C.notify.reschedule(myShoots(), state.notify.enabled);
        const el = $('notify-status');
        $('notify-toggle').checked = !!state.notify.enabled;
        if (!state.notify.enabled) { el.textContent = 'Söndürülüb'; el.className = 'text-[11px] text-amber-700/70 font-semibold mt-1.5'; return; }
        el.className = 'text-[11px] text-emerald-700 font-semibold mt-1.5';
        el.innerHTML = '<i class="fa-solid fa-circle-check mr-1"></i>Aktiv' + (next ? ' · növbəti bildiriş: ' + C.esc(C.fmtDate(C.isoDate(next))) + ', ' + C.pad(next.getHours()) + ':' + C.pad(next.getMinutes()) : ' · planlaşdırılmış bildiriş yoxdur') +
            (C.notify.isNative() ? '' : '<br><span class="text-amber-700 font-normal">Brauzer rejimində bildiriş yalnız tətbiq açıq olanda gəlir.</span>');
    }
    async function toggleNotify(e) {
        const want = e.target.checked;
        if (want) {
            const ok = await C.notify.requestPermission();
            if (!ok) { e.target.checked = false; toast('Bildiriş icazəsi verilmədi. Telefon ayarlarından icazə verin.', 4000); return; }
            state.notify.enabled = true;
            save();
            await syncNotifications();
            toast('Bildirişlər aktivdir');
        } else {
            state.notify.enabled = false;
            save();
            await syncNotifications();
        }
    }

    // ---------- Görünüş rejimi ----------
    const THEME_LABEL = { light: 'Aydın rejim', dark: 'Qaranlıq rejim', system: 'Sistem rejimi (telefona uyğun)' };
    const THEME_ICON = { light: 'fa-sun', dark: 'fa-moon', system: 'fa-circle-half-stroke' };
    const darkMQ = g.matchMedia ? g.matchMedia('(prefers-color-scheme: dark)') : null;
    function applyTheme() {
        const t = state.theme || 'system';
        const dark = t === 'dark' || (t === 'system' && darkMQ && darkMQ.matches);
        document.documentElement.classList.toggle('dark', dark);
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', dark ? '#111827' : '#ffffff');
        if ($('theme-icon')) $('theme-icon').className = 'fa-solid ' + THEME_ICON[t] + ' text-sm';
        document.querySelectorAll('#theme-seg [data-theme]').forEach(b => {
            const on = b.dataset.theme === t;
            b.classList.toggle('bg-white', on);
            b.classList.toggle('shadow-sm', on);
            b.classList.toggle('text-blue-600', on);
        });
        const SB = g.Capacitor && g.Capacitor.Plugins && g.Capacitor.Plugins.StatusBar;
        if (SB) {
            try {
                SB.setStyle({ style: dark ? 'DARK' : 'LIGHT' });
                if (SB.setBackgroundColor) SB.setBackgroundColor({ color: dark ? '#111827' : '#ffffff' });
            } catch (e) { /* */ }
        }
    }
    function setTheme(t, silent) {
        state.theme = t;
        save();
        applyTheme();
        if (!silent) toast(THEME_LABEL[t]);
    }

    // ---------- Ümumi ----------
    function refresh() {
        renderProfile();
        renderSchedules();
        if (currentTab === 'team') renderTeam();
        syncNotifications();
    }
    function switchTab(tab) {
        currentTab = tab;
        $('section-my').classList.toggle('hidden', tab !== 'my');
        $('section-team').classList.toggle('hidden', tab !== 'team');
        $('tab-my').className = 'tab-btn flex-1 py-3 text-center text-sm transition ' + (tab === 'my' ? 'active-tab' : 'text-gray-500');
        $('tab-team').className = 'tab-btn flex-1 py-3 text-center text-sm transition ' + (tab === 'team' ? 'active-tab' : 'text-gray-500');
        if (tab === 'team') renderTeam();
    }

    function bind() {
        document.querySelectorAll('.tab-btn').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
        document.addEventListener('click', e => {
            const close = e.target.closest('[data-close]');
            if (close) { closeModal(close.dataset.close); return; }
            if (e.target.classList.contains('modal') && e.target.id !== 'tp-modal' && e.target.id !== 'dp-modal') {
                if (e.target.id === 'confirm-upload-modal') { cancelUpload(); return; }
                closeModal(e.target.id); return;
            }
            const m = e.target.closest('[data-menu]');
            const open = m ? $('menu-' + m.dataset.menu) : null;
            document.querySelectorAll('.menu').forEach(el => { if (el !== open) el.classList.add('hidden'); });
            if (open) { open.classList.toggle('hidden'); return; }
            const ed = e.target.closest('[data-edit]');
            if (ed) { openEdit(ed.dataset.edit); return; }
            const del = e.target.closest('[data-del]');
            if (del) { deleteShoot(del.dataset.del); }
        });

        $('open-stats').onclick = () => { fillMonths(); updateStats(); openModal('stats-modal'); };
        $('stats-month').onchange = updateStats;

        // Yüklə → fayl seçimi → təsdiq pəncərəsi
        $('open-upload').onclick = () => $('schedule-input').click();
        $('pick-file').onclick = () => $('schedule-input').click();
        $('schedule-input').onchange = e => { const f = e.target.files[0]; e.target.value = ''; onFileChosen(f); };
        $('cu-ok').onclick = confirmUpload;
        $('cu-cancel').onclick = cancelUpload;
        $('cu-x').onclick = cancelUpload;
        $('version-label').onclick = openHistory;
        $('view-image').onclick = () => { $('image-view').src = state.meta.image; openModal('image-modal'); };

        $('add-shoot').onclick = () => openEdit(null);
        $('edit-form').onsubmit = saveEdit;
        bindDateField();
        bindTimeFields();

        $('team-search').addEventListener('input', renderTeam);

        $('avatar-btn').onclick = () => $('avatar-input').click();
        $('avatar-input').onchange = async e => {
            const f = e.target.files[0];
            e.target.value = '';
            if (!f) return;
            try { state.profile.avatar = await resizeImage(f, 256, 0.85); save(); renderProfile(); }
            catch (err) { toast('Şəkil oxunmadı'); }
        };
        $('profile-btn').onclick = () => { $('pf-name').value = state.profile.name; $('pf-role').value = state.profile.role; openModal('profile-modal'); };
        $('profile-form').onsubmit = e => {
            e.preventDefault();
            state.profile.name = $('pf-name').value.trim();
            state.profile.role = $('pf-role').value.trim();
            save(); closeModal('profile-modal'); refresh();
            toast('Profil yeniləndi');
        };
        $('remove-avatar').onclick = () => { state.profile.avatar = null; save(); renderProfile(); toast('Profil şəkli silindi'); };

        $('notify-toggle').addEventListener('change', toggleNotify);

        const order = ['light', 'dark', 'system'];
        if ($('theme-btn')) $('theme-btn').onclick = () => setTheme(order[(order.indexOf(state.theme || 'system') + 1) % 3]);
        g.addEventListener('resize', fitName);
        document.querySelectorAll('#theme-seg [data-theme]').forEach(b => { b.onclick = () => setTheme(b.dataset.theme); });
        if (darkMQ) {
            const onSys = () => { if ((state.theme || 'system') === 'system') applyTheme(); };
            darkMQ.addEventListener ? darkMQ.addEventListener('change', onSys) : darkMQ.addListener(onSys);
        }

        // Statusları dəqiqədə bir yenilə; tətbiqə qayıdanda da
        setInterval(renderSchedules, 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
        // Android geri düyməsi: açıq pəncərəni bağla
        const App = g.Capacitor && g.Capacitor.Plugins && g.Capacitor.Plugins.App;
        if (App && App.addListener) {
            App.addListener('backButton', () => {
                if (C.timePicker.isOpen()) { C.timePicker.close(); return; }
                if (C.datePicker.isOpen()) { C.datePicker.close(); return; }
                const open = Array.from(document.querySelectorAll('.modal')).reverse().find(m => !m.classList.contains('hidden'));
                if (open) { if (open.id === 'confirm-upload-modal') cancelUpload(); else closeModal(open.id); }
                else if (currentTab !== 'my') switchTab('my'); else App.exitApp();
            });
        }
    }

    function init() {
        bind();
        applyTheme();
        refresh();
        const SS = g.Capacitor && g.Capacitor.Plugins && g.Capacitor.Plugins.SplashScreen;
        if (SS) setTimeout(() => SS.hide(), 300);
        if ('serviceWorker' in navigator && !(g.Capacitor && g.Capacitor.isNativePlatform && g.Capacitor.isNativePlatform()) && location.protocol === 'https:') {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})(window);
