(function () {
  'use strict';

  var STORAGE_KEY = 'queens-gods-reader-settings';

  function getStored() {
    try {
      var s = localStorage.getItem(STORAGE_KEY);
      return s ? JSON.parse(s) : {};
    } catch (e) {
      return {};
    }
  }

  function save(theme, size, font) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        theme: theme || 'default',
        size: size || 'medium',
        font: font || 'lora'
      }));
    } catch (e) {}
  }

  function apply(body, theme, size, font) {
    if (!body || !body.classList) return;
    body.classList.remove('reader-theme-default', 'reader-theme-white', 'reader-theme-sepia');
    body.classList.remove('reader-size-small', 'reader-size-medium', 'reader-size-large');
    body.classList.remove('reader-font-lora', 'reader-font-georgia', 'reader-font-inter', 'reader-font-merriweather');
    body.classList.add('reader-theme-' + (theme || 'default'));
    body.classList.add('reader-size-' + (size || 'medium'));
    body.classList.add('reader-font-' + (font || 'lora'));
  }

  function init() {
    var body = document.body;
    if (!body || !body.classList.contains('reader-page')) return;

    var stored = getStored();
    var theme = stored.theme || 'default';
    var size = stored.size || 'medium';
    var font = stored.font || 'lora';

    apply(body, theme, size, font);

    var themeSelect = document.getElementById('reader-theme');
    var sizeSelect = document.getElementById('reader-size');
    var fontSelect = document.getElementById('reader-font');

    if (themeSelect) {
      themeSelect.value = theme;
      themeSelect.addEventListener('change', function () {
        var v = themeSelect.value;
        apply(body, v, size, font);
        save(v, size, font);
      });
    }
    if (sizeSelect) {
      sizeSelect.value = size;
      sizeSelect.addEventListener('change', function () {
        var v = sizeSelect.value;
        apply(body, theme, v, font);
        save(theme, v, font);
      });
    }
    if (fontSelect) {
      fontSelect.value = font;
      fontSelect.addEventListener('change', function () {
        var v = fontSelect.value;
        apply(body, theme, size, v);
        save(theme, size, v);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
