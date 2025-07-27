import Link from 'next/link'
import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="bg-background-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Image 
                src="/images/zoriumfun-logo.png" 
                alt="Zorium Logo" 
                width={32} 
                height={32}
                className="transition-transform duration-200 hover:scale-110"
              />
              <div className="text-2xl font-bold gradient-text">
                zorium.fun
              </div>
            </div>
            <p className="text-text-secondary text-sm">
              Create & Discover NFTs on Zora Network with integrated social features and ZORIUM token utility.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/zoriumfun" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://warpcast.com/zoriumfun" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary transition-colors">
                <Image 
                  src="/images/farcaster-grey.png" 
                  alt="Farcaster" 
                  width={20} 
                  height={20}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div className="space-y-4">
            <h3 className="text-text-primary font-semibold">Marketplace</h3>
            <div className="space-y-2 text-sm">
              <Link href="/explore" className="text-text-secondary hover:text-text-primary block transition-colors">
                Explore NFTs
              </Link>
              <Link href="/trending" className="text-text-secondary hover:text-text-primary block transition-colors">
                Trending
              </Link>
            </div>
          </div>

          {/* Create */}
          <div className="space-y-4">
            <h3 className="text-text-primary font-semibold">Create</h3>
            <div className="space-y-2 text-sm">
              <Link href="/create" className="text-text-secondary hover:text-text-primary block transition-colors">
                Create NFT
              </Link>
              <Link href="/promote" className="text-text-secondary hover:text-text-primary block transition-colors">
                Promote NFT
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="text-text-primary font-semibold">Support</h3>
            <div className="space-y-2 text-sm">
              <a href="mailto:support@zorium.fun" className="text-text-secondary hover:text-text-primary block transition-colors">
                Help Center
              </a>
              <Link href="/terms" className="text-text-secondary hover:text-text-primary block transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-text-secondary hover:text-text-primary block transition-colors">
                Privacy Policy
              </Link>
              <a href="mailto:legal@zorium.fun" className="text-text-secondary hover:text-text-primary block transition-colors">
                Legal
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm">
            © {new Date().getFullYear()} zorium.fun. All rights reserved.
          </p>
          <p className="text-text-secondary text-sm mt-4 md:mt-0">
            Powered by Zorium (ZRM) • {' '}
            <a 
              href="https://www.zorium.xyz/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-primary hover:text-purple-hover transition-colors"
            >
              zorium.xyz
            </a>
            {' '} • Developed by {' '}
            <a 
              href="https://zora.co/@volodeveth" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-primary hover:text-purple-hover transition-colors"
            >
              VoloDev.eth
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}