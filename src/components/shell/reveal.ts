/**
 * Scroll reveal: elements with the "reveal" class start faded (protocol.css)
 * and are marked revealed the first time they scroll into view.
 *
 * The mark is both the original "visible" class and a data-revealed
 * attribute with the same effect (src/styles/overrides.css). React components
 * that change an element's class (a card opening, a set being ticked) drop
 * the class, but never touch the attribute, so the element stays shown.
 */
let observer: IntersectionObserver | null = null;

function watcher(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
        (entry.target as HTMLElement).dataset.revealed = '';
        observer?.unobserve(entry.target); // one-shot
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
  );
  return observer;
}

export const reveal = {
  /** Watches every .reveal element on the page (once, after load). */
  watchAll(): void {
    document.querySelectorAll('.reveal').forEach((el) => watcher().observe(el));
  },
  /** Watches one element (one added after load). */
  watch(el: Element): void {
    watcher().observe(el);
  },
  /**
   * Fades an element in again: used when a training day is shown, so its
   * cards replay their entrance (the old script calls it through window.__reveal).
   */
  replay(el: Element): void {
    el.classList.remove('visible');
    delete (el as HTMLElement).dataset.revealed;
    watcher().observe(el);
  },
};
