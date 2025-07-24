import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Github, MessageCircle } from 'lucide-react'

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
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                <MessageCircle size={20} />
              </a>
              <a href="#" className="text-text-secondary hover:text-text-primary transition-colors">
                <Github size={20} />
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
              <Link href="/collections" className="text-text-secondary hover:text-text-primary block transition-colors">
                Collections
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
              <Link href="/help" className="text-text-secondary hover:text-text-primary block transition-colors">
                Help Center
              </Link>
              <Link href="/terms" className="text-text-secondary hover:text-text-primary block transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-text-secondary hover:text-text-primary block transition-colors">
                Privacy
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-text-secondary text-sm">
            © 2024 zorium.fun. All rights reserved.
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