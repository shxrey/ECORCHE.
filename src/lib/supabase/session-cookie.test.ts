// npm run test:sync (also runs this) — spotting a sign-in cookie without the Supabase library.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasSessionCookie, sessionCookieName } from './session-cookie';

const URL_ = 'https://abcdefghijklmnop.supabase.co';

describe('session cookie', () => {
  it("is named after the project, the way Supabase's own client names it", () => {
    assert.equal(sessionCookieName(URL_), 'sb-abcdefghijklmnop-auth-token');
    assert.equal(sessionCookieName('not a url'), null);
  });

  it('is found whole or split into chunks', () => {
    assert.equal(hasSessionCookie('sb-abcdefghijklmnop-auth-token=base64-abc', URL_), true);
    assert.equal(hasSessionCookie('theme=dark; sb-abcdefghijklmnop-auth-token.0=base64-a; sb-abcdefghijklmnop-auth-token.1=b', URL_), true);
  });

  it("isn't fooled by other cookies", () => {
    assert.equal(hasSessionCookie('', URL_), false, 'no cookies: signed out');
    assert.equal(hasSessionCookie('sb-abcdefghijklmnop-auth-token-code-verifier=x', URL_), false, 'a half-finished sign-in is not a session');
    assert.equal(hasSessionCookie('sb-otherproject-auth-token=x', URL_), false, 'another project');
    assert.equal(hasSessionCookie('sb-abcdefghijklmnop-auth-token.x=1', URL_), false);
    assert.equal(hasSessionCookie('sb-abcdefghijklmnop-auth-token=x', ''), false, 'Supabase not configured');
  });
});
