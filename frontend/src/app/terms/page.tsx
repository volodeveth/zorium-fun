'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold text-text-primary mb-4">Terms of Service</h1>
          <p className="text-text-secondary">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-background-secondary rounded-xl p-6 border border-border space-y-6 text-text-primary">
            
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                Welcome to Zorium.fun ("we," "our," or "us"). These Terms of Service ("Terms") govern your use of the Zorium.fun platform, website, and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms. If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Zorium.fun is a decentralized NFT (Non-Fungible Token) platform that allows users to:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Create, mint, and trade NFTs on supported blockchain networks</li>
                <li>Explore and discover digital art and collectibles</li>
                <li>Participate in social features including comments and collections</li>
                <li>Earn and use ZRM (Zorium) tokens within the platform</li>
                <li>Connect Web3 wallets for blockchain interactions</li>
                <li>Access marketplace functionality for buying and selling NFTs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Wallets</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                To use certain features of our Service, you must connect a compatible Web3 wallet. You are responsible for:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Maintaining the security of your wallet and private keys</li>
                <li>All activities that occur under your wallet address</li>
                <li>Ensuring compliance with applicable laws in your jurisdiction</li>
                <li>Providing accurate information when creating content or profiles</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Content and Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-medium mb-2">User Content</h3>
                  <p className="text-text-secondary leading-relaxed">
                    Users retain ownership of original content they create and upload to the platform. By uploading content, you grant Zorium.fun a non-exclusive, worldwide, royalty-free license to display, distribute, and promote your content within the Service.
                  </p>
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">Prohibited Content</h3>
                  <p className="text-text-secondary leading-relaxed">Users may not upload content that is:</p>
                  <ul className="list-disc pl-6 text-text-secondary space-y-1 mt-2">
                    <li>Illegal, harmful, or violates third-party rights</li>
                    <li>Pornographic, violent, or inappropriate</li>
                    <li>Spam, misleading, or fraudulent</li>
                    <li>Infringes on copyright, trademark, or other intellectual property rights</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. ZRM Token and Fees</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                ZRM is the native utility token of the Zorium.fun platform. Key points about ZRM and fees:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Creator's first mint is free (gas fees only)</li>
                <li>Subsequent mints follow creator-set pricing (default or custom)</li>
                <li>Platform fees are distributed among creators, first minters, referrals, and platform operations</li>
                <li>ZRM tokens may be earned through platform activities and referrals</li>
                <li>All blockchain transactions require gas fees paid directly to the network</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Marketplace and Trading</h2>
              <p className="text-text-secondary leading-relaxed">
                Our marketplace allows users to buy and sell NFTs. All transactions are conducted on-chain and are irreversible. Users are responsible for verifying the authenticity and value of NFTs before purchase. Zorium.fun does not guarantee the value, authenticity, or legal status of any NFT.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Disclaimers and Limitations</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We disclaim all warranties, express or implied, including:
              </p>
              <ul className="list-disc pl-6 text-text-secondary space-y-2">
                <li>Merchantability, fitness for a particular purpose, and non-infringement</li>
                <li>Accuracy, reliability, or completeness of content</li>
                <li>Uninterrupted or error-free operation</li>
                <li>Security of transactions or wallet connections</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-text-secondary leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ZORIUM.FUN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Governing Law</h2>
              <p className="text-text-secondary leading-relaxed">
                These Terms shall be interpreted and governed by the laws of the jurisdiction where Zorium.fun operates, without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-text-secondary leading-relaxed">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the Service after changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p className="text-text-secondary leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="mt-4 p-4 bg-background-primary rounded-lg border border-border">
                <p className="text-text-primary">
                  Email: <a href="mailto:legal@zorium.fun" className="text-purple-primary hover:text-purple-hover">legal@zorium.fun</a>
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