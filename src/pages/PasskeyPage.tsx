import React, { useEffect, useState } from 'react';
import { Seed } from '@breeztech/breez-sdk-spark';
import { PrimaryButton, SecondaryButton } from '../components/ui';
import LoadingSpinner from '../components/LoadingSpinner';
import PageLayout from '../components/layout/PageLayout';
import { AlertCard } from '../components/AlertCard';
import { UploadIcon, CheckIcon } from '../components/Icons';
import { getWallet, listLabels, storeLabel } from '@/services/passkeyService';
import { logger, LogCategory } from '@/services/logger';

interface PasskeyPageProps {
  onWalletRestored: (seed: Seed, label: string) => void;
  onBack: () => void;
}

const PasskeyPage: React.FC<PasskeyPageProps> = ({
  onWalletRestored,
  onBack,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualLabel, setManualLabel] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);


  // Fetch labels on mount
  useEffect(() => {
    const autoCreate = async () => {
      setIsConnecting(true);
      try {
        const w = await getWallet();
        storeLabel(w.label).catch((e) =>
          logger.warn(LogCategory.AUTH, 'Failed to store label', {
            error: e instanceof Error ? e.message : String(e),
          }),
        );
        onWalletRestored(w.seed, w.label);
      } catch (e) {
        setError('Failed to set up wallet');
        logger.error(LogCategory.AUTH, 'Auto-create wallet failed', {
          error: e instanceof Error ? e.message : String(e),
        });
        setIsConnecting(false);
      }
    };

    const fetchLabels = async () => {
      setIsLoading(true);
      try {
        const labels = await listLabels();
        setLabels(labels);

        if (labels.length === 0) {
          // No wallets — auto-create default
          setIsLoading(false);
          await autoCreate();
          return;
        }

        // Pre-select "Default" if present, otherwise first
        const defaultIdx = labels.indexOf('Default');
        setSelectedLabel(defaultIdx !== -1 ? labels[defaultIdx] : labels[0]);
      } catch (e) {
        setError('Failed to discover labels');
        logger.error(LogCategory.AUTH, 'Failed to list labels', {
          error: e instanceof Error ? e.message : String(e),
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchLabels();
  }, [onWalletRestored]);

  const handleConnect = async () => {
    const label = manualLabel.trim();
    const labelToUse = label || selectedLabel;
    if (!labelToUse) return;

    setIsConnecting(true);
    setError(null);

    try {
      if (label) {
        storeLabel(labelToUse).catch((e) =>
          logger.warn(LogCategory.AUTH, 'Failed to store wallet name', {
            error: e instanceof Error ? e.message : String(e),
          }),
        );
      }
      const w = await getWallet(labelToUse);
      logger.info(LogCategory.AUTH, 'Passkey wallet derived');
      onWalletRestored(w.seed, w.label);
    } catch (e) {
      setError('Failed to connect');
      logger.error(LogCategory.AUTH, 'Passkey wallet restore failed', {
        error: e instanceof Error ? e.message : String(e),
      });
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout onBack={onBack} footer={<div />} title="Passkey">
        <div className="flex flex-col items-center justify-center h-full">
          <LoadingSpinner text="Discovering labels..." />
        </div>
      </PageLayout>
    );
  }

  if (isConnecting) {
    return (
      <PageLayout onBack={onBack} footer={<div />} title="Passkey">
        <div className="flex flex-col items-center justify-center h-full">
          <LoadingSpinner text="Connecting..." />
        </div>
      </PageLayout>
    );
  }

  // 1+ wallets — unified selection list + create option
  const canConnect = !!(manualLabel.trim() || selectedLabel);
  const footer = (
    <div className="max-w-xl mx-auto space-y-3">
      <PrimaryButton
        className="w-full"
        onClick={handleConnect}
        disabled={!canConnect}
      >
        Connect
      </PrimaryButton>
      <SecondaryButton className="w-full" onClick={onBack}>
        Go Back
      </SecondaryButton>
    </div>
  );

  return (
    <PageLayout onBack={onBack} footer={footer} title="Passkey">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl bg-spark-primary/20 flex items-center justify-center">
            <UploadIcon size="xl" className="text-spark-primary" />
          </div>
        </div>

        <div className="text-center mb-4">
          <h2 className="text-xl font-display font-bold text-spark-text-primary mb-2">
            Select Label
          </h2>
        </div>

        <div className="space-y-2">
          {labels.map((label) => (
            <button
              key={label}
              onClick={() => {
                setSelectedLabel(label);
                setManualLabel('');
              }}
              className={`
                w-full p-4 rounded-2xl border text-left transition-all
                ${selectedLabel === label && !manualLabel.trim()
                  ? 'bg-spark-primary/10 border-spark-primary'
                  : 'bg-spark-dark border-spark-border hover:border-spark-border-light'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-display font-medium text-spark-text-primary">
                  {label}
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedLabel === label && !manualLabel.trim() ? 'bg-spark-primary' : 'bg-transparent'}`}>
                  {selectedLabel === label && !manualLabel.trim() && (
                    <CheckIcon size="sm" className="text-white" />
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Create new label */}
          {!showManualInput ? (
            <button
              type="button"
              onClick={() => setShowManualInput(true)}
              className="w-full p-4 rounded-2xl border bg-spark-dark border-spark-border hover:border-spark-border-light text-left transition-all"
            >
              <span className="text-sm font-medium text-spark-text-secondary">
                Create a new label...
              </span>
            </button>
          ) : (
            <div
              className={`
                w-full p-4 rounded-2xl border transition-all
                ${manualLabel.trim()
                  ? 'bg-spark-primary/10 border-spark-primary'
                  : 'bg-spark-dark border-spark-border'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-spark-text-secondary">
                  Create a new label
                </span>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${manualLabel.trim() ? 'bg-spark-primary' : 'bg-transparent'}`}>
                  {manualLabel.trim() && (
                    <CheckIcon size="sm" className="text-white" />
                  )}
                </div>
              </div>
              <input
                type="text"
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="Wallet name"
                className="w-full bg-spark-surface border border-spark-border rounded-xl px-3 py-2 text-spark-text-primary placeholder:text-spark-text-muted focus:outline-none focus:ring-2 focus:ring-spark-primary/50 focus:border-spark-primary text-sm"
                autoFocus
              />
            </div>
          )}
        </div>

        {error && (
          <AlertCard variant="error" title={error}>
            <p className="text-spark-text-secondary text-sm">Please ensure your device supports passkeys and is the correct device</p>
          </AlertCard>
        )}
      </div>
    </PageLayout>
  );
};

export default PasskeyPage;
