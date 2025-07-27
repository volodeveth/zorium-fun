'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useEnsName } from 'wagmi'
import { Wallet, ChevronDown } from 'lucide-react'
import UserProfileDropdown from '@/components/layout/UserProfileDropdown'

export default function ConnectWallet() {
  const { address, isConnecting, isDisconnected } = useAccount()
  const { data: ensName } = useEnsName({ address })

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        // Note: If your app doesn't use authentication, you
        // can remove all 'authenticationStatus' checks
        const ready = mounted
        const connected = ready && account && chain

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="btn-primary flex items-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 flex-shrink-0"
                    disabled={isConnecting}
                  >
                    <Wallet size={16} className="sm:w-[18px] sm:h-[18px]" />
                    <span className="hidden sm:inline">
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </span>
                    <span className="sm:hidden">
                      {isConnecting ? '...' : 'Connect'}
                    </span>
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1 sm:gap-2 text-sm sm:text-base flex-shrink-0"
                  >
                    <span className="hidden sm:inline">Wrong network</span>
                    <span className="sm:hidden">Wrong</span>
                    <ChevronDown size={14} className="sm:w-4 sm:h-4" />
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Chain Selector - Compact on mobile, full on desktop */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex bg-background-secondary hover:bg-background-tertiary border border-border px-2 sm:px-3 py-2 rounded-lg items-center gap-1 sm:gap-2 transition-colors duration-200 flex-shrink-0"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 18,
                          height: 18,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                        className="sm:w-5 sm:h-5"
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 18, height: 18 }}
                            className="sm:w-5 sm:h-5"
                          />
                        )}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm">{chain.name}</span>
                    <span className="sm:hidden text-xs">
                      {chain.name.length > 6 ? chain.name.substring(0, 4) + '...' : chain.name}
                    </span>
                    <ChevronDown size={12} className="sm:w-[14px] sm:h-[14px]" />
                  </button>

                  {/* User Profile Dropdown */}
                  <UserProfileDropdown address={account.address} />
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}