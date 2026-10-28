// Layout shell: mobile nav toggle. Runs in <head>, so flag JS before first paint.
document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  var toggle = header && header.querySelector('.nav-toggle');
  if (!toggle) return;

  function setOpen(open) {
    header.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', function () {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });

  // Reset the mobile panel when the desktop layout takes over.
  window.matchMedia('(min-width: 800px)').addEventListener('change', function (e) {
    if (e.matches) setOpen(false);
  });
});
