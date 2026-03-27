import React, { createContext, useContext } from 'react';
import type { BreezSdk } from '@breeztech/breez-sdk-spark';

interface WalletContextValue {
  sdk: BreezSdk | null;
  isConnected: boolean;
}

const WalletContext = createContext<WalletContextValue>({ sdk: null, isConnected: false });

export const WalletProvider: React.FC<{
  children: React.ReactNode;
  client: BreezSdk | null;
  isConnected?: boolean;
}> = ({ children, client, isConnected = false }) => (
  <WalletContext.Provider value={{ sdk: client, isConnected }}>{children}</WalletContext.Provider>
);

/**
 * Returns the connected BreezSdk instance.
 * Only use in components rendered after connection.
 */
export const useWallet = (): BreezSdk => {
  const { sdk } = useContext(WalletContext);
  if (!sdk) {
    throw new Error('useWallet: SDK not connected. This component should only render after connection.');
  }
  return sdk;
};

/**
 * Returns SDK and connection state. Safe to use before connection.
 */
export const useWalletConnection = () => {
  return useContext(WalletContext);
};
