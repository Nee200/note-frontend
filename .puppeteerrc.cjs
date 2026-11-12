// Security baseline from the Chrome stable release of 2026-11-11.
// Keep Windows and CI on the same project-managed browser; do not fall back
// to a workstation's independently updated Chrome installation.
module.exports = {
    chrome: { version: '157.0.8103.78' },
    'chrome-headless-shell': { skipDownload: true }
};
