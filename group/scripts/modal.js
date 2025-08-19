// scripts/modal.js
// Turns Vimeo/YouTube links into a modal player inside sections opted-in via Metadata:
//   Style: use-video-modal
// Works with plain links and linked images.
// Fallback: if JS fails, the link still opens on Vimeo/YouTube.

(() => {
  const SECTION_SELECTOR = '.section.use-video-modal';
  const LINK_SELECTOR =
    `${SECTION_SELECTOR} a[href*="vimeo.com"], ${SECTION_SELECTOR} a[href*="youtube.com"], ${SECTION_SELECTOR} a[href*="youtu.be"]`;

  function buildPlayerSrc(href) {
    try {
      const u = new URL(href);

      // Vimeo
      if (u.hostname.includes('vimeo.com')) {
        // Accept /123456 or /video/123456
        const parts = u.pathname.split('/').filter(Boolean);
        const id = parts.pop();
        if (!id || isNaN(Number(id))) return href;
        return `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&playsinline=1`;
      }

      // YouTube
      if (u.hostname.includes('youtube.com') || u.hostname.includes('youtu.be')) {
        let vid = u.searchParams.get('v');
        if (!vid && u.hostname.includes('youtu.be')) {
          vid = u.pathname.replace('/', '');
        }
        if (!vid) return href;
        return `https://www.youtube.com/embed/${vid}?autoplay=1&mute=1&rel=0&playsinline=1`;
      }
    } catch (e) { /* ignore bad URLs */ }
    return href;
  }

  function ensureRoot() {
    let root = document.querySelector('.video-modal-root');
    if (!root) {
      root = document.createElement('div');
      root.className = 'video-modal-root';
      document.body.append(root);
    }
    return root;
  }

  function openModal(src, trigger) {
    const root = ensureRoot();
    const overlay = document.createElement('div');
    overlay.className = 'video-modal-overlay';
    overlay.innerHTML = `
      <div class="video-modal-dialog" role="dialog" aria-modal="true" aria-label="Video player">
        <button class="video-modal-close" type="button" aria-label="Close">×</button>
        <div class="video-modal-frame">
          <iframe src="${src}" title="Video" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="eager"></iframe>
        </div>
      </div>
    `;
    root.append(overlay);

    // Scroll lock + focus
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    const closeBtn = overlay.querySelector('.video-modal-close');
    closeBtn.focus();

    function close() {
      overlay.remove();
      document.documentElement.style.overflow = prevOverflow;
      if (trigger) trigger.focus();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }

    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
  }

  // Event delegation: activate only inside opted-in sections
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a || !a.matches(LINK_SELECTOR)) return;

    // Only intercept left-click without modifier keys
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const src = buildPlayerSrc(a.href);
    if (!src) return; // fallback to normal nav

    e.preventDefault();
    openModal(src, a);
  });
})();
