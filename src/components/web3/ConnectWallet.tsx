'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useEnsName } from 'wagmi'
import { Wallet, ChevronDown } from 'lucide-react'

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
                    className="btn-primary flex items-center gap-2"
                    disabled={isConnecting}
                  >
                    <Wallet size={18} />
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button 
                    onClick={openChainModal} 
                    type="button"
                    className="bg-red-500 hover:bg-red-600 text-white font-medium px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                  >
                    Wrong network
                    <ChevronDown size={16} />
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-2">
                  {/* Chain Selector */}
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="bg-background-secondary hover:bg-background-tertiary border border-border px-3 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 20,
                          height: 20,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 20, height: 20 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                    <ChevronDown size={14} />
                  </button>

                  {/* Account Button */}
                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="btn-primary flex items-center gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-green-400"></div>
                    {ensName || `${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                    {account.displayBalance ? ` (${account.displayBalance})` : ''}
                    <ChevronDown size={14} />
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}