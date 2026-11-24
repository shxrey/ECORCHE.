/**
 * Scroll reveal: elements with the "reveal" class start faded (protocol.css)
 * and get "visible" the first time they scroll into view.
 *
 * Because "visible" is added to the element directly, React components must
 * never change the class of a .reveal element after load (hide with a style
 * instead), or the fade-in would be undone.
 */
let observer: IntersectionObserver | null = null;

function watcher(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('visible');
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
  /**
   * Watches one element again. The old script calls this through
   * window.__reveal when it shows another day, so that day's cards fade in.
   */
  watch(el: Element): void {
    watcher().observe(el);
  },
};
