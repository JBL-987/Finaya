export const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'finaya.app',
  window.location.hostname
];

/**
 * Validates if a URL is safe for redirection.
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if safe, false otherwise
 */
export const isSafeRedirect = (url) => {
  if (!url) return false;

  // 1. Allow relative URLs (must start with / but not //)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // 2. Allow absolute URLs matching allowed domains
  try {
    const urlObj = new URL(url);
    return ALLOWED_DOMAINS.includes(urlObj.hostname);
  } catch (e) {
    return false;
  }
};

/**
 * Safely redirects the user. Blocks unsafe URLs.
 * @param {string} url - Target URL
 */
export const safeRedirect = (url) => {
  if (isSafeRedirect(url)) {
    window.location.href = url;
  } else {
    console.warn(`Blocked unsafe redirect to: ${url}`);
    window.location.href = '/';
  }
};
