import React from 'react';
import type { SendPaymentMethod, ConversionEstimate } from '@breeztech/breez-sdk-spark';
import ConfirmStep from '../steps/ConfirmStep';

interface Bolt11WorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'bolt11Invoice' }>;
  amountSats: bigint;
  conversionEstimate?: ConversionEstimate | null;
  onBack: () => void;
  onSend: (options: { type: 'bolt11Invoice'; preferSpark: boolean }) => Promise<void>;
}

const Bolt11Workflow: React.FC<Bolt11WorkflowProps> = ({ method, amountSats, conversionEstimate, onSend }) => {
  const handleSend = () => {
    const preferSpark = method.sparkTransferFeeSats != null;
    return onSend({ type: 'bolt11Invoice', preferSpark });
  };

  // Compute display fees from prepared response
  let feesSat: number | null = null;
  if (method.sparkTransferFeeSats != null) {
    feesSat = method.sparkTransferFeeSats;
  } else if (method.lightningFeeSats != null) {
    feesSat = method.lightningFeeSats;
  }

  return <ConfirmStep amountSats={amountSats} feesSat={feesSat} conversionEstimate={conversionEstimate} error={null} isLoading={false} onConfirm={handleSend} />;
};

export default Bolt11Workflow;
