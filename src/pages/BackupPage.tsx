import React, { useEffect, useState } from 'react';
import { WarningIcon } from '../components/Icons';
import SlideInPage from '../components/layout/SlideInPage';
import { isPasskeyMode, getWallet } from '@/services/passkeyService';
import { logger, LogCategory } from '@/services/logger';

interface BackupPageProps {
  onBack: () => void;
}

const BackupPage: React.FC<BackupPageProps> = ({ onBack }) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPasskey = isPasskeyMode();

  useEffect(() => {
    setMnemonic(localStorage.getItem('walletMnemonic'));
  }, []);

  const handleRevealPasskey = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const w = await getWallet();
      if (w.seed.type === 'mnemonic' && w.seed.mnemonic) {
        setMnemonic(w.seed.mnemonic);
        setIsRevealed(true);
      } else {
        setError('Could not derive recovery phrase');
      }
    } catch (e) {
      logger.error(LogCategory.AUTH, 'Failed to derive mnemonic from passkey', {
        error: e instanceof Error ? e.message : String(e),
      });
      setError(e instanceof Error ? e.message : 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!mnemonic) return;
    try {
      await navigator.clipboard.writeText(mnemonic);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      logger.warn(LogCategory.UI, 'Failed to copy mnemonic to clipboard', {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  const words = mnemonic ? mnemonic.split(' ') : [];

  // Passkey mode - show reveal option with passkey auth
  if (isPasskey) {
    return (
      <SlideInPage title="Backup" onClose={onBack} slideFrom="left">
        <div className="p-4">
          <div className="max-w-xl mx-auto w-full space-y-6">
            {/* Reveal toggle for passkey */}
            {!isRevealed && !mnemonic && (
              <button
                onClick={handleRevealPasskey}
                disabled={isLoading}
                className="w-full bg-spark-dark border border-spark-border rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-spark-border-light transition-colors disabled:opacity-50"
              >
                <div className="w-16 h-16 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
                  {isLoading ? (
                    <svg className="w-8 h-8 text-spark-primary animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-spark-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </div>
                <span className="font-display font-semibold text-spark-text-primary">
                  {isLoading ? 'Authenticating...' : 'Tap to reveal phrase'}
                </span>
                <span className="text-sm text-spark-text-muted">
                  {isLoading ? 'Complete passkey authentication' : 'Requires passkey authentication'}
                </span>
              </button>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-spark-error/10 border border-spark-error/30 rounded-xl p-4 text-center">
                <p className="text-spark-error text-sm">{error}</p>
              </div>
            )}

            {/* Mnemonic display for passkey */}
            {isRevealed && mnemonic && (
              <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-spark-text-secondary">Recovery Phrase</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsRevealed(false);
                        setMnemonic(null);
                      }}
                      className="px-3 py-1.5 text-sm font-medium text-spark-text-muted hover:text-spark-text-primary border border-spark-border rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Hide
                    </button>
                    <button
                      onClick={handleCopy}
                      className={`
                        px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                        ${copied
                          ? 'bg-spark-success/20 text-spark-success border border-spark-success/30'
                          : 'bg-spark-primary text-white hover:bg-spark-primary-light'
                        }
                      `}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {words.map((word, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 bg-spark-surface rounded-lg px-3 py-2"
                    >
                      <span className="text-spark-text-muted text-xs font-mono w-5 text-right">
                        {index + 1}.
                      </span>
                      <span className="text-spark-text-primary font-mono text-sm font-medium">
                        {word}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Passkey info card */}
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-spark-primary/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-spark-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-spark-text-primary mb-1">Passkey Protected</h4>
                  <p className="text-spark-text-muted text-sm">
                    Your recovery phrase is derived from your passkey. To restore on another device, use your passkey or the recovery phrase above.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SlideInPage>
    );
  }

  return (
    <SlideInPage title="Backup" onClose={onBack} slideFrom="left">
      <div className="p-4">
        <div className="max-w-xl mx-auto w-full space-y-6">
          {/* Reveal toggle */}
          {!isRevealed && mnemonic && (
            <button
              onClick={() => setIsRevealed(true)}
              className="w-full bg-spark-dark border border-spark-border rounded-2xl p-8 flex flex-col items-center gap-4 hover:border-spark-border-light transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-spark-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-display font-semibold text-spark-text-primary">Tap to reveal phrase</span>
              <span className="text-sm text-spark-text-muted">Make sure no one is watching</span>
            </button>
          )}

          {/* Mnemonic display */}
          {isRevealed && mnemonic && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-spark-text-secondary">Recovery Phrase</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRevealed(false)}
                    className="px-3 py-1.5 text-sm font-medium text-spark-text-muted hover:text-spark-text-primary border border-spark-border rounded-lg hover:bg-white/5 transition-colors"
                  >
                    Hide
                  </button>
                  <button
                    onClick={handleCopy}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-all
                      ${copied
                        ? 'bg-spark-success/20 text-spark-success border border-spark-success/30'
                        : 'bg-spark-primary text-white hover:bg-spark-primary-light'
                      }
                    `}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {words.map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 bg-spark-surface rounded-lg px-3 py-2"
                  >
                    <span className="text-spark-text-muted text-xs font-mono w-5 text-right">
                      {index + 1}.
                    </span>
                    <span className="text-spark-text-primary font-mono text-sm font-medium">
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No mnemonic state */}
          {!mnemonic && (
            <div className="bg-spark-dark border border-spark-border rounded-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-spark-error/20 flex items-center justify-center mx-auto mb-4">
                <WarningIcon size="xl" className="text-spark-error" />
              </div>
              <h3 className="font-display font-semibold text-spark-text-primary mb-2">No Backup Found</h3>
              <p className="text-spark-text-muted text-sm">
                Could not find a recovery phrase for this wallet.
              </p>
            </div>
          )}
        </div>
      </div>
    </SlideInPage>
  );
};

export default BackupPage;
