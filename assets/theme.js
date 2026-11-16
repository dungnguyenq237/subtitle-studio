/* Runs before CSS so a saved or system preference is applied before first paint. */
(() => {
  const root = document.documentElement;
  const media = matchMedia('(prefers-color-scheme: dark)');
  const key = 'site-theme';
  let preference = 'system';
  try { const saved = localStorage.getItem(key); if (['light', 'dark'].includes(saved)) preference = saved; } catch {}
  const labels = {
    en: ['System theme', 'Light theme', 'Dark theme'], vi: ['Theo hệ thống', 'Giao diện sáng', 'Giao diện tối'],
    zh: ['跟随系统', '浅色主题', '深色主题'], hi: ['सिस्टम थीम', 'हल्की थीम', 'गहरी थीम'], es: ['Tema del sistema', 'Tema claro', 'Tema oscuro'],
    ar: ['مظهر النظام', 'المظهر الفاتح', 'المظهر الداكن'], fr: ['Thème du système', 'Thème clair', 'Thème sombre'], bn: ['সিস্টেম থিম', 'হালকা থিম', 'গাঢ় থিম'],
    pt: ['Tema do sistema', 'Tema claro', 'Tema escuro'], id: ['Tema sistem', 'Tema terang', 'Tema gelap'], ur: ['سسٹم تھیم', 'روشن تھیم', 'تاریک تھیم'],
    ru: ['Системная тема', 'Светлая тема', 'Тёмная тема'], de: ['Systemdesign', 'Helles Design', 'Dunkles Design'], ja: ['システム設定', 'ライトテーマ', 'ダークテーマ'],
    pcm: ['System theme', 'Light theme', 'Dark theme'], arz: ['شكل النظام', 'الشكل الفاتح', 'الشكل الغامق'], mr: ['सिस्टम थीम', 'हलकी थीम', 'गडद थीम'],
    te: ['సిస్టమ్ థీమ్', 'లైట్ థీమ్', 'డార్క్ థీమ్'], sw: ['Mandhari ya mfumo', 'Mandhari angavu', 'Mandhari meusi'], ha: ['Jigon tsarin', 'Jigo mai haske', 'Jigo mai duhu'],
    tr: ['Sistem teması', 'Açık tema', 'Koyu tema'], pnb: ['سسٹم تھیم', 'روشن تھیم', 'گُوڑھی تھیم'], tl: ['Tema ng system', 'Maliwanag na tema', 'Madilim na tema'],
    ta: ['கணினி தீம்', 'ஒளி தீம்', 'இருள் தீம்'], yue: ['跟隨系統', '淺色主題', '深色主題'], wuu: ['跟随系统', '浅色主题', '深色主题'],
    fa: ['پوستهٔ سیستم', 'پوستهٔ روشن', 'پوستهٔ تیره'], ko: ['시스템 테마', '밝은 테마', '어두운 테마'], am: ['የስርዓት ገጽታ', 'ብርሃን ገጽታ', 'ጨለማ ገጽታ'],
    th: ['ธีมระบบ', 'ธีมสว่าง', 'ธีมมืด'], jv: ['Tema sistem', 'Tema padhang', 'Tema peteng'], it: ['Tema di sistema', 'Tema chiaro', 'Tema scuro'],
    gu: ['સિસ્ટમ થીમ', 'લાઇટ થીમ', 'ડાર્ક થીમ'], kn: ['ಸಿಸ್ಟಮ್ ಥೀಮ್', 'ಲೈಟ್ ಥೀಮ್', 'ಡಾರ್ಕ್ ಥೀಮ್'], apc: ['مظهر النظام', 'المظهر الفاتح', 'المظهر الغامق'],
    apd: ['مظهر النظام', 'المظهر الفاتح', 'المظهر الغامق'], yo: ['Àkòrí ètò', 'Àkòrí ìmọ́lẹ̀', 'Àkòrí òkùnkùn'], bho: ['सिस्टम थीम', 'उजर थीम', 'गहिर थीम']
  };
  function apply() {
    const resolved = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'dark' ? '#14151a' : '#faf7f0');
    const names = labels[root.lang] || labels.en;
    document.querySelectorAll('[data-theme-choice]').forEach((button, index) => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preference));
      button.setAttribute('aria-label', names[index]);
      button.title = names[index];
    });
  }
  apply();
  media.addEventListener('change', apply);
  addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    preference = ['light', 'dark'].includes(event.newValue) ? event.newValue : 'system'; apply();
  });
  document.addEventListener('site-language-change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    const header = document.querySelector('header'); if (!header) return;
    const group = document.createElement('div'); group.className = 'theme-switch no-print';
    const icons = [
      '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>',
      '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
      '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>'
    ];
    ['system', 'light', 'dark'].forEach((value, index) => {
      const button = document.createElement('button'); button.type = 'button'; button.dataset.themeChoice = value;
      // These SVG paths are static application assets, never user input.
      button.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[index]}</svg>`;
      button.addEventListener('click', () => {
        preference = value;
        try { value === 'system' ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
        apply();
      });
      group.append(button);
    });
    header.append(group); apply();
  }, {once: true});
})();
