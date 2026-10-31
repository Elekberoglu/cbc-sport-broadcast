/* Hava proqnozu — Open-Meteo (açar tələb etmir). Saatlıq proqnoz 16 günə qədər. */
(function (g) {
    'use strict';
    const C = g.CBC;
    const CACHE_KEY = 'cbc_weather_cache_v1';
    const TTL = 3 * 3600 * 1000;
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { cache = {}; }
    const inflight = {};

    function describe(code, wind) {
        let txt, icon, emoji;
        if (code === 0) { txt = 'Günəşli'; icon = 'fa-sun text-amber-500'; emoji = '☀️'; }
        else if (code <= 2) { txt = 'Az buludlu'; icon = 'fa-cloud-sun text-sky-500'; emoji = '⛅'; }
        else if (code === 3) { txt = 'Tutqun'; icon = 'fa-cloud text-gray-500'; emoji = '☁️'; }
        else if (code === 45 || code === 48) { txt = 'Dumanlı'; icon = 'fa-smog text-gray-500'; emoji = '🌫️'; }
        else if (code >= 51 && code <= 57) { txt = 'Çiskin'; icon = 'fa-cloud-rain text-sky-600'; emoji = '🌦️'; }
        else if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) { txt = 'Yağışlı'; icon = 'fa-cloud-showers-heavy text-sky-700'; emoji = '🌧️'; }
        else if ((code >= 71 && code <= 77) || code === 85 || code === 86) { txt = 'Qarlı'; icon = 'fa-snowflake text-sky-400'; emoji = '❄️'; }
        else if (code >= 95) { txt = 'Tufan'; icon = 'fa-cloud-bolt text-indigo-600'; emoji = '⛈️'; }
        else { txt = 'Buludlu'; icon = 'fa-cloud text-gray-500'; emoji = '☁️'; }
        if (wind >= 30 && code <= 3) { txt = 'Küləkli'; icon = 'fa-wind text-teal-600'; emoji = '🌬️'; }
        return { txt, icon, emoji };
    }

    function fetchCity(city) {
        const key = city.name;
        const c = cache[key];
        if (c && Date.now() - c.ts < TTL) return Promise.resolve(c.data);
        if (inflight[key]) return inflight[key];
        const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + city.lat + '&longitude=' + city.lon +
            '&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability&timezone=Asia%2FBaku&forecast_days=16&past_days=2';
        inflight[key] = fetch(url).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }).then(j => {
            const data = j.hourly;
            cache[key] = { ts: Date.now(), data };
            try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch (e) { /* yer yoxdur */ }
            delete inflight[key];
            return data;
        }).catch(err => {
            delete inflight[key];
            if (c) return c.data; // köhnə keşdən istifadə
            throw err;
        });
        return inflight[key];
    }

    /** Çəkiliş üçün hava: {temp, wind, rain, txt, icon, emoji} və ya null */
    async function forShoot(shoot) {
        const city = C.detectCity(shoot.venue);
        const data = await fetchCity(city);
        if (!data || !data.time) return null;
        const hour = (shoot.start || '15:00').slice(0, 2);
        const target = shoot.date + 'T' + hour + ':00';
        const i = data.time.indexOf(target);
        if (i < 0) return null;
        const temp = Math.round(data.temperature_2m[i]);
        const wind = Math.round(data.wind_speed_10m[i]);
        const rain = data.precipitation_probability ? data.precipitation_probability[i] : null;
        return Object.assign({ temp, wind, rain, city: city.name }, describe(data.weather_code[i], wind));
    }

    g.CBC = Object.assign(g.CBC || {}, { weatherForShoot: forShoot });
})(window);
