import { useEffect } from 'react';

export const useDocumentTitle = (title?: string) => {
  useEffect(() => {
    const baseTitle = 'AKIRA — Real-World Intelligence & Learning Assistant';
    if (title && title.trim()) {
      document.title = `${title} | AKIRA`;
    } else {
      document.title = baseTitle;
    }
  }, [title]);
};
