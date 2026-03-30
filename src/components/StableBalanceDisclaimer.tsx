import React from 'react';
import { DialogContainer, DialogCard } from './ui';

interface StableBalanceDisclaimerProps {
  isOpen: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

const StableBalanceDisclaimer: React.FC<StableBalanceDisclaimerProps> = ({
  isOpen,
  onAccept,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <DialogContainer>
      <DialogCard maxWidth="sm">
        <div className="text-center">
          <h3 className="font-display text-lg font-bold text-spark-text-primary mb-3">
            Stable Balance
          </h3>
          <p className="text-sm text-spark-text-secondary mb-6">
            Your balance is held in USD. Incoming BTC is automatically converted to USD,
            and outgoing payments are converted back to BTC. Amounts under the conversion
            threshold remain as change until they accumulate.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl font-display font-semibold text-sm border border-spark-border text-spark-text-secondary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              className="button flex-1 py-2.5"
            >
              Enable
            </button>
          </div>
        </div>
      </DialogCard>
    </DialogContainer>
  );
};

export default StableBalanceDisclaimer;
