/* CBC Sport Broadcast — əsas tətbiq məntiqi */
(function (g) {
    'use strict';
    const C = g.CBC;
    const $ = id => document.getElementById(id);
    const STORE = 'cbc_sport_broadcast_v1';
    const SHOOT_DURATION_H = 3; // başlamadan sonra neçə saata "Tamamlandı" sayılır

    // ---------- Vəziyyət ----------
    let state = load();
    let currentTab = 'my';
    const weatherCache = {};

    function defaultState() {
        const s = C.sampleData();
        return {
            profile: { name: 'Hüseynov Tamerlan', role: 'Rejissor', avatar: null },
            shoots: s.shoots,
            people: s.people,
            archive: [],
            meta: { version: 0, uploadedAt: null, fileName: null, image: null, sample: true },
            notify: { enabled: false },
            theme: 'system'
        };
    }
    function load() {
        try {
            const raw = localStorage.getItem(STORE);
            if (raw) return Object.assign(defaultState(), JSON.parse(raw));
        } catch (e) { /* */ }
        return defaultState();
    }
    function save() {
        try { localStorage.setItem(STORE, JSON.stringify(state)); }
        catch (e) { toast('Yaddaş doludur — şəkil ölçüsünü kiçildin'); }
    }

    // ---------- Köməkçilər ----------
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

    function isMine(s) {
        if (s.mine) return true;
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
        $('profile-role').textContent = state.profile.role || 'Vəzifə';
        const av = $('avatar-container');
        if (state.profile.avatar) av.innerHTML = '<img src="' + state.profile.avatar + '" alt="" class="w-full h-full object-cover">';
        else av.textContent = C.initials(state.profile.name);
        $('version-label').textContent = state.meta.version ? 'Qrafik v' + state.meta.version : '';
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
            '<div class="weather flex items-center gap-1.5 text-xs text-sky-700 bg-sky-50 px-2.5 py-1.5 rounded-xl my-2 border border-sky-100 font-medium" data-wx="' + item.id + '">' + weatherHTML(item) + '</div>' +
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

    function weatherHTML(item) {
        if (item.weather) return '<i class="fa-solid fa-cloud-sun text-sky-500"></i><span>Hava proqnozu: <strong>' + C.esc(item.weather) + '</strong></span>';
        const w = weatherCache[item.id];
        if (w === undefined) return '<i class="fa-solid fa-spinner fa-spin text-sky-400"></i><span>Hava proqnozu yüklənir…</span>';
        if (w === null) {
            const d = C.parseISO(item.date);
            const far = d && (d - new Date()) / 864e5 > 15;
            return '<i class="fa-solid fa-cloud text-sky-300"></i><span class="text-sky-600">' + (far ? 'Proqnoz hələ açıqlanmayıb' : 'Hava məlumatı yoxdur') + '</span>';
        }
        return '<i class="fa-solid ' + w.icon + '"></i><span><strong>' + w.temp + '°C, ' + C.esc(w.txt) + ' ' + w.emoji + '</strong></span>' +
            '<span class="ml-auto text-[10px] text-sky-600 whitespace-nowrap"><i class="fa-solid fa-wind mr-0.5"></i>' + w.wind + ' km/s' + (w.rain != null && w.rain > 0 ? ' · <i class="fa-solid fa-droplet mr-0.5"></i>' + w.rain + '%' : '') + '</span>';
    }

    function loadWeather(items) {
        items.forEach(item => {
            if (item.weather || weatherCache[item.id] !== undefined) return;
            C.weatherForShoot(item).then(w => { weatherCache[item.id] = w; }).catch(() => { weatherCache[item.id] = null; }).then(() => {
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
        $('sample-banner').classList.toggle('hidden', !state.meta.sample);

        if (!mine.length) {
            const hasShoots = state.shoots.length > 0;
            list.innerHTML = '<div class="bg-white rounded-2xl p-6 text-center border border-dashed border-gray-300">' +
                '<i class="fa-regular fa-calendar-xmark text-3xl text-gray-300 mb-2"></i>' +
                '<p class="text-sm font-semibold text-gray-600">' + (hasShoots ? 'Bu həftə sizin adınıza çəkiliş tapılmadı' : 'Hələ qrafik yüklənməyib') + '</p>' +
                '<p class="text-xs text-gray-400 mt-1">' + (hasShoots ? 'Profil adınızın qrafikdəki yazılışla eyni olduğunu yoxlayın.' : '"Yüklə" düyməsi ilə Excel qrafikini əlavə edin və ya çəkilişi əllə yazın.') + '</p>' +
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

    // ---------- Əlavə / Redaktə ----------
    function openEdit(id) {
        const f = $('edit-form');
        f.reset();
        const item = id ? state.shoots.find(s => s.id === id) : null;
        $('edit-title').textContent = item ? 'Çəkilişi Redaktə Et' : 'Yeni Çəkiliş Əlavə Et';
        $('f-id').value = item ? item.id : '';
        $('f-date').value = item ? item.date : C.todayISO();
        $('f-gather').value = item ? item.gather : '';
        $('f-start').value = item ? item.start : '';
        $('f-gnote').value = item ? (item.gatherNote || '') : '';
        $('f-match').value = item ? item.match : '';
        $('f-venue').value = item ? item.venue : '';
        $('f-sport').value = item ? item.sport : 'Futbol';
        $('f-type').value = item ? item.type : 'canlı';
        $('f-weather').value = item ? (item.weather || '') : '';
        $('f-crew').value = item ? (item.crew || []).join(', ') : '';
        openModal('edit-modal');
    }
    function saveEdit(e) {
        e.preventDefault();
        const id = $('f-id').value;
        const old = id ? state.shoots.find(s => s.id === id) : null;
        const item = Object.assign({}, old || { id: C.uid(), mine: true }, {
            date: $('f-date').value,
            gather: $('f-gather').value,
            start: $('f-start').value,
            gatherNote: $('f-gnote').value.trim(),
            match: $('f-match').value.trim(),
            venue: $('f-venue').value.trim(),
            sport: $('f-sport').value,
            type: $('f-type').value,
            weather: $('f-weather').value.trim(),
            crew: $('f-crew').value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean)
        });
        if (old) {
            // Redaktə olunan çəkiliş istifadəçidə qalmalıdır
            if (isMine(old)) item.mine = true;
            state.shoots[state.shoots.indexOf(old)] = item;
        } else state.shoots.push(item);
        item.crew.forEach(n => { if (!(n in state.people)) state.people[n] = ''; });
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

    // ---------- Qrafik yükləmə ----------
    function showUploadResult(ok, html) {
        const r = $('upload-result');
        r.className = 'text-xs rounded-xl p-3 ' + (ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100');
        r.innerHTML = html;
    }
    function renderUploadMeta() {
        $('current-version').textContent = state.meta.version
            ? 'Cari versiya: v' + state.meta.version + ' · ' + (state.meta.fileName || '') + ' · ' + new Date(state.meta.uploadedAt).toLocaleString('az-AZ')
            : '';
        $('view-image').classList.toggle('hidden', !state.meta.image);
    }

    function applyNewSchedule(shoots, people, fileName) {
        // Köhnə versiyanın keçmiş günləri statistika üçün arxivə köçürülür
        const minDate = shoots.reduce((m, s) => (!m || s.date < m ? s.date : m), null);
        if (!state.meta.sample) {
            myShoots().filter(s => !minDate || s.date < minDate).forEach(s => {
                if (!state.archive.some(a => a.date === s.date && C.norm(a.match) === C.norm(s.match))) {
                    state.archive.push({ id: s.id, date: s.date, match: s.match, venue: s.venue, type: s.type, sport: s.sport, start: s.start, gather: s.gather, mine: true });
                }
            });
        }
        // Yeni versiya köhnəni tam əvəz edir (əl ilə əlavə edilənlər də daxil)
        state.shoots = shoots;
        state.people = people;
        state.meta = { version: (state.meta.sample ? 0 : state.meta.version) + 1, uploadedAt: Date.now(), fileName, image: state.meta.image, sample: false };
        Object.keys(weatherCache).forEach(k => delete weatherCache[k]);
        save();
    }

    async function handleScheduleFile(file) {
        if (!file) return;
        const name = file.name || 'fayl';
        const lower = name.toLowerCase();
        try {
            if (/^image\//.test(file.type) || /\.(png|jpe?g|heic|webp)$/.test(lower)) {
                state.meta.image = await resizeImage(file, 1800, 0.82);
                save();
                renderUploadMeta();
                showUploadResult(true, '<i class="fa-regular fa-image mr-1"></i><strong>Şəkil yadda saxlanıldı.</strong><br>Şəkildən cədvəlin avtomatik oxunması hələ dəstəklənmir — şəklə tətbiq daxilində baxa və çəkilişləri "Əllə əlavə et" ilə yaza bilərsiniz. Avtomatik oxuma üçün Excel (.xlsx) faylını yükləyin.');
                return;
            }
            let sheets;
            if (/\.csv$/.test(lower) || file.type === 'text/csv') sheets = C.readCsv(await file.text());
            else if (/\.xls$/.test(lower)) throw new Error('Köhnə .xls formatı dəstəklənmir. Faylı Excel-də "Save As → .xlsx" kimi saxlayın.');
            else sheets = await C.readXlsx(await file.arrayBuffer());

            const res = C.parseSchedule(sheets, { refYear: new Date().getFullYear() });
            if (!res.shoots.length) throw new Error(res.warnings.join(' ') || 'Cədvəldə çəkiliş tapılmadı.');
            applyNewSchedule(res.shoots, res.people, name);
            const mineCount = myShoots().length;
            const crewCount = Object.keys(res.people).length;
            showUploadResult(true,
                '<i class="fa-solid fa-circle-check mr-1"></i><strong>Yeni qrafik (v' + state.meta.version + ') tətbiq olundu.</strong><br>' +
                res.shoots.length + ' çəkiliş, ' + crewCount + ' əməkdaş oxundu. Sizin üçün: <strong>' + mineCount + '</strong> çəkiliş.' +
                (res.warnings.length ? '<br><span class="text-amber-700">⚠ ' + C.esc(res.warnings.join(' ')) + '</span>' : '') +
                (!mineCount && crewCount ? '<br><span class="text-amber-700">⚠ Adınız (' + C.esc(state.profile.name) + ') qrafikdə tapılmadı — profil adını yoxlayın.</span>' : ''));
            refresh();
        } catch (err) {
            console.error(err);
            showUploadResult(false, '<i class="fa-solid fa-triangle-exclamation mr-1"></i>' + C.esc(err.message || 'Fayl oxunmadı'));
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
        $('theme-icon').className = 'fa-solid ' + THEME_ICON[t] + ' text-sm';
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
            if (e.target.classList.contains('modal')) { closeModal(e.target.id); return; }
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
        $('open-upload').onclick = () => { $('upload-result').classList.add('hidden'); renderUploadMeta(); openModal('upload-modal'); };
        $('pick-file').onclick = () => $('schedule-input').click();
        $('schedule-input').onchange = async e => {
            const f = e.target.files[0];
            e.target.value = '';
            $('upload-result').classList.remove('hidden');
            showUploadResult(true, '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Oxunur…');
            await handleScheduleFile(f);
        };
        $('view-image').onclick = () => { $('image-view').src = state.meta.image; openModal('image-modal'); };

        $('add-shoot').onclick = () => openEdit(null);
        $('edit-form').onsubmit = saveEdit;
        $('clear-sample').onclick = async () => {
            state.shoots = []; state.people = {}; state.meta.sample = false; save(); refresh();
            toast('Nümunə məlumat silindi');
        };

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
        $('theme-btn').onclick = () => setTheme(order[(order.indexOf(state.theme || 'system') + 1) % 3]);
        document.querySelectorAll('#theme-seg [data-theme]').forEach(b => { b.onclick = () => setTheme(b.dataset.theme); });
        if (darkMQ) {
            const onSys = () => { if ((state.theme || 'system') === 'system') applyTheme(); };
            darkMQ.addEventListener ? darkMQ.addEventListener('change', onSys) : darkMQ.addListener(onSys);
        }

        // Statusları dəqiqədə bir yenilə; tətbiqə qayıdanda da
        setInterval(renderSchedules, 60 * 1000);
        document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
        // Android geri düyməsi: açıq modalı bağla
        const App = g.Capacitor && g.Capacitor.Plugins && g.Capacitor.Plugins.App;
        if (App && App.addListener) {
            App.addListener('backButton', () => {
                const open = Array.from(document.querySelectorAll('.modal')).find(m => !m.classList.contains('hidden'));
                if (open) closeModal(open.id); else if (currentTab !== 'my') switchTab('my'); else App.exitApp();
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
