import type { AnchorHTMLAttributes } from 'react';

/**
 * A plain link that always does a full page load. Use it for any link INTO or
 * OUT OF the protocol page: the original app's script (public/legacy) can only
 * boot once per document, so arriving via Next's client-side navigation would
 * leave the set dots and logger dead until a refresh.
 */
export function DocumentLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />;
}
