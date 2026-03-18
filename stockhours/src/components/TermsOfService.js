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

const P = ({ children }) => <p style={{ margin: '0 0 0.75rem' }}>{children}</p>;

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

export default function TermsOfService() {
  usePageMeta({
    title: 'Terms of Service — TradeBetter',
    description: 'TradeBetter Terms of Service — the legal terms governing your use of the TradeBetter options trading journal platform.',
    canonical: 'https://tradebetter.net/terms',
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
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.6rem', letterSpacing: '-0.4px' }}>Terms of Service</h1>
          <p style={{ color: '#6b7f96', fontSize: '0.88rem', margin: 0 }}>Last updated: {LAST_UPDATED}</p>
        </div>

        <Section title="1. Acceptance of Terms">
          <P>By accessing or using TradeBetter ("Service"), operated by TradeBetter ("we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.</P>
          <P>We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the revised Terms.</P>
        </Section>

        <Section title="2. Description of Service">
          <P>TradeBetter is a trading journal platform that allows users to import, analyze, and review their options and stock trades. The Service includes:</P>
          <Ul items={[
            'Trade import and analysis tools',
            'Daily stats, reports, and performance metrics',
            'Broker connectivity (Schwab, Webull)',
            'AI-powered trade review and insights (Pro plan)',
            'Weekly review and goal-setting features (Pro plan)',
          ]} />
          <P>TradeBetter is a journaling and analytics tool only. It does not provide investment advice, financial advice, or trading recommendations. All trade analysis is for educational and reflective purposes.</P>
        </Section>

        <Section title="3. Accounts and Registration">
          <P>To use TradeBetter you must create an account. You agree to:</P>
          <Ul items={[
            'Provide accurate and complete registration information',
            'Maintain the security of your password and account',
            'Notify us immediately of any unauthorized access',
            'Take responsibility for all activity under your account',
          ]} />
          <P>We reserve the right to terminate accounts that violate these Terms, engage in fraudulent activity, or remain inactive for an extended period.</P>
        </Section>

        <Section title="4. Subscriptions and Billing">
          <P><strong style={{ color: '#e2eaf4' }}>Plans</strong></P>
          <P>TradeBetter offers subscription plans (Basic and Pro) billed monthly or annually. Plan details and pricing are listed on the pricing page and subject to change with notice.</P>
          <P><strong style={{ color: '#e2eaf4' }}>Billing</strong></P>
          <Ul items={[
            'Subscriptions are billed in advance on a recurring basis via Stripe',
            'You authorize us to charge your payment method for all fees',
            'All prices are in USD unless otherwise stated',
          ]} />
          <P><strong style={{ color: '#e2eaf4' }}>Cancellation</strong></P>
          <Ul items={[
            'You may cancel your subscription at any time from the billing portal',
            'Cancellations take effect at the end of the current billing period — you retain access until then',
            'No partial refunds are issued for unused time within a billing period',
          ]} />
          <P><strong style={{ color: '#e2eaf4' }}>Refunds</strong></P>
          <P>We offer refunds at our discretion within 7 days of the initial subscription charge if you have not meaningfully used the Service. Contact us at rsassanimarketing@gmail.com to request a refund.</P>
        </Section>

        <Section title="5. Acceptable Use">
          <P>You agree not to:</P>
          <Ul items={[
            'Use the Service for any unlawful purpose or in violation of any regulations',
            'Attempt to gain unauthorized access to any part of the Service or its infrastructure',
            'Reverse-engineer, decompile, or disassemble any part of the Service',
            'Scrape, crawl, or systematically extract data from the Service',
            'Transmit malware, viruses, or other harmful code',
            'Impersonate another person or entity',
            'Use the Service to manipulate markets or engage in illegal trading activity',
          ]} />
        </Section>

        <Section title="6. AI Features and Limitations">
          <P>AI-powered features (trade review, pattern detection, weekly review) are provided on the Pro plan. By using these features:</P>
          <Ul items={[
            'You understand that AI outputs are generated automatically and may contain errors or inaccuracies',
            'AI insights are for journaling and self-reflection purposes only — not financial advice',
            'Your trade data is sent to OpenAI\'s API to generate responses; OpenAI\'s usage policies apply',
            'We do not guarantee the accuracy, completeness, or suitability of any AI-generated content',
          ]} />
        </Section>

        <Section title="7. Broker Connections">
          <P>When you connect a broker account (Schwab, Webull), you authorize TradeBetter to access your trade history through OAuth. You may revoke access at any time from the Settings page or through your broker's account settings.</P>
          <P>We are not affiliated with, endorsed by, or responsible for the actions of any connected broker. Broker APIs may have outages or changes that affect sync functionality.</P>
        </Section>

        <Section title="8. Intellectual Property">
          <P>All content, features, and functionality of the Service — including software, text, graphics, logos, and design — are the exclusive property of TradeBetter and are protected by applicable copyright, trademark, and other intellectual property laws.</P>
          <P>Your trade data, notes, and journal entries remain your property. You grant us a limited license to store and process this data solely to provide the Service.</P>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <P>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</P>
          <P>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR COMPLETELY SECURE. USE OF THE SERVICE IS AT YOUR OWN RISK.</P>
        </Section>

        <Section title="10. Limitation of Liability">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRADEBETTER SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.</P>
          <P>OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.</P>
        </Section>

        <Section title="11. Governing Law">
          <P>These Terms are governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved through binding arbitration, except where prohibited by law.</P>
        </Section>

        <Section title="12. Contact Us">
          <P>Questions about these Terms? Contact us at:</P>
          <div style={{ background: 'rgba(45,212,191,0.05)', border: '1px solid rgba(45,212,191,0.12)', borderRadius: '10px', padding: '16px 20px', fontSize: '0.88rem' }}>
            <div style={{ color: '#fff', fontWeight: 700, marginBottom: '4px' }}>TradeBetter</div>
            <div style={{ color: '#6b7f96' }}>rsassanimarketing@gmail.com</div>
          </div>
        </Section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px 32px', textAlign: 'center', color: '#3a4e62', fontSize: '12px' }}>
        © 2026 TradeBetter · <span style={{ cursor: 'pointer', color: '#4a6070' }} onClick={() => navigate('/privacy')}>Privacy Policy</span>
      </footer>
    </div>
  );
}
