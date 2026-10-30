import { useEffect } from 'react';

/**
 * Hook to manage document title, meta description, and robots indexing directives.
 *
 * Helps maintain SEO integrity while preventing Google AdSense and search crawlers
 * from serving ads or indexing non-content screens (lobbies, live auction rooms, admin).
 */
export function useDocumentTitle(title, description, noIndex = false) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', description);
      } else {
        metaDescription = document.createElement('meta');
        metaDescription.name = 'description';
        metaDescription.content = description;
        document.head.appendChild(metaDescription);
      }
    }

    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'noindex, nofollow');
      } else {
        metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        metaRobots.content = 'noindex, nofollow';
        document.head.appendChild(metaRobots);
      }
    } else {
      if (metaRobots) {
        metaRobots.setAttribute('content', 'index, follow');
      }
    }
  }, [title, description, noIndex]);
}

export default useDocumentTitle;
