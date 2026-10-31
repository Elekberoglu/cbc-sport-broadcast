/* Təkər tipli (wheel) saat seçici — 12 saatlıq AM/PM.
   Daxili saxlama 24 saat formatındadır ("HH:MM").
   Siçan (təkərcik, sürüşdürmə, klik), toxunma və klaviatura ilə işləyir. */
(function (g) {
    'use strict';
    const ITEM = 40; // bir elementin hündürlüyü (px) — CSS ilə eyni olmalıdır
    const pad = n => String(n).padStart(2, '0');

    function to12(hhmm) {
        const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
        if (!m) return null;
        const h24 = +m[1];
        return { h: h24 % 12 === 0 ? 12 : h24 % 12, m: +m[2], ap: h24 < 12 ? 'AM' : 'PM' };
    }
    function to24(h, m, ap) {
        const h24 = (h % 12) + (ap === 'PM' ? 12 : 0);
        return pad(h24) + ':' + pad(m);
    }
    function label12(hhmm) {
        const t = to12(hhmm);
        return t ? pad(t.h) + ':' + pad(t.m) + ' ' + t.ap : '';
    }

    function Wheel(el, values, fmt, onChange) {
        this.el = el; this.values = values; this.onChange = onChange;
        el.innerHTML = '<div class="tp-spacer"></div>' +
            values.map((v, i) => '<div class="tp-item" data-i="' + i + '">' + fmt(v) + '</div>').join('') +
            '<div class="tp-spacer"></div>';
        this.items = Array.from(el.querySelectorAll('.tp-item'));
        this.index = 0; this.target = 0;
        let t = null;
        el.addEventListener('scroll', () => {
            this.mark(Math.round(el.scrollTop / ITEM));
            clearTimeout(t);
            t = setTimeout(() => this.snap(), 120);
        }, { passive: true });
        el.addEventListener('click', e => {
            const it = e.target.closest('.tp-item');
            if (it && !this.dragged) this.set(+it.dataset.i, true);
        });
        // Siçan təkərciyi: bir "notch" = bir addım; trackpad-in kiçik hərəkətləri toplanır
        let acc = 0;
        el.addEventListener('wheel', e => {
            e.preventDefault();
            const dy = e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY;
            let steps = 0;
            if (Math.abs(dy) >= 50) { steps = Math.sign(dy); acc = 0; }
            else { acc += dy; if (Math.abs(acc) >= 40) { steps = Math.sign(acc); acc = 0; } }
            if (steps) this.set(Math.max(0, Math.min(values.length - 1, this.target + steps)), false);
        }, { passive: false });
        el.addEventListener('keydown', e => {
            if (e.key === 'ArrowDown') { e.preventDefault(); this.set(Math.min(values.length - 1, this.index + 1), true); }
            if (e.key === 'ArrowUp') { e.preventDefault(); this.set(Math.max(0, this.index - 1), true); }
        });
        // Siçanla sürüşdürmə (toxunmada brauzerin öz sürüşdürməsi işləyir)
        let startY = 0, startTop = 0, down = false;
        el.addEventListener('pointerdown', e => {
            if (e.pointerType !== 'mouse') return;
            down = true; this.dragged = false; startY = e.clientY; startTop = el.scrollTop;
            el.setPointerCapture(e.pointerId);
            el.classList.add('dragging');
        });
        el.addEventListener('pointermove', e => {
            if (!down) return;
            const dy = e.clientY - startY;
            if (Math.abs(dy) > 3) this.dragged = true;
            el.scrollTop = startTop - dy;
        });
        const up = () => { if (!down) return; down = false; el.classList.remove('dragging'); this.snap(); setTimeout(() => { this.dragged = false; }, 0); };
        el.addEventListener('pointerup', up);
        el.addEventListener('pointercancel', up);
    }
    Wheel.prototype.mark = function (i) {
        i = Math.max(0, Math.min(this.values.length - 1, i));
        if (i === this.index && this.items[i].classList.contains('on')) return;
        this.items.forEach((it, k) => it.classList.toggle('on', k === i));
        this.index = i;
        if (this.onChange) this.onChange();
    };
    Wheel.prototype.snap = function () {
        const i = Math.max(0, Math.min(this.values.length - 1, Math.round(this.el.scrollTop / ITEM)));
        if (Math.abs(this.el.scrollTop - i * ITEM) > 1) this.el.scrollTo({ top: i * ITEM, behavior: 'smooth' });
        this.target = i;
        this.mark(i);
    };
    Wheel.prototype.set = function (i, smooth) {
        this.target = i;
        this.el.scrollTo({ top: i * ITEM, behavior: smooth ? 'smooth' : 'auto' });
        this.mark(i);
    };
    Wheel.prototype.value = function () { return this.values[this.index]; };

    let wheels = null, current = null;
    const $ = id => document.getElementById(id);

    function preview() {
        if (!wheels) return;
        const v = to24(wheels.h.value(), wheels.m.value(), wheels.ap.value());
        $('tp-preview').textContent = '24 saat formatında: ' + v;
    }
    function ensure() {
        if (wheels) return;
        const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // iOS kimi: 12 ilk sırada
        const mins = Array.from({ length: 60 }, (_, i) => i);
        wheels = {
            h: new Wheel($('tp-h'), hours, pad, preview),
            m: new Wheel($('tp-m'), mins, pad, preview),
            ap: new Wheel($('tp-ap'), ['AM', 'PM'], v => v, preview)
        };
        $('tp-close').addEventListener('click', close);
        $('tp-ok').addEventListener('click', () => {
            const v = to24(wheels.h.value(), wheels.m.value(), wheels.ap.value());
            if (current) current.resolve(v);
            close(true);
        });
        $('tp-modal').addEventListener('click', e => { if (e.target.id === 'tp-modal') close(); });
    }
    function close(done) {
        const m = $('tp-modal');
        m.classList.add('hidden'); m.classList.remove('flex');
        if (current && done !== true) current.resolve(null);
        current = null;
    }
    /** Seçicini açır. Təsdiq edilsə "HH:MM" (24 saat), bağlansa null qaytarır. */
    function open(title, value) {
        ensure();
        $('tp-title').textContent = title || 'Saat';
        const m = $('tp-modal');
        m.classList.remove('hidden'); m.classList.add('flex');
        const t = to12(value) || to12('12:00');
        // Görünən olduqdan sonra mövqeləri qur
        requestAnimationFrame(() => {
            wheels.h.set(t.h % 12, false);
            wheels.m.set(t.m, false);
            wheels.ap.set(t.ap === 'AM' ? 0 : 1, false);
            preview();
        });
        return new Promise(res => { current = { resolve: res }; });
    }

    g.CBC = Object.assign(g.CBC || {}, { timePicker: { open, close, label12, to12, to24, isOpen: () => !!current } });
})(window);
