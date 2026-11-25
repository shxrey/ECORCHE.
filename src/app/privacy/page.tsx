import type { Metadata } from 'next';
import { DocumentLink } from '@/components/DocumentLink';
import { LegalPage, SUPPORT_EMAIL } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — ÉCORCHÉ',
  description: 'What ÉCORCHÉ stores, why, where, and how to download or delete it.',
  alternates: { canonical: '/privacy' },
};

/*
 * Keep this page true. When something changes (a new service, new data, a
 * new analytics feature), update the text and LEGAL_UPDATED.
 */
export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={<>Privacy <span className="accent">Policy</span></>}
      summary={
        <p>
          <strong>Short version:</strong> we collect only what&apos;s needed to run ÉCORCHÉ. Without an account, nothing leaves
          your device. With one, your email and training data are stored so they can sync. We count visits anonymously,
          without cookies. No ads, no cross-site trackers, and we never sell your data.
        </p>
      }
    >
      <p>
        ÉCORCHÉ (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is an independent project based in India. It helps you follow and track a
        hypertrophy training program. This policy explains what information we handle, why, where it&apos;s kept and the
        choices you have. It applies to ecorche.app.
      </p>

      <h2>1. What we collect</h2>
      <h3>If you use ÉCORCHÉ without an account</h3>
      <p>
        Nothing you enter leaves your device. Ticked sets, weights, reps, RIR, notes and settings are saved in your
        browser&apos;s local storage on that device only.
      </p>
      <h3>If you create an account</h3>
      <ul>
        <li><strong>Your email address</strong>, to send you sign-in codes.</li>
        <li><strong>Profile details you choose to add:</strong> a display name and a username.</li>
        <li>
          <strong>Your training data:</strong> completed sets, weights, reps, reps in reserve (RIR), personal-record markers,
          exercise notes, sets completed per day, when a workout in progress started (for the session timer), and app
          settings (auto rest timer, voice cues, high-contrast mode, training week, kg or lb).
        </li>
      </ul>
      <h3>When anyone visits</h3>
      <p>
        Our hosting provider automatically processes standard technical data, such as IP address, browser type, the page
        requested and the time, to deliver the site and protect it from abuse.
      </p>
      <p>
        We also count visits with Vercel Web Analytics, which gives us anonymous totals: which pages were viewed, the site
        a visitor came from, their country, and their browser, operating system and type of device. It uses no cookies and
        doesn&apos;t identify you or follow you to other sites. Visitors are told apart only by a temporary code worked
        out from the request, which is thrown away within 24 hours.
      </p>
      <h3>If you email us</h3>
      <p>
        Your email address and whatever you write, so we can reply. A message started with <em>Send feedback</em> also
        includes the page you were on, your browser, device and screen width, and the app version, to help us fix bugs.
        You can see and edit all of it before sending.
      </p>
      <p>
        We don&apos;t collect payment details, your location, contacts, photos or anything else from your device.
      </p>

      <h2>2. How we use it</h2>
      <ul>
        <li>To sign you in and keep you signed in.</li>
        <li>To save your training data and sync it between your devices.</li>
        <li>To send sign-in codes. We don&apos;t send newsletters or marketing.</li>
        <li>To answer messages you send us.</li>
        <li>To keep ÉCORCHÉ secure and working, for example by blocking abuse.</li>
        <li>To see, in anonymous totals, how many people use ÉCORCHÉ and which pages they visit.</li>
      </ul>
      <p>
        We don&apos;t sell, rent or share your information for advertising. We don&apos;t run ads, advertising or
        cross-site tracking scripts; our only analytics are the anonymous visit counts described above. We don&apos;t
        use your data to train AI models.
      </p>

      <h2>3. Who processes it, and where</h2>
      <p>We use a few trusted services to run ÉCORCHÉ. Each one only handles what it needs to do its job for us:</p>
      <ul>
        <li><strong>Supabase</strong>: database and sign-in. Your account and training data are stored in <strong>Mumbai, India</strong>.</li>
        <li><strong>Vercel</strong>: hosts the website on a global network, including servers in the United States, and provides our anonymous visit counts.</li>
        <li><strong>Resend</strong>: sends sign-in emails, from servers in Japan.</li>
        <li><strong>ImprovMX</strong>: forwards emails sent to {SUPPORT_EMAIL} to our inbox.</li>
      </ul>
      <p>
        Because some of these services operate outside India, your information may be processed in other countries. We only
        use providers that protect it with appropriate security.
      </p>

      <h2>4. Cookies and local storage</h2>
      <ul>
        <li>
          <strong>One essential sign-in cookie</strong> while you&apos;re signed in, so you stay signed in. We don&apos;t use
          advertising or tracking cookies, so there&apos;s no cookie banner to click through.
        </li>
        <li>
          <strong>Local storage</strong> on your device holds your training data and preferences, so the app works offline and
          loads instantly.
        </li>
      </ul>

      <h2>5. Security</h2>
      <p>
        Everything travels over HTTPS. In the database, every row is locked to its owner (row-level security), so one account
        can never read or change another&apos;s data. Sign-in uses one-time email codes, so there&apos;s no password to leak.
        No system is perfectly secure; if you find a problem, please tell us at {SUPPORT_EMAIL}.
      </p>

      <h2>6. How long we keep it</h2>
      <ul>
        <li><strong>Account and training data:</strong> for as long as you have an account. When you delete it, it&apos;s removed from our database straight away.</li>
        <li><strong>Technical logs:</strong> kept by our hosting provider for a short period, then deleted automatically.</li>
        <li><strong>Visit counts:</strong> anonymous totals only; the temporary visitor code is thrown away within 24 hours.</li>
        <li><strong>Emails you send us:</strong> for as long as needed to help you.</li>
      </ul>

      <h2>7. Your choices and rights</h2>
      <ul>
        <li><strong>Download your data</strong> at any time with <em>Export Backup</em> (JSON) or <em>Export CSV</em> on the protocol page.</li>
        <li><strong>Correct it</strong> directly in the app or on your <DocumentLink href="/account">account page</DocumentLink>.</li>
        <li>
          <strong>Delete your account and all its data</strong> yourself, any time, with <em>Delete account</em> on your{' '}
          <DocumentLink href="/account">account page</DocumentLink>. It takes effect immediately and can&apos;t be undone. If
          you can&apos;t sign in, email {SUPPORT_EMAIL} from the address you used and we&apos;ll do it for you.
        </li>
        <li><strong>Clear a device:</strong> signing out removes your training data from that device. It stays safe in your account.</li>
        <li><strong>Withdraw consent</strong> at any time by stopping use and deleting your account.</li>
      </ul>
      <p>
        Depending on where you live, data-protection laws give you further rights, such as India&apos;s Digital Personal
        Data Protection Act, 2023, and the GDPR in the EU and UK. These include the right to access, correct, erase or
        port your data, to object to its use, and to complain to your data-protection authority. To use any of these
        rights, or to raise a grievance, email {SUPPORT_EMAIL}.
      </p>

      <h2>8. Children</h2>
      <p>
        ÉCORCHÉ is intended for adults. If you&apos;re under 18, use it only with a parent&apos;s or guardian&apos;s
        permission. If we learn that we hold a child&apos;s data without that permission, we&apos;ll delete it.
      </p>

      <h2>9. Not a medical service</h2>
      <p>
        ÉCORCHÉ is a training tracker, not a medical or health service, and your training data isn&apos;t treated as medical
        records. See our <DocumentLink href="/terms">Terms of Service</DocumentLink> for important safety information.
      </p>

      <h2>10. Changes to this policy</h2>
      <p>
        If we change this policy, we&apos;ll update the date at the top. If a change is significant, we&apos;ll also let
        you know in the app before it takes effect.
      </p>
    </LegalPage>
  );
}
