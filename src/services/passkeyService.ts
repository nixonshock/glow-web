/**
 * Passkey Service.
 *
 * Wraps the Breez SDK's Passkey class to provide
 * passkey-based wallet creation and restoration functionality.
 *
 * Uses a singleton Passkey instance so that multiple operations
 * (list, store, getWallet) share a single PRF auth session.
 */

import { Passkey, Wallet, NostrRelayConfig } from '@breeztech/breez-sdk-spark';
import { passkeyPrfProvider } from './passkeyPrfProvider';
import { logger, LogCategory } from './logger';

// Storage key — presence signals passkey mode
const PASSKEY_WALLET_NAME_KEY = 'passkeyWalletName';

// Singleton Passkey instance
let passkeyInstance: Passkey | null = null;

/**
 * Get or create the singleton Passkey instance.
 */
function getOrCreatePasskey(): Passkey {
  if (!passkeyInstance) {
    const breezApiKey = import.meta.env.VITE_BREEZ_API_KEY;
    const relayConfig: NostrRelayConfig | undefined = breezApiKey
      ? { breezApiKey }
      : undefined;
    passkeyInstance = new Passkey(passkeyPrfProvider, relayConfig ?? null);
  }
  return passkeyInstance;
}

/**
 * Release the singleton Passkey instance.
 * Nulls the reference so a fresh instance is created next time.
 * WASM memory is reclaimed via FinalizationRegistry when GC runs.
 */
export function releasePasskey(): void {
  passkeyInstance = null;
}

/**
 * Check if PRF (passkey) authentication is available on this device.
 */
export async function isPrfAvailable(): Promise<boolean> {
  // Firefox's PRF support is still unreliable — disable until stable
  const ua = navigator.userAgent;
  if (/Firefox\//i.test(ua) && !/Seamonkey\//i.test(ua)) {
    return false;
  }

  const passkey = getOrCreatePasskey();
  return await passkey.isAvailable();
}

/**
 * Check if the app is in passkey mode.
 * Passkey mode is signalled by a stored wallet name.
 */
export function isPasskeyMode(): boolean {
  return localStorage.getItem(PASSKEY_WALLET_NAME_KEY) !== null;
}

/**
 * Set passkey mode by storing the wallet name.
 */
export function setPasskeyMode(walletName?: string): void {
  localStorage.setItem(PASSKEY_WALLET_NAME_KEY, walletName ?? 'Default');
}

/**
 * Clear passkey mode.
 * Does NOT clear the persistent "passkey registered" flag — the passkey
 * still exists on the device and should be reused on next login.
 */
export function clearPasskeyMode(): void {
  localStorage.removeItem(PASSKEY_WALLET_NAME_KEY);
}

/**
 * List available wallet names from nostr relays.
 */
export async function listWalletNames(): Promise<string[]> {
  logger.info(LogCategory.AUTH, 'Listing wallet names from nostr relays');
  const passkey = getOrCreatePasskey();
  return await passkey.listWalletNames();
}

/**
 * Store a wallet name to nostr relays so it can be discovered later.
 */
export async function storeWalletName(walletName: string): Promise<void> {
  logger.info(LogCategory.AUTH, 'Storing wallet name to nostr relays');
  const passkey = getOrCreatePasskey();
  await passkey.storeWalletName(walletName);
}

/**
 * Derive a Wallet using passkey authentication.
 *
 * Falls back to saved wallet name from localStorage when no name arg provided.
 *
 * @param walletName - Optional wallet name. If omitted, uses saved name or SDK default.
 * @returns The derived Wallet object containing seed and name.
 */
export async function getWallet(walletName?: string): Promise<Wallet> {
  const effectiveName = walletName ?? localStorage.getItem(PASSKEY_WALLET_NAME_KEY) ?? undefined;

  logger.info(LogCategory.AUTH, 'Deriving wallet via passkey');

  const passkey = getOrCreatePasskey();
  try {
    const wallet = await passkey.getWallet(effectiveName);
    logger.info(LogCategory.AUTH, 'Passkey wallet derived successfully');
    return wallet;
  } catch (e) {
    logger.error(LogCategory.AUTH, 'Failed to derive passkey wallet', {
      error: e instanceof Error ? e.message : String(e),
    });
    throw e;
  }
}
