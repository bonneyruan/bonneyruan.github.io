$(document).ready(function() {
  const $body = $('body');
  const $miniSite = $('.mini-site-container');
  const $miniSiteTarget = $('.mini-site');
  const $zoomButtonLabel = $('#zoom-button h2');
  const storageKey = 'save';
  const hoverRadius = 36;

  function setZoomState(isZoomed, persist = true) {
    $miniSite.toggleClass('zoomed', isZoomed);
    $zoomButtonLabel.text(isZoomed ? 'zoom out' : 'zoom in');
    $('.historysite').toggleClass('labelborderhidden', isZoomed);
    $body.toggleClass('near-mini-site', false);

    if (persist) {
      sessionStorage.setItem(storageKey, isZoomed ? '1' : '2');
    }
  }

  function isNearMiniSite(pageX, pageY) {
    if ($miniSite.hasClass('zoomed') || !$miniSiteTarget.length) {
      return false;
    }

    const rect = $miniSiteTarget[0].getBoundingClientRect();
    const left = rect.left + window.scrollX - hoverRadius;
    const right = rect.right + window.scrollX + hoverRadius;
    const top = rect.top + window.scrollY - hoverRadius;
    const bottom = rect.bottom + window.scrollY + hoverRadius;

    return pageX >= left && pageX <= right && pageY >= top && pageY <= bottom;
  }

  if (sessionStorage.getItem(storageKey) !== '1' && sessionStorage.getItem(storageKey) !== '2') {
    sessionStorage.setItem(storageKey, '2');
  }

  setZoomState(sessionStorage.getItem(storageKey) === '1', false);

  $('#zoom-button').on('click', function() {
    setZoomState(!$miniSite.hasClass('zoomed'));
  });

  $(document).on('mousemove', function(event) {
    $body.toggleClass('near-mini-site', isNearMiniSite(event.pageX, event.pageY));
  });

  $(document).on('click', function(event) {
    if ($(event.target).closest('#zoom-button, a, button, input, select, textarea, label').length) {
      return;
    }

    if (isNearMiniSite(event.pageX, event.pageY)) {
      setZoomState(true);
    }
  });
});
