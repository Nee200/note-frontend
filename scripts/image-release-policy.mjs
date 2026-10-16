// The additional perfume series is postponed. G1–G20 / L1–L20 are already live.
// Keep the generated originals on disk; only omit the new series from builds.
export function isDeferredPerfumeImage(relativePath) {
    const match = relativePath.replaceAll('\\', '/').match(/^images_website\/new-arrivals\/[gl](\d+)-notes-v3-natural-v\d+\.(?:png|webp)$/i);
    return !!match && Number(match[1]) > 20;
}
