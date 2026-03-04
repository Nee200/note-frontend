// banner-sync.js
// Synchronizes the top-banner scrolling animation across all pages
// by computing the correct animation-delay based on current time.
(function () {
    var DURATION = 50; // must match CSS animation duration in seconds
    var track = document.querySelector('.top-banner-track');
    if (!track) return;
    // Calculate where in the 50s cycle we currently are
    var offset = -(Date.now() / 1000 % DURATION);
    track.style.animationDelay = offset + 's';
})();
