import type { Metadata } from 'next';
import { DocumentLink } from '@/components/legacy/DocumentLink';
import { LegalPage, SUPPORT_EMAIL } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — ÉCORCHÉ',
  description: 'The rules for using ÉCORCHÉ, including important health and safety information.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title={<>Terms of <span className="accent">Service</span></>}
      summary={
        <p>
          <strong>Short version:</strong> ÉCORCHÉ is free training information and a workout tracker, not medical advice.
          Train safely and within your limits, check with a doctor if you&apos;re unsure, don&apos;t misuse the service,
          and your data stays yours.
        </p>
      }
    >
      <p>
        These terms apply to your use of ÉCORCHÉ at ecorche.app, run by an independent developer based in India
        (&ldquo;we&rdquo;, &ldquo;us&rdquo;). By using ÉCORCHÉ you agree to them. If you don&apos;t agree, please
        don&apos;t use it.
      </p>

      <h2>1. Health and safety</h2>
      <p>
        <strong>ÉCORCHÉ is not medical advice.</strong> The program, exercise cues, research summaries and numbers are
        general educational information. They aren&apos;t a substitute for advice from a doctor, physiotherapist or
        qualified coach who knows your situation.
      </p>
      <ul>
        <li>Talk to a doctor before starting, especially if you have an injury, a medical condition, are pregnant, or haven&apos;t trained before.</li>
        <li>Stop straight away if you feel pain, dizziness, chest discomfort or shortness of breath, and get medical help if needed.</li>
        <li>Use loads you can control with good technique, use spotters and safety equipment, and check your equipment before using it.</li>
      </ul>
      <p>
        You train at your own risk. To the extent the law allows, we aren&apos;t responsible for any injury, illness or
        damage that results from following the program or using the app.
      </p>

      <h2>2. Your account</h2>
      <ul>
        <li>You can use ÉCORCHÉ without an account. An account lets you sync between devices.</li>
        <li>Use an email address you control and keep your inbox secure, because sign-in codes are sent there.</li>
        <li>One person per account. You&apos;re responsible for what happens in yours.</li>
        <li>You must be an adult, or have a parent&apos;s or guardian&apos;s permission if you&apos;re under 18.</li>
      </ul>

      <h2>3. Your data</h2>
      <p>
        Your training data and notes belong to you. You allow us to store, process and sync them only to provide
        ÉCORCHÉ to you. You can export them at any time and ask us to delete your account. Our{' '}
        <DocumentLink href="/privacy">Privacy Policy</DocumentLink> explains exactly what we hold and why.
      </p>

      <h2>4. Fair use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>try to access other people&apos;s accounts or data, or get around security;</li>
        <li>overload, disrupt, attack or probe the service, or scrape it with automated tools;</li>
        <li>use ÉCORCHÉ for anything unlawful, or to harass or harm anyone.</li>
      </ul>
      <p>We may suspend or close accounts that break these rules.</p>

      <h2>5. Our content</h2>
      <p>
        The ÉCORCHÉ name, design, program structure and written content belong to us, except the research and
        publications we cite, which belong to their authors. You may use ÉCORCHÉ for your own training. Please don&apos;t
        copy, republish or sell the app or its content without our permission.
      </p>

      <h2>6. Availability and changes</h2>
      <p>
        ÉCORCHÉ is free and provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We work to keep it running and
        your data safe, but we can&apos;t promise it will always be available, error-free, or that data will never be lost,
        so export a backup now and then. We may change, pause or retire features. If we ever shut ÉCORCHÉ down,
        we&apos;ll give reasonable notice so you can export your data.
      </p>

      <h2>7. Limits of liability</h2>
      <p>
        To the fullest extent the law allows, we give no warranties about ÉCORCHÉ and aren&apos;t liable for indirect,
        incidental or consequential losses, or for loss of data. ÉCORCHÉ is free, so our total liability to you for any
        claim is limited to the amount you&apos;ve paid us, which is zero. Nothing in these terms limits any rights you have
        that the law says can&apos;t be limited.
      </p>

      <h2>8. Ending your use</h2>
      <p>
        You can stop using ÉCORCHÉ at any time and ask us to delete your account by emailing {SUPPORT_EMAIL}. We may end
        your access if you seriously or repeatedly break these terms.
      </p>

      <h2>9. Changes to these terms</h2>
      <p>
        If we change these terms, we&apos;ll update the date at the top, and tell you in the app if the change is
        significant. Continuing to use ÉCORCHÉ after a change means you accept the new terms.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Any dispute will be handled by the courts of India, unless the law
        where you live gives you the right to bring it locally.
      </p>
    </LegalPage>
  );
}
