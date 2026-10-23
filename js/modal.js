/**
 * Angry Skipper Association - Universal Photo & Memorial Modal Lightbox
 * Automatically intercepts image links and legacy FrontPage wrapper subpages.
 */
(function() {
  // 1. Create Modal DOM Container on DOM load
  document.addEventListener('DOMContentLoaded', () => {
    // Hidden scraper iframe
    const scraperFrame = document.createElement('iframe');
    scraperFrame.id = 'asaScraperFrame';
    scraperFrame.style.display = 'none';
    document.body.appendChild(scraperFrame);

    // Modal Overlay Elements
    const modal = document.createElement('div');
    modal.id = 'asaGlobalModal';
    modal.className = 'tribute-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `
      <div class="tribute-modal-box">
        <div class="tribute-modal-header">
          <h3 class="tribute-modal-title" id="asaModalTitle">Unit Dispatch &amp; Photograph</h3>
          <button type="button" class="tribute-modal-close" id="asaModalClose" aria-label="Close dialog">&times;</button>
        </div>
        <div class="tribute-modal-body" id="asaModalBody"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const modalBody = document.getElementById('asaModalBody');
    const modalTitle = document.getElementById('asaModalTitle');
    const modalClose = document.getElementById('asaModalClose');

    function closeModal() {
      modal.classList.remove('active');
      modalBody.innerHTML = '';
      document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // 2. Intercept Gallery / Tribute Links
    // Matches explicit .soldier-link, .gallery-item, or links pointing to subpages with thumbnail images
    document.querySelectorAll('a.soldier-link, a.gallery-item, .photo-grid a, .iraq-gallery-grid a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#' || href.startsWith('mailto:') || href.endsWith('.pdf')) return;

        // Skip global back/home links
        if (href.includes('index.html') || href.includes('vietnam_photos') && !href.includes('.htm')) return;

        e.preventDefault();
        const imgThumb = link.querySelector('img');
        const soldierName = link.getAttribute('data-soldier') || (imgThumb ? imgThumb.getAttribute('alt') : '') || 'Photograph View';

        modalTitle.textContent = soldierName;
        modalBody.innerHTML = `
          <div style="padding: 32px 16px; text-align: center; color: var(--text-muted, #6B7280); font-size: 0.95rem;">
            Loading photo &amp; record...
          </div>`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Direct image handling
        if (/\.(jpg|jpeg|png|gif)$/i.test(href)) {
          modalBody.innerHTML = `
            <div class="tribute-card">
              <img src="${href}" alt="${soldierName}">
            </div>`;
          return;
        }

        // Subpage handling via scraper frame
        scraperFrame.src = href;
        scraperFrame.onload = () => {
          try {
            const frameDoc = scraperFrame.contentDocument || scraperFrame.contentWindow.document;

            // Target main image
            const primaryImg = Array.from(frameDoc.querySelectorAll('img')).find(img => {
              const s = (img.getAttribute('src') || '').toLowerCase();
              return !s.includes('spacer') && !s.includes('guidon') && !s.includes('vwtop');
            });

            // Extract caption text
            const clone = frameDoc.body.cloneNode(true);
            clone.querySelectorAll('script, style, a, img, form, input').forEach(el => el.remove());
            const rawText = clone.textContent.replace(/\s+/g, ' ').trim();

            const card = document.createElement('div');
            card.className = 'tribute-card';

            if (primaryImg) {
              const fullImg = document.createElement('img');
              fullImg.src = new URL(primaryImg.getAttribute('src'), scraperFrame.src).href;
              fullImg.alt = soldierName;
              card.appendChild(fullImg);
            }

            if (rawText) {
              const captionEl = document.createElement('div');
              captionEl.className = 'tribute-caption';
              captionEl.textContent = rawText;
              card.appendChild(captionEl);
            }

            modalBody.innerHTML = '';
            modalBody.appendChild(card);
          } catch (err) {
            // Local fallback
            modalBody.innerHTML = `<iframe src="${href}" style="width:100%; height:60vh; border:none;"></iframe>`;
          }
        };
      });
    });
  });
})();
