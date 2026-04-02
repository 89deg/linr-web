// LINR i18n — lightweight translation engine
(() => {
    const LANGUAGES = {
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        fr: 'Français',
        it: 'Italiano',
        ja: '日本語',
        ko: '한국어',
        pt: 'Português',
        tr: 'Türkçe'
    };

    const DEFAULT_LANG = 'de';

    function detectLang() {
        const params = new URLSearchParams(window.location.search);
        if (params.has('lang') && LANGUAGES[params.get('lang')]) return params.get('lang');
        const stored = localStorage.getItem('linr-lang');
        if (stored && LANGUAGES[stored]) return stored;
        return DEFAULT_LANG;
    }

    function updateURL(lang) {
        const url = new URL(window.location);
        if (lang === DEFAULT_LANG) {
            url.searchParams.delete('lang');
        } else {
            url.searchParams.set('lang', lang);
        }
        history.replaceState(null, '', url);
    }

    async function loadTranslations(lang) {
        if (lang === DEFAULT_LANG) return null; // HTML already has German text
        try {
            const base = document.querySelector('script[src*="i18n.js"]')?.src;
            const langDir = base ? base.replace('i18n.js', `lang/${lang}.json`) : `lang/${lang}.json`;
            const res = await fetch(langDir);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    function applyTranslations(translations) {
        if (!translations) return;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[key]) el.textContent = translations[key];
        });
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            if (translations[key]) el.innerHTML = translations[key];
        });
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (translations[key]) el.alt = translations[key];
        });
        if (translations['_title']) document.title = translations['_title'];
    }

    function updateScreenshots(lang) {
        document.querySelectorAll('.carousel-slide img').forEach(img => {
            img.src = img.src.replace(/screenshots\/[a-z]{2}\//, `screenshots/${lang}/`);
        });
    }

    function buildSwitcher(currentLang) {
        const container = document.getElementById('lang-switcher');
        if (!container) return;

        const btn = container.querySelector('.lang-btn');
        const menu = container.querySelector('.lang-menu');
        if (!btn || !menu) return;

        btn.querySelector('.lang-code').textContent = currentLang.toUpperCase();

        menu.innerHTML = '';
        Object.entries(LANGUAGES).forEach(([code, name]) => {
            const item = document.createElement('button');
            item.className = `w-full text-left px-4 py-2 text-sm transition-colors duration-200 flex items-center justify-between ${
                code === currentLang
                    ? 'text-gold bg-gold-container'
                    : 'text-on-surface-variant hover:text-gold hover:bg-surface-container-high'
            }`;
            item.innerHTML = `<span>${name}</span><span class="text-xs opacity-50">${code.toUpperCase()}</span>`;
            item.addEventListener('click', () => switchLang(code));
            menu.appendChild(item);
        });

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('hidden');
        });

        document.addEventListener('click', () => menu.classList.add('hidden'));
    }

    async function switchLang(lang) {
        localStorage.setItem('linr-lang', lang);
        updateURL(lang);
        if (lang === DEFAULT_LANG) {
            // Reload to get original German HTML
            window.location.reload();
            return;
        }
        const translations = await loadTranslations(lang);
        if (translations) {
            applyTranslations(translations);
            document.documentElement.lang = lang;
            // Load CJK fonts if needed
            const cjkFonts = { ja: 'Noto+Sans+JP', ko: 'Noto+Sans+KR' };
            if (cjkFonts[lang] && !document.querySelector(`link[href*="${cjkFonts[lang]}"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${cjkFonts[lang]}:wght@300;400;500;600&display=swap`;
                document.head.appendChild(link);
            }
        }
        updateScreenshots(lang);
        // Update switcher display
        const codeEl = document.querySelector('.lang-code');
        if (codeEl) codeEl.textContent = lang.toUpperCase();
        document.querySelector('.lang-menu')?.classList.add('hidden');
    }

    async function init() {
        const lang = detectLang();
        document.documentElement.lang = lang;
        localStorage.setItem('linr-lang', lang);
        updateURL(lang);

        if (lang !== DEFAULT_LANG) {
            const translations = await loadTranslations(lang);
            applyTranslations(translations);
            const cjkFonts = { ja: 'Noto+Sans+JP', ko: 'Noto+Sans+KR' };
            if (cjkFonts[lang]) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${cjkFonts[lang]}:wght@300;400;500;600&display=swap`;
                document.head.appendChild(link);
            }
            updateScreenshots(lang);
        }

        buildSwitcher(lang);
        document.body.classList.add('i18n-ready');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
