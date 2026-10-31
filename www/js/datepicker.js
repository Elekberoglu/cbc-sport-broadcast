/* Müasir təqvim — yuxarıda X (bağla), aşağıda "Təsdiq et". Həftə bazar ertəsindən başlayır.
   Ay keçidi: oxlar və ya sola/sağa sürüşdürmə. */
(function (g) {
    'use strict';
    const C = g.CBC;
    const $ = id => document.getElementById(id);
    let view = null, selected = null, current = null, bound = false;

    function render() {
        const y = view.getFullYear(), m = view.getMonth();
        $('dp-month').textContent = C.MONTHS_CAP[m] + ' ' + y;
        const first = new Date(y, m, 1);
        const lead = (first.getDay() + 6) % 7; // bazar ertəsi = 0
        const days = new Date(y, m + 1, 0).getDate();
        const today = C.todayISO();
        let html = '';
        for (let i = 0; i < lead; i++) html += '<span></span>';
        for (let d = 1; d <= days; d++) {
            const iso = y + '-' + C.pad(m + 1) + '-' + C.pad(d);
            const sel = iso === selected, isToday = iso === today;
            const wd = (lead + d - 1) % 7;
            html += '<button type="button" data-d="' + iso + '" class="dp-day h-10 rounded-xl text-sm font-semibold transition ' +
                (sel ? 'bg-blue-600 text-white shadow' : isToday ? 'text-blue-600 ring-1 ring-blue-300' : (wd >= 5 ? 'text-red-500' : 'text-gray-800')) +
                '" aria-label="' + d + ' ' + C.MONTHS[m] + ' ' + y + '"' + (sel ? ' aria-pressed="true"' : '') + '>' + d + '</button>';
        }
        $('dp-grid').innerHTML = html;
        $('dp-preview').textContent = selected ? C.fmtDate(selected) + ' ' + selected.slice(0, 4) + ', ' + C.weekday(selected) : 'Tarix seçilməyib';
        $('dp-ok').disabled = !selected;
        $('dp-ok').classList.toggle('opacity-50', !selected);
    }
    function shift(n) { view = new Date(view.getFullYear(), view.getMonth() + n, 1); render(); }

    function bind() {
        if (bound) return;
        bound = true;
        $('dp-prev').addEventListener('click', () => shift(-1));
        $('dp-next').addEventListener('click', () => shift(1));
        $('dp-grid').addEventListener('click', e => {
            const b = e.target.closest('[data-d]');
            if (b) { selected = b.dataset.d; render(); }
        });
        $('dp-close').addEventListener('click', () => close());
        $('dp-ok').addEventListener('click', () => { if (current && selected) current.resolve(selected); close(true); });
        $('dp-modal').addEventListener('click', e => { if (e.target.id === 'dp-modal') close(); });
        // Sola/sağa sürüşdürmə ilə ay dəyişmə
        let x0 = null;
        $('dp-grid').addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
        $('dp-grid').addEventListener('touchend', e => {
            if (x0 == null) return;
            const dx = e.changedTouches[0].clientX - x0;
            if (Math.abs(dx) > 50) shift(dx < 0 ? 1 : -1);
            x0 = null;
        });
    }
    function close(done) {
        const m = $('dp-modal');
        m.classList.add('hidden'); m.classList.remove('flex');
        if (current && done !== true) current.resolve(null);
        current = null;
    }
    /** Təqvimi açır. Təsdiq edilsə ISO tarix, X ilə bağlansa null qaytarır. */
    function open(iso) {
        bind();
        selected = iso || null;
        const base = C.parseISO(iso) || new Date();
        view = new Date(base.getFullYear(), base.getMonth(), 1);
        render();
        const m = $('dp-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
        return new Promise(res => { current = { resolve: res }; });
    }

    g.CBC = Object.assign(g.CBC || {}, { datePicker: { open, close, isOpen: () => !!current } });
})(window);
