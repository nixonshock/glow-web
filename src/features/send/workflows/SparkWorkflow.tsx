import React from 'react';
import type { SendPaymentMethod, SendPaymentOptions, ConversionEstimate } from '@breeztech/breez-sdk-spark';
import ConfirmStep from '../steps/ConfirmStep';

interface SparkWorkflowProps {
  method: Extract<SendPaymentMethod, { type: 'sparkAddress' }>;
  amountSats: bigint;
  feesIncluded?: boolean;
  conversionEstimate?: ConversionEstimate | null;
  onBack: () => void;
  onSend: (options?: SendPaymentOptions) => Promise<void>;
}

const SparkWorkflow: React.FC<SparkWorkflowProps> = ({ method, amountSats, feesIncluded, conversionEstimate, onSend }) => {
  // Currently no fee exposed for spark address
  const feesSat: number | null = method.type === 'sparkAddress' ? null : null;
  const handleSend = () => onSend();
  return <ConfirmStep amountSats={amountSats} feesSat={feesSat} feesIncluded={feesIncluded} conversionEstimate={conversionEstimate} error={null} isLoading={false} onConfirm={handleSend} />;
};

export default SparkWorkflow;
