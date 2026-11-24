// npm run test:sync (also runs this) — sign-in error messages people can act on.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { friendlyAuthError } from './auth-errors';

describe('sign-in error messages', () => {
  it('no longer blames the address when the email could not be sent', () => {
    for (const message of ['Error sending magic link email', 'Error sending confirmation email']) {
      const text = friendlyAuthError({ message, status: 500, code: 'unexpected_failure' });
      assert.match(text, /couldn't send the email/);
      assert.doesNotMatch(text, /valid email/);
    }
  });

  it("tells people how long to wait when they ask for codes too quickly", () => {
    assert.equal(
      friendlyAuthError({ message: 'For security purposes, you can only request this after 37 seconds.', status: 429, code: 'over_email_send_rate_limit' }),
      'Please wait 37 seconds, then request a new code.',
    );
  });

  it('explains the site-wide email limit and the per-network limit differently', () => {
    assert.match(friendlyAuthError({ message: 'Email rate limit exceeded', status: 429, code: 'over_email_send_rate_limit' }), /emails are busy/);
    assert.match(friendlyAuthError({ message: 'email rate limit exceeded', status: 429 }), /emails are busy/, 'older servers without codes');
    assert.match(friendlyAuthError({ message: 'Request rate limit reached', status: 429, code: 'over_request_rate_limit' }), /this network/);
  });

  it('keeps the existing messages for wrong codes and bad addresses', () => {
    assert.equal(friendlyAuthError({ message: 'Token has expired or is invalid', status: 403, code: 'otp_expired' }), "That code didn't work. Check it, or request a new one.");
    assert.equal(friendlyAuthError({ message: 'Unable to validate email address: invalid format', status: 400, code: 'validation_failed' }), 'Enter a valid email address.');
    assert.equal(friendlyAuthError({ message: 'Email address "x@y" is invalid', status: 400, code: 'email_address_invalid' }), 'Enter a valid email address.');
  });

  it('spots a lost connection, and passes anything unknown through', () => {
    assert.match(friendlyAuthError({ message: 'Failed to fetch', status: 0 }), /Check your connection/);
    assert.equal(friendlyAuthError({ message: 'Signups not allowed for otp', status: 422, code: 'otp_disabled' }), 'Signups not allowed for otp');
  });
});
