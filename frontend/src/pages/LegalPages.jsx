import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LegalLayout = ({ title, children }) => (
  <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-white">
    <header className="glass-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <Heart className="w-7 h-7 text-primary fill-primary" />
          <span className="text-xl font-heading font-bold">SoulSathiya</span>
        </Link>
        <Link to="/"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Home</Button></Link>
      </div>
    </header>
    <main className="container mx-auto px-6 py-12 max-w-4xl prose prose-gray">
      <h1 className="font-heading text-4xl mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm mb-8">Last updated: March 2026</p>
      {children}
    </main>
    <footer className="border-t py-8 text-center text-sm text-muted-foreground">
      <p>© 2026 SoulSathiya · <Link to="/privacy" className="hover:text-primary">Privacy Policy</Link> · <Link to="/terms" className="hover:text-primary">Terms of Service</Link></p>
    </footer>
  </div>
);

export const PrivacyPolicyPage = () => (
  <LegalLayout title="Privacy Policy">
    <div className="space-y-6 text-gray-700 leading-relaxed">
      <section>
        <h2 className="font-heading text-2xl mb-3">1. Information We Collect</h2>
        <p>SoulSathiya collects personal information you provide when registering, including your name, email address, date of birth, and demographic details. We also collect profile information such as occupation, city, education, and relationship preferences.</p>
        <p className="mt-2">We collect psychometric assessment responses which are used solely for the purpose of computing compatibility scores. These are stored securely and never shared with third parties.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">2. How We Use Your Information</h2>
        <p>Your information is used to:</p>
        <ul className="list-disc ml-6 space-y-1 mt-2">
          <li>Compute and display compatibility scores with other users</li>
          <li>Enable messaging between mutually interested users</li>
          <li>Process subscription and payment transactions via Razorpay</li>
          <li>Send notifications about interests, messages, and matches</li>
          <li>Maintain safety through admin moderation</li>
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">3. Photo Privacy</h2>
        <p>Photos are stored securely on AWS S3. You can choose to make your photos private — private photos are only visible to users with whom you have a mutual accepted interest. You may delete your photos at any time from your profile.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">4. Data Security</h2>
        <p>We implement industry-standard security measures including bcrypt password hashing, HTTPS-only connections, HTTP-only secure cookies for session management, and regular security audits. Your psychometric data is encrypted at rest.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">5. Your Rights</h2>
        <p>You may request deletion of your account and all associated data at any time by contacting support@soulsathiya.com. You may also request a copy of your personal data held by us.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">6. Contact</h2>
        <p>For privacy-related queries, email us at privacy@soulsathiya.com or write to: SoulSathiya, India.</p>
      </section>
    </div>
  </LegalLayout>
);

export const TermsOfServicePage = () => (
  <LegalLayout title="Terms of Service">
    <div className="space-y-6 text-gray-700 leading-relaxed">
      <section>
        <h2 className="font-heading text-2xl mb-3">1. Acceptance of Terms</h2>
        <p>By creating an account on SoulSathiya, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">2. Eligibility</h2>
        <p>You must be at least 18 years of age to use SoulSathiya. By registering, you confirm you are legally eligible to marry in your jurisdiction and that all information you provide is truthful and accurate.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">3. User Conduct</h2>
        <p>You agree not to:</p>
        <ul className="list-disc ml-6 space-y-1 mt-2">
          <li>Create false or misleading profiles</li>
          <li>Harass, abuse, or threaten other users</li>
          <li>Share another user's private contact information without consent</li>
          <li>Use the platform for commercial solicitation</li>
          <li>Attempt to circumvent security measures</li>
        </ul>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">4. Subscriptions and Payments</h2>
        <p>Subscription fees are billed monthly. All payments are processed securely by Razorpay. Refunds may be requested within 7 days of purchase for unused subscriptions. Profile boosts are non-refundable once activated.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">5. Deep Couple Compatibility Exploration</h2>
        <p>The Deep Exploration feature requires payment or an Elite subscription. Both partners must complete the 108-question assessment for the AI report to be generated. The report is for informational purposes only and does not constitute professional relationship advice.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">6. Limitation of Liability</h2>
        <p>SoulSathiya provides a platform for meeting potential life partners. We do not guarantee outcomes and are not responsible for the actions of other users. Compatibility scores are algorithmic estimates and should not be the sole basis for relationship decisions.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">7. Termination</h2>
        <p>We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through account settings or by contacting support.</p>
      </section>
    </div>
  </LegalLayout>
);

export const AboutUsPage = () => (
  <LegalLayout title="About SoulSathiya">
    <div className="space-y-8 text-gray-700 leading-relaxed">
      <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-2xl p-8">
        <h2 className="font-heading text-3xl mb-4">Our Mission</h2>
        <p className="text-lg">SoulSathiya exists to increase the number of happy, deeply compatible marriages in India — by bringing psychology, behavioral science, and artificial intelligence to the world of matrimony.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">Why We're Different</h2>
        <p>Traditional matrimonial platforms match people on surface-level criteria: caste, income, height. These factors rarely predict relationship happiness. Decades of relationship science show that compatibility in values, communication styles, emotional patterns, and life expectations matter far more.</p>
        <p className="mt-3">SoulSathiya uses a 36-question psychometric assessment across 7 scientifically validated domains — including emotional style, values, trust & attachment, and marriage expectations — to compute genuine compatibility scores. Our matching algorithm weights these domains based on their actual predictive power for long-term relationship success.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">Deep Couple Compatibility Exploration</h2>
        <p>Our flagship feature goes further. When two people are mutually interested, they can unlock a 108-question deep assessment covering expectations & roles, conflict resolution, attachment patterns, lifestyle integration, intimacy, and family dynamics. An AI then generates a comprehensive compatibility report that gives both partners genuine insight into their relationship potential — before committing to anything.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">The Founder</h2>
        <p>SoulSathiya was founded by <strong>Rakesh Kumar Dogra</strong>, who believes that every person deserves a partner who truly understands and complements them. The platform was built with a singular focus: helping people build marriages that last a lifetime.</p>
      </section>
      <section>
        <h2 className="font-heading text-2xl mb-3">Get in Touch</h2>
        <p>We'd love to hear from you. Email us at hello@soulsathiya.com or follow us on Instagram and LinkedIn.</p>
        <div className="mt-4">
          <Link to="/register">
            <button className="bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors">Start Your Journey</button>
          </Link>
        </div>
      </section>
    </div>
  </LegalLayout>
);
