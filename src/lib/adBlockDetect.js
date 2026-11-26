let scriptBlocked = false;
let cachedDetected = null;

export function markAdScriptBlocked() {
  scriptBlocked = true;
  cachedDetected = true;
}

export function isAdScriptBlocked() {
  return scriptBlocked;
}

/**
 * Returns true when an error looks like a DOM reconciliation crash or script
 * failure caused by an ad blocker removing/blocking AdSense elements.
 */
export function isAdBlockerError(error) {
  if (!error) return false;
  const name = String(error.name || '');
  const message = String(error.message || error || '');
  if (name === 'NotFoundError') return true;
  return /removeChild|insertBefore|adsbygoogle|pagead2|googlesyndication/i.test(message);
}

/**
 * Best-effort client-side check for active ad blockers (network block or
 * cosmetic filter hiding/removing ad containers).
 */
export function detectAdBlocker() {
  if (scriptBlocked) return true;
  if (cachedDetected === true) return true;
  if (typeof document === 'undefined' || !document.body) return false;

  const bait = document.createElement('div');
  bait.className = 'adsbox ad-banner pub_300x250';
  bait.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;pointer-events:none;';
  bait.setAttribute('aria-hidden', 'true');

  try {
    document.body.appendChild(bait);
    const style = window.getComputedStyle(bait);
    const hidden =
      !bait.parentNode ||
      bait.offsetParent === null ||
      bait.offsetHeight === 0 ||
      style.display === 'none' ||
      style.visibility === 'hidden';
    if (hidden) cachedDetected = true;
    return hidden;
  } catch {
    return false;
  } finally {
    if (bait.parentNode) {
      bait.parentNode.removeChild(bait);
    }
  }
}

