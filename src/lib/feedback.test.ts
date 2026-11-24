// npm run test:sync (also runs this) — the pre-filled "Send feedback" email.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { describeDevice, FEEDBACK_HREF, feedbackMailto } from './feedback';

const UA = {
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  iphoneChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/131.0.6778.73 Mobile/15E148 Safari/604.1',
  samsung: 'Mozilla/5.0 (Linux; Android 13; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36',
  windowsEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
  macFirefox: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.6; rv:132.0) Gecko/20100101 Firefox/132.0',
};

describe('feedback email', () => {
  it('names the browser and system in plain words', () => {
    assert.equal(describeDevice(UA.androidChrome), 'Chrome 131 on Android 14');
    assert.equal(describeDevice(UA.iphoneSafari), 'Safari 18.1 on iOS 18.1');
    assert.equal(describeDevice(UA.iphoneChrome), 'Chrome 131 on iOS 18.1');
    assert.equal(describeDevice(UA.samsung), 'Samsung Internet 26 on Android 13');
    assert.equal(describeDevice(UA.windowsEdge), 'Edge 131 on Windows');
    assert.equal(describeDevice(UA.macFirefox), 'Firefox 132 on macOS');
    assert.equal(describeDevice(''), 'unknown browser on unknown system');
  });

  it('starts an email to support with the details, which the sender can edit', () => {
    const href = feedbackMailto({ page: 'ecorche.app/#legsA', userAgent: UA.androidChrome, width: 412, version: 'e313dcd' });
    assert.ok(href.startsWith(FEEDBACK_HREF + '&body='));
    const url = new URL(href);
    assert.equal(url.pathname, 'support@ecorche.app');
    assert.equal(url.searchParams.get('subject'), 'ÉCORCHÉ feedback');
    const body = url.searchParams.get('body')!;
    assert.match(body, /^What happened, or what would you like to see\?\r\n/);
    assert.match(body, /\r\nPage: ecorche\.app\/#legsA\r\n/);
    assert.match(body, /\r\nDevice: Chrome 131 on Android 14, 412px wide\r\n/);
    assert.match(body, /\r\nVersion: e313dcd$/);
    assert.doesNotMatch(feedbackMailto({ page: 'x', userAgent: '', width: 1 }), /Version/, 'no version line when unknown');
  });
});
