/**
 * Converts a YouTube watch URL to an embed URL.
 * Returns null for any non-YouTube or malformed input.
 *
 * Handles:
 *   https://www.youtube.com/watch?v=VIDEO_ID
 *   https://www.youtube.com/watch?v=VIDEO_ID&t=23s   (extra params are ignored)
 *   https://youtu.be/VIDEO_ID                         (short URL)
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
export const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  try {
    const u = new URL(url);

    // Standard watch URL: youtube.com/watch?v=...
    if (
      (u.hostname === 'www.youtube.com' || u.hostname === 'youtube.com') &&
      u.pathname === '/watch'
    ) {
      const videoId = u.searchParams.get('v');
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Short URL: youtu.be/VIDEO_ID
    if (u.hostname === 'youtu.be') {
      const videoId = u.pathname.slice(1); // remove leading /
      if (!videoId) return null;
      return `https://www.youtube.com/embed/${videoId}`;
    }

    return null;
  } catch {
    return null;
  }
};
