/**
 * WebAuthn PRF Provider for passkey-based wallet operations.
 *
 * Implements the PasskeyPrfProvider interface from the Breez SDK
 * using the browser's WebAuthn API with PRF extension.
 */

import { PasskeyPrfProvider } from '@breeztech/breez-sdk-spark';
import { logger, LogCategory } from './logger';

// RP (Relying Party) configuration
const RP_NAME = 'Glow';
// Configurable rpID for cross-app passkey sharing (requires server-side .well-known/webauthn)
const RP_ID = import.meta.env.VITE_PASSKEY_RP_ID || window.location.hostname;
logger.info(LogCategory.AUTH, 'Passkey RP_ID configured', { rpId: RP_ID });

/**
 * Browser implementation of PasskeyPrfProvider using WebAuthn PRF extension.
 *
 * Uses discoverable credentials (resident keys) so no credential ID storage is needed.
 */
class BrowserPasskeyPrfProvider implements PasskeyPrfProvider {
  /**
   * Check if PRF-capable passkey is available on this device.
   */
  async isPrfAvailable(): Promise<boolean> {
    // Check basic WebAuthn support
    if (typeof window === 'undefined' || !window.PublicKeyCredential) {
      logger.debug(LogCategory.AUTH, 'WebAuthn not supported');
      return false;
    }

    try {
      // Check if platform authenticator is available
      const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!platformAvailable) {
        logger.debug(LogCategory.AUTH, 'Platform authenticator not available');
        return false;
      }

      // Note: getClientCapabilities() doesn't report PRF extension support
      // (it reports client capabilities like hybridTransport, conditionalGet, etc.)
      // PRF support is an authenticator/extension feature confirmed during credential creation.
      //
      // We assume PRF is available if platform authenticator exists.
      // If PRF isn't actually supported, we'll get an error during create.
      logger.debug(LogCategory.AUTH, 'Platform authenticator available, assuming PRF supported');
      return true;
    } catch (e) {
      logger.warn(LogCategory.AUTH, 'Error checking PRF availability', {
        error: e instanceof Error ? e.message : String(e),
      });
      return false;
    }
  }

  /**
   * Derive a 32-byte seed from passkey PRF with the given salt.
   *
   * This will prompt the user for authentication (biometric, PIN, etc.)
   * and then evaluate the PRF extension with the provided salt.
   *
   * Flow per Yubico PRF guide:
   * 1. Registration ceremony (create) must happen first
   * 2. Authentication ceremony (get) with PRF eval
   */
  async derivePrfSeed(salt: string): Promise<Uint8Array> {
    logger.info(LogCategory.AUTH, 'Deriving PRF seed');

    // Try get() first to show the passkey picker (includes cross-device
    // passkeys like iCloud Keychain). If no existing passkey is found, the
    // browser requires the user to cancel the get() prompt before we can call
    // create() to register a new passkey — this is a browser limitation, not
    // a user error, so NotAllowedError is the expected path for first-time users.
    try {
      return await this.derivePrfSeedWithExistingPasskey(salt);
    } catch (e) {
      logger.info(LogCategory.AUTH, 'No existing passkey found, creating new one');
      return this.createAndDerivePrfSeed(salt);
    }
  }

  /**
   * Create a new passkey and derive PRF seed.
   * Called when no existing passkey is found.
   */
  private async createAndDerivePrfSeed(salt: string): Promise<Uint8Array> {
    logger.info(LogCategory.AUTH, 'Creating new passkey with PRF');

    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    // Create a new passkey with PRF enabled
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: RP_NAME,
          id: RP_ID,
        },
        user: {
          id: userId,
          name: RP_NAME,
          displayName: RP_NAME,
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' }, // RS256
        ],
        authenticatorSelection: {
          userVerification: 'required',
          residentKey: 'required',
        },
        extensions: {
          prf: {},
        },
      },
    }) as PublicKeyCredential;

    // Check if PRF was enabled
    const extResults = credential.getClientExtensionResults() as {
      prf?: { enabled?: boolean };
    };

    if (!extResults.prf?.enabled) {
      logger.error(LogCategory.AUTH, 'PRF extension not supported by authenticator');
      throw new Error('PRF extension not supported by this authenticator');
    }

    logger.info(LogCategory.AUTH, 'Passkey created with PRF support');

    // Now derive the seed using the newly created passkey
    return this.derivePrfSeedWithExistingPasskey(salt);
  }

  /**
   * Derive PRF seed using an existing passkey.
   */
  private async derivePrfSeedWithExistingPasskey(salt: string): Promise<Uint8Array> {
    const saltBytes = new TextEncoder().encode(salt);
    const challenge = crypto.getRandomValues(new Uint8Array(32));

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId: RP_ID,
        allowCredentials: [],
        userVerification: 'required',
        extensions: {
          prf: {
            eval: {
              first: saltBytes,
            },
          },
        },
      },
    }) as PublicKeyCredential;

    const extResults = credential.getClientExtensionResults() as {
      prf?: { results?: { first?: ArrayBuffer } };
    };

    if (!extResults.prf?.results?.first) {
      throw new Error('PRF evaluation failed after passkey creation');
    }

    logger.info(LogCategory.AUTH, 'PRF seed derived after passkey creation');
    return new Uint8Array(extResults.prf.results.first);
  }
}

// Export singleton instance
export const passkeyPrfProvider = new BrowserPasskeyPrfProvider();

// Export class for testing
export { BrowserPasskeyPrfProvider };
