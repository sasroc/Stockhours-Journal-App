import React from 'react';
import { useNavigate } from 'react-router-dom';
import primaryLogo from '../assets/3.png';
import { usePageMeta } from '../hooks/usePageMeta';

const LAST_UPDATED = 'February 21, 2026';

const Section = ({ title, children }) => (
  <section style={{ marginBottom: '2.5rem' }}>
    <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(45,212,191,0.15)' }}>{title}</h2>
    <div style={{ color: '#9aafc4', fontSize: '0.9rem', lineHeight: 1.8 }}>{children}</div>
  </section>
);

const P = ({ children, style }) => <p style={{ margin: '0 0 0.75rem', ...style }}>{children}</p>;

const Ul = ({ items }) => (
  <ul style={{ margin: '0.5rem 0 0.75rem', paddingLeft: 0, listStyle: 'none' }}>
    {items.map((item, i) => (
      <li key={i} style={{ display: 'flex', gap: '10px', marginBottom: '0.4rem' }}>
        <span style={{ color: '#2DD4BF', flexShrink: 0, lineHeight: 1.8 }}>›</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function PrivacyPolicy() {
  usePageMeta({
    title: 'Privacy Policy — TradeBetter',
    description: 'TradeBetter Privacy Policy — how we collect, use, and protect your trading data and personal information.',
    canonical: 'https://tradebetter.net/privacy',
  });
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#060a12', color: '#fff', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 32px', borderBottom: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(8,12,20,0.9)', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={primaryLogo} alt="TradeBetter" style={{ height: '36px' }} />
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#f2f7ff' }}>TradeBetter</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#9aafc4', padding: '7px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back
        </button>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '56px 24px 80px' }}>
        {/* Title */}
        <div style={{ marginBottom: '3rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 12px', borderRadius: '999px', background: 'rgba(45,212,191,0.08)', border: '1px solid rgba(45,212,191,0.2)', marginBottom: '1.2rem' }}>
            <span style={{ color: '#2DD4BF', fontSize: '12px', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Legal</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.6rem', letterSpacing: '-0.4px' }}>Privacy Policy</h1>
          <p style={{ color: '#6b7f96', fontSize: '0.88rem', margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Overview">
          <P>TradeBetter ("we," "us," or "our") operates the TradeBetter trading journal platform at tradebetter.net (the "Service"). This Privacy Policy explains how we collect, use, and protect your information when you use our Service.</P>
          <P>By using TradeBetter, you agree to the collection and use of information in accordance with this policy. If you disagree with any part, please discontinue use of the Service.</P>
        </Section>

        <Section title="2. Information We Collect">
          <P><strong style={{ color: '#e2eaf4' }}>Account information</strong></P>
          <Ul items={[
            'Email address and display name (provided at sign-up)',
            'Authentication credentials managed securely by Firebase Authentication',
            'OAuth profile data if you sign in with Google or Apple (name, email)',
          ]} />
          <P><strong style={{ color: '#e2eaf4' }}>Trade and journal data</strong></P>
          <Ul items={[
            'Trade records you import (symbols, prices, quantities, P&L, timestamps)',
            'Notes, ratings, tags, and setup/mistake annotations you create',
            'Weekly review content and goals you write',
            'Broker connection tokens (encrypted, stored in Firestore)',
          ]} />
          <P><strong style={{ color: '#e2eaf4' }}>Payment information</strong></P>
          <Ul items={[
            'Subscription plan and billing status',
            'Payment processing is handled entirely by Stripe — we never store raw card numbers',
          ]} />
          <P><strong style={{ color: '#e2eaf4' }}>Usage data</strong></P>
          <Ul items={[
            'Log data such as browser type, pages visited, and timestamps',
            'Device information (operating system, screen resolution)',
          ]} />
        </Section>

        <Section title="3. How We Use Your Information">
          <Ul items={[
            'To provide, operate, and maintain the Service',
            'To process your subscription payments through Stripe',
            'To generate AI-powered trade reviews and insights via OpenAI\'s GPT-4o API — your trade data is sent to OpenAI solely to generate responses and is not used to train their models under our API agreement',
            'To sync your trades from connected brokers (Schwab, Webull) when you authorize the connection',
            'To communicate with you about your account, subscription, or support requests',
            'To detect and prevent fraud or abuse',
          ]} />
        </Section>

        <Section title="4. Data Storage and Security">
          <P>Your data is stored in Google Firebase (Firestore) hosted on Google Cloud infrastructure. We apply industry-standard security measures including:</P>
          <Ul items={[
            'Encryption in transit (HTTPS/TLS) for all data transfers',
            'Firebase Security Rules restricting data access to authenticated, authorized users only',
            'OAuth tokens for broker connections stored in private Firestore subcollections',
            'Stripe handles all payment data under PCI-DSS compliance — we receive only subscription metadata',
          ]} />
          <P>No method of transmission over the Internet is 100% secure. We strive to use commercially acceptable means to protect your data but cannot guarantee absolute security.</P>
        </Section>

        <Section title="5. Third-Party Services">
          <P>We use the following third-party services to operate TradeBetter:</P>
          <Ul items={[
            'Firebase / Google Cloud — authentication and database storage',
            'Stripe — subscription billing and payment processing',
            'OpenAI — AI analysis of your trade data (subject to OpenAI\'s Privacy Policy)',
            'Charles Schwab API — trade sync for connected Schwab accounts',
            'Webull API — trade sync for connected Webull accounts',
          ]} />
          <P>Each provider has its own privacy policy governing how they handle data. We encourage you to review them.</P>
        </Section>

        <Section title="6. Data Retention">
          <P>We retain your account data for as long as your account is active. If you delete your account, we will delete your personal data and trade records within 30 days, except where retention is required by law.</P>
          <P>You can delete your trade data, notes, and AI-generated content at any time from within the app. Subscription records may be retained by Stripe per their retention policies.</P>
        </Section>

        <Section title="7. Your Rights">
          <P>Depending on your location, you may have the right to:</P>
          <Ul items={[
            'Access the personal data we hold about you',
            'Request correction of inaccurate data',
            'Request deletion of your data ("right to be forgotten")',
            'Object to or restrict certain processing',
            'Data portability — export your trade data',
          ]} />
          <P>To exercise any of these rights, contact us at the email below.</P>
        </Section>

        <Section title="8. Children's Privacy">
          <P>TradeBetter is not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If you become aware that a minor has provided us with personal information, please contact us so we can take appropriate action.</P>
        </Section>

        <Section title="9. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the "Last updated" date. Continued use of the Service after changes constitutes acceptance of the revised policy.</P>
        </Section>

        <Section title="10. Contact Us">
          <P>If you have questions about this Privacy Policy or your data, please contact us at:</P>
          <div style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.12)', borderRadius: '10px', padding: '16px 20px', fontSize: '0.88rem' }}>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}>TradeBetter</div>
            <div style={{ color: '#6b7f96' }}>rsassanimarketing@gmail.com</div>
          </div>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 32px', textAlign: 'center', color: '#3a4e62', fontSize: '12px' }}>
        © 2026 TradeBetter · <span style={{ cursor: 'pointer', color: '#4a6070' }} onClick={() => navigate('/terms')}>Terms of Service</span>
      </footer>
    </div>
  );
}
