import { useState, useEffect, useRef, useCallback } from 'react';
import type { GetInfoResponse } from '@breeztech/breez-sdk-spark';
import { USDB_TOKEN_IDENTIFIER } from '../constants/stableBalance';
import { getTokenBalance } from '../utils/tokenFormatting';
import { hasPromptedStableRestore, setStableRestorePrompted } from '../services/settings';

interface UseRestoreStableBalancePromptArgs {
  isSyncing: boolean;
  walletInfo: GetInfoResponse | null;
  isStableBalanceActive: boolean;
}

interface UseRestoreStableBalancePromptResult {
  shouldPrompt: boolean;
  markPrompted: () => void;
}

export function useRestoreStableBalancePrompt({
  isSyncing,
  walletInfo,
  isStableBalanceActive,
}: UseRestoreStableBalancePromptArgs): UseRestoreStableBalancePromptResult {
  const [shouldPrompt, setShouldPrompt] = useState(false);
  const wasSyncing = useRef(false);
  const syncJustCompleted = useRef(false);

  // Effect 1: Track isSyncing transitions
  useEffect(() => {
    if (isSyncing) {
      wasSyncing.current = true;
    } else if (wasSyncing.current) {
      // Sync just transitioned from true → false
      syncJustCompleted.current = true;
      wasSyncing.current = false;
    }
  }, [isSyncing]);

  // Effect 2: Check balance after sync when walletInfo updates
  useEffect(() => {
    if (!syncJustCompleted.current || !walletInfo || isStableBalanceActive) return;
    syncJustCompleted.current = false;

    if (hasPromptedStableRestore()) return;

    const tokenBal = getTokenBalance(walletInfo.tokenBalances, USDB_TOKEN_IDENTIFIER);
    if (tokenBal && tokenBal.balance > 0n) {
      setShouldPrompt(true);
    }
  }, [walletInfo, isStableBalanceActive]);

  const markPrompted = useCallback(() => {
    setStableRestorePrompted();
    setShouldPrompt(false);
  }, []);

  return { shouldPrompt, markPrompted };
}
