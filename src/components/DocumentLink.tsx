import type { AnchorHTMLAttributes } from 'react';

/**
 * A plain link that always does a full page load, used between the site's
 * pages (protocol, account, sign-in, legal). It was required while the
 * original app's script ran the protocol page: that could only boot once per
 * document. Since Phase 4 nothing needs it; switching these to next/link
 * (client-side navigation) is possible, as a change tested on its own.
 */
export function DocumentLink(props: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} />;
}
