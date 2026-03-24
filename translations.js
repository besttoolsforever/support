window.translations = window.translations || {};

const supportedLanguages = [
    { code: 'en',    name: 'English',           flag: '🇺🇸' },
    { code: 'ja',    name: '日本語',              flag: '🇯🇵' },
    { code: 'de',    name: 'Deutsch',            flag: '🇩🇪' },
    { code: 'fr',    name: 'Français',           flag: '🇫🇷' },
    { code: 'es',    name: 'Español',            flag: '🇪🇸' },
    { code: 'ko',    name: '한국어',              flag: '🇰🇷' },
    { code: 'pt',    name: 'Português (BR)',     flag: '🇧🇷' },
    { code: 'zh-CN', name: '简体中文',            flag: '🇨🇳' },
    { code: 'it',    name: 'Italiano',           flag: '🇮🇹' },
    { code: 'nl',    name: 'Nederlands',         flag: '🇳🇱' },
    { code: 'zh-TW', name: '繁體中文',            flag: '🇹🇼' },
    { code: 'pl',    name: 'Polski',             flag: '🇵🇱' },
    { code: 'tr',    name: 'Türkçe',             flag: '🇹🇷' },
    { code: 'ar',    name: 'العربية',            flag: '🇸🇦' },
    { code: 'ru',    name: 'Русский',            flag: '🇷🇺' },
    { code: 'id',    name: 'Bahasa Indonesia',   flag: '🇮🇩' },
    { code: 'hi',    name: 'हिन्दी',             flag: '🇮🇳' },
    { code: 'sv',    name: 'Svenska',            flag: '🇸🇪' },
    { code: 'th',    name: 'ไทย',               flag: '🇹🇭' },
    { code: 'vi',    name: 'Tiếng Việt',         flag: '🇻🇳' },
    { code: 'cs',    name: 'Čeština',            flag: '🇨🇿' },
    { code: 'da',    name: 'Dansk',              flag: '🇩🇰' },
    { code: 'el',    name: 'Ελληνικά',           flag: '🇬🇷' },
    { code: 'fi',    name: 'Suomi',              flag: '🇫🇮' },
    { code: 'he',    name: 'עברית',              flag: '🇮🇱' },
    { code: 'ms',    name: 'Bahasa Melayu',      flag: '🇲🇾' },
    { code: 'nb',    name: 'Norsk Bokmål',       flag: '🇳🇴' }
];

/**
 * Resolve a dotted key path in an object.
 */
function getNestedValue(obj, path) {
    if (!obj) return null;
    return path.split('.').reduce((prev, curr) => (prev ? prev[curr] : null), obj);
}

/**
 * Dynamically loads a language script file from the lang/ folder.
 */
function loadLanguageFile(langCode) {
    if (window.translations[langCode]) {
        return Promise.resolve(true);
    }

    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'lang/' + langCode + '.js';
        script.onload = () => {
            if (window.translations[langCode]) {
                resolve(true);
            } else {
                console.error(`[i18n] File lang/${langCode}.js loaded but window.translations.${langCode} is missing.`);
                resolve(false);
            }
        };
        script.onerror = () => {
            console.error(`[i18n] Failed to load lang/${langCode}.js`);
            resolve(false);
        };
        document.head.appendChild(script);
    });
}

/**
 * Renders the language selector dropdown with all supported languages.
 */
function renderLanguageSelector(currentPageName) {
    const dropdown = document.getElementById('lang-dropdown');
    if (!dropdown) return;

    dropdown.innerHTML = '';
    supportedLanguages.forEach(lang => {
        const btn = document.createElement('button');
        btn.className = 'flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-all duration-200 text-sm text-left w-full group whitespace-nowrap';
        btn.onclick = (e) => {
            e.preventDefault();
            setLanguage(lang.code, currentPageName);
        };

        const flagSpan = document.createElement('span');
        flagSpan.className = 'text-base group-hover:scale-110 transition-transform duration-200';
        flagSpan.textContent = lang.flag;

        const nameSpan = document.createElement('span');
        nameSpan.className = 'font-medium text-primary/80 group-hover:text-primary transition-colors';
        nameSpan.textContent = lang.name;

        btn.appendChild(flagSpan);
        btn.appendChild(nameSpan);
        dropdown.appendChild(btn);
    });
}

/**
 * Applies translations for the given language code and page to the DOM.
 */
async function setLanguage(langCode, pageName) {
    // 1. Ensure English is always available as fallback
    if (!window.translations['en']) {
        await loadLanguageFile('en');
    }

    // 2. Try to load requested language
    let activeCode = langCode;
    if (langCode !== 'en') {
        const ok = await loadLanguageFile(langCode);
        if (!ok) {
            console.warn(`[i18n] Falling back to English because ${langCode} failed to load.`);
            activeCode = 'en';
        }
    }

    const activeData = window.translations[activeCode];
    const enData = window.translations['en'];

    // --- Helper for granular fallback ---
    const t = (key) => {
        let val = getNestedValue(activeData, key);
        if (val === null || val === undefined || val === '') {
            val = getNestedValue(enData, key);
            if (val !== null && val !== undefined && val !== '') {
                if (activeCode !== 'en') {
                    console.debug(`[i18n] Key "${key}" missing in ${activeCode}, using English fallback.`);
                }
            } else {
                console.warn(`[i18n] Key "${key}" missing in both ${activeCode} and English.`);
                return null;
            }
        }
        return val;
    };

    // --- Document title ---
    const pageTitleKey = `${pageName}.title`;
    const pageTitle = t(pageTitleKey);
    if (pageTitle) document.title = pageTitle;

    // --- All [data-i18n] elements ---
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const keyPath = el.getAttribute('data-i18n');
        const val = t(keyPath);

        if (val !== null) {
            if (el.tagName === 'PRE' || el.tagName === 'CODE' ||
                el.classList.contains('code-block') ||
                el.classList.contains('code-chip') ||
                el.classList.contains('preserve-whitespace')) {
                el.textContent = val;
            } else {
                el.innerHTML = val;
            }
        }
    });

    // --- Update language label in the nav button ---
    const label = document.getElementById('current-lang');
    if (label) {
        const found = supportedLanguages.find(l => l.code === activeCode);
        label.textContent = found
            ? found.flag + ' ' + found.code.toUpperCase()
            : activeCode.toUpperCase();
    }

    // --- HTML lang attribute ---
    document.documentElement.lang = activeCode;

    // --- Persist choice ---
    localStorage.setItem('preferred-lang', activeCode);
}

/** Updates the copyright year span. */
function updateCopyright() {
    const el = document.getElementById('copyright-year');
    if (el) {
        const currentYear = new Date().getFullYear();
        if (currentYear > 2026) {
            el.textContent = `2026 - ${currentYear}`;
        } else {
            el.textContent = '2026';
        }
    }
}

/** Automatic initialization on DOM load. */
window.addEventListener('DOMContentLoaded', () => {
    let pageName = 'home';
    const path = window.location.pathname.toLowerCase();
    const title = document.title.toLowerCase();

    // Flexible page detection
    if (path.includes('legal.html') || title.includes('legal')) pageName = 'legal';
    else if (path.includes('support.html') || title.includes('support')) pageName = 'support';
    
    // 1. Initial render of selector
    renderLanguageSelector(pageName);
    
    // 2. Load preferred language
    const savedLang = localStorage.getItem('preferred-lang') || 'en';
    setLanguage(savedLang, pageName);
    
    // 3. Misc
    updateCopyright();
});
