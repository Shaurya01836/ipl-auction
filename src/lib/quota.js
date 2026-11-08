/**
 * Detect whether a Firebase error represents quota / resource exhaustion.
 * Specifically distinguishes quota errors from standard network, permission, or auth errors.
 */
export const isQuotaError = (error) => {
  if (!error) return false;
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || error || '').toLowerCase();

  // Standard Firebase / GCP quota error codes
  if (
    code === 'resource-exhausted' ||
    code === 'functions/resource-exhausted' ||
    code === 'storage/quota-exceeded' ||
    code === 'quota-exceeded'
  ) {
    return true;
  }

  // Exact phrase checks to prevent false positives from generic words
  if (
    message.includes('resource-exhausted') ||
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('quota-exceeded') ||
    message.includes('quota limits') ||
    message.includes('over quota') ||
    message.includes('over-quota') ||
    message.includes('daily free limit') ||
    message.includes('bandwidth limit exceeded') ||
    message.includes('limit exceeded')
  ) {
    return true;
  }

  return false;
};

