import type { Payment, PaymentDetails } from '@breeztech/breez-sdk-spark';

/** Strip token-specific suffix from ticker for display (e.g. "USDB" → "USD") */
const TICKER_DISPLAY_OVERRIDES: Record<string, string> = { USDB: 'USD' };
const tickerToDisplayName = (ticker: string): string =>
  TICKER_DISPLAY_OVERRIDES[ticker] ?? ticker;

/** Check if payment details have conversionInfo */
const hasConversionInfo = (details?: PaymentDetails): boolean =>
  !!details && 'conversionInfo' in details && details.conversionInfo != null;

/** Human-readable title/description for a payment in the transaction list and details dialog. */
export const getPaymentTitle = (payment: Payment, fiatCurrencyName?: string | null): string => {
  if (payment.method === 'lightning') {
    if (payment.details?.type === 'lightning') {
      if (payment.details.lnurlPayInfo?.lnAddress) {
        return payment.details.lnurlPayInfo.lnAddress;
      }
      return payment.details?.description || 'Lightning Payment';
    }
    return 'Lightning Payment';
  }
  if (payment.method === 'spark') {
    if (hasConversionInfo(payment.details)) {
      const dir = payment.paymentType === 'send' ? 'from' : 'to';
      return `Conversion ${dir} Bitcoin`;
    }
    return 'Spark Transfer';
  }
  if (payment.method === 'token') {
    const ticker = payment.details?.type === 'token' ? payment.details.metadata.ticker : null;
    const displayName = (ticker ? tickerToDisplayName(ticker) : null) || fiatCurrencyName;
    if (hasConversionInfo(payment.details)) {
      const dir = payment.paymentType === 'send' ? 'from' : 'to';
      return `Conversion ${dir} ${displayName}`;
    }
    return displayName ? `${displayName} Transfer` : 'Token Transfer';
  }
  if (payment.method === 'deposit') return 'BTC Transfer';
  if (payment.method === 'withdraw') return 'BTC Transfer';
  return 'Payment';
};
