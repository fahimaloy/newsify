import DOMPurify from 'dompurify';

export const sanitizeHtml = (html: string): string => {
  if (!html) return '';
  
  // Configure DOMPurify to allow specific tags and attributes if needed
  // For now, we use default safe list which strips scripts, iframes (except specific ones maybe), etc.
  
  // We might want to allow YouTube iframes if we embed them in description
  // But our PostDetails uses a separate video field.
  // If description contains rich text with iframes, we need to be careful.
  
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['iframe'], // Allow iframes for embeds if editors use them
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'] // Allow iframe attributes
  });
};
