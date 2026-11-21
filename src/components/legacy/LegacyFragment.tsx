import { fragments, type FragmentName } from '@/legacy/fragments';

/**
 * Renders a not-yet-ported section of the original page as raw HTML.
 * `display: contents` keeps the wrapper out of layout, so the original CSS
 * (fixed nav, sticky minibar, section spacing) behaves exactly as before.
 */
export function LegacyFragment({ name }: { name: FragmentName }) {
  return <div style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: fragments[name] }} />;
}
