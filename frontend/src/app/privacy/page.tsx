'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background-primary py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors mb-6">
          <ArrowLeft size={20} />
          Back to Home
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-primary mb-4">Privacy Policy</h1>
          <p className="text-text-secondary">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-background-secondary rounded-xl p-6 border border-border space-y-6 text-text-primary">
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-text-secondary leading-relaxed">
                Welcome to Zorium.fun ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our NFT platform and related services. We are committed to protecting your privacy and ensuring transparency about our data practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Blockchain Data</h3>
                  <p className="text-text-secondary leading-relaxed">
                    When you connect your Web3 wallet, we access publicly available blockchain information including:
                  </p>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1 mt-2">
                    <li>Wallet addresses and transaction history</li>
                    <li>NFT ownership and transfer records</li>
                    <li>Token balances (including ZRM tokens)</li>
                    <li>Smart contract interactions</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">User-Provided Information</h3>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1">
                    <li>Profile information (usernames, bio, social media links)</li>
                    <li>NFT metadata (titles, descriptions, categories)</li>
                    <li>Comments and social interactions</li>
                    <li>Collection information and preferences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Technical Information</h3>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1">
                    <li>IP addresses and device information</li>
                    <li>Browser type and version</li>
                    <li>Usage analytics and interaction data</li>
                    <li>Network preferences and settings</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-text-secondary leading-relaxed mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Provide and improve our NFT platform services</li>
                <li>Process transactions and display NFT ownership</li>
                <li>Enable social features like comments and collections</li>
                <li>Calculate and distribute ZRM token rewards</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Analyze platform usage and improve user experience</li>
                <li>Comply with legal obligations and prevent fraud</li>
                <li>Send important updates about platform changes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Public Information</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Certain information is publicly visible by design:
                  </p>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1 mt-2">
                    <li>Wallet addresses and transaction history (blockchain data)</li>
                    <li>NFTs you create, own, or have owned</li>
                    <li>Public profile information you choose to share</li>
                    <li>Comments and social interactions on the platform</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Third-Party Services</h3>
                  <p className="text-text-secondary leading-relaxed">
                    We may share information with trusted third parties including:
                  </p>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1 mt-2">
                    <li>Blockchain networks and infrastructure providers</li>
                    <li>Analytics services for platform improvement</li>
                    <li>Customer support and communication tools</li>
                    <li>Legal and compliance service providers</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Legal Requirements</h3>
                  <p className="text-text-secondary leading-relaxed">
                    We may disclose information when required by law or to protect our rights and users' safety.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We implement appropriate technical and organizational measures to protect your information:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication measures</li>
                <li>Secure cloud infrastructure and hosting</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Cookies and Tracking</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and features</li>
                <li>Maintain session state and authentication</li>
              </ul>
              <p className="text-text-secondary leading-relaxed mt-4">
                You can control cookie preferences through your browser settings, though this may affect platform functionality.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">Access and Control</h3>
                  <p className="text-text-secondary leading-relaxed">You have the right to:</p>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1 mt-2">
                    <li>Access and review your personal information</li>
                    <li>Update or correct your profile information</li>
                    <li>Delete your account and associated data</li>
                    <li>Opt out of certain communications</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-medium mb-2">Blockchain Limitations</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Please note that blockchain transactions and NFT ownership records are immutable and cannot be deleted or modified, even if you delete your account.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
              <p className="text-text-secondary leading-relaxed">
                Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <p className="text-text-secondary leading-relaxed">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Data Retention</h2>
              <p className="text-text-secondary leading-relaxed">
                We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account, though blockchain data will remain immutable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
              <p className="text-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-background-primary rounded-lg border border-border">
                <p className="text-text-primary">
                  Email: <a href="mailto:privacy@zorium.fun" className="text-purple-primary hover:text-purple-hover">privacy@zorium.fun</a>
                </p>
                <p className="text-text-primary">
                  Support: <a href="mailto:support@zorium.fun" className="text-purple-primary hover:text-purple-hover">support@zorium.fun</a>
                </p>
                <p className="text-text-primary">
                  Website: <a href="https://zorium.fun" className="text-purple-primary hover:text-purple-hover">https://zorium.fun</a>
                </p>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  )
}