// Security baseline from the Chrome stable release of 2026-11-23.
// Keep Windows and CI on the same project-managed browser; do not fall back
// to a workstation's independently updated Chrome installation.
module.exports = {
    chrome: { version: '158.0.8127.88' },
    'chrome-headless-shell': { skipDownload: true }
};
