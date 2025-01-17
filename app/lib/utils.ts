export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Handle server-side
  return `http://localhost:${process.env.PORT || 3000}`;
}
