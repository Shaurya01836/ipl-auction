/**
 * Verifies whether a given authenticated user has administrator privileges.
 * Performs a case-insensitive, trimmed comparison against the configured admin email.
 */
export const isUserAdmin = (user, adminEmail) => {
  if (!user || !user.email || typeof user.email !== 'string') return false;
  if (!adminEmail || typeof adminEmail !== 'string') return false;

  const normalizedUserEmail = user.email.trim().toLowerCase();
  const normalizedAdminEmail = adminEmail.trim().toLowerCase();

  return normalizedUserEmail.length > 0 && normalizedUserEmail === normalizedAdminEmail;
};

