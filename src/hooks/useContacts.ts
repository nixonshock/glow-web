import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Contact, SdkEvent } from '@breeztech/breez-sdk-spark';
import { useWallet } from '../contexts/WalletContext';
import { logger, LogCategory } from '../services/logger';
import { formatError } from '../utils/formatError';

const LN_ADDRESS_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidLightningAddress(address: string): boolean {
  return LN_ADDRESS_REGEX.test(address);
}

export function filterContacts(contacts: Contact[], query: string): Contact[] {
  if (!contacts.length || !query.trim()) return [];
  const q = query.toLowerCase();
  return contacts.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.paymentIdentifier.toLowerCase().includes(q)
  );
}

export interface UseContactsReturn {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  addContact: (name: string, paymentIdentifier: string) => Promise<Contact | null>;
  updateContact: (id: string, name: string, paymentIdentifier: string) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  findContactByAddress: (address: string) => Contact | undefined;
  refreshContacts: () => Promise<void>;
}

export function useContacts(): UseContactsReturn {
  const wallet = useWallet();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshContacts = useCallback(async () => {
    try {
      const result = await wallet.listContacts({});
      setContacts(prev => {
        if (prev.length === result.length && prev.every((c, i) =>
          c.id === result[i].id && c.name === result[i].name && c.paymentIdentifier === result[i].paymentIdentifier
        )) {
          return prev; // unchanged — keep same reference to avoid downstream re-renders
        }
        return result;
      });
      setError(null);
    } catch (e) {
      logger.error(LogCategory.SDK, 'Failed to list contacts', { error: formatError(e) });
      setError('Failed to load contacts');
    }
  }, [wallet]);

  useEffect(() => {
    setIsLoading(true);
    refreshContacts().finally(() => setIsLoading(false));
  }, [refreshContacts]);

  // Refresh contacts when SDK sync completes (contacts may not be available until first sync)
  useEffect(() => {
    let disposed = false;
    let storedListenerId: string | null = null;

    (async () => {
      try {
        const id = await wallet.addEventListener({ onEvent: (event: SdkEvent) => {
          if (event.type === 'synced') {
            void refreshContacts();
          }
        } });
        if (disposed) {
          wallet.removeEventListener(id).catch(() => { });
        } else {
          storedListenerId = id;
        }
      } catch (e) {
        logger.warn(LogCategory.SDK, 'Failed to attach contacts event listener', {
          error: e instanceof Error ? e.message : String(e),
        });
      }
    })();

    return () => {
      disposed = true;
      if (storedListenerId) {
        wallet.removeEventListener(storedListenerId).catch(() => { });
      }
    };
  }, [wallet, refreshContacts]);

  const addressMap = useMemo(() => {
    const map = new Map<string, Contact>();
    for (const c of contacts) {
      map.set(c.paymentIdentifier.toLowerCase(), c);
    }
    return map;
  }, [contacts]);

  const findContactByAddress = useCallback(
    (address: string) => addressMap.get(address.toLowerCase()),
    [addressMap],
  );

  const addContact = useCallback(async (name: string, paymentIdentifier: string): Promise<Contact | null> => {
    setError(null);
    try {
      const contact = await wallet.addContact({ name, paymentIdentifier });
      await refreshContacts();
      return contact;
    } catch (e) {
      logger.error(LogCategory.SDK, 'Failed to add contact', { error: formatError(e) });
      setError('Failed to add contact');
      return null;
    }
  }, [wallet, refreshContacts]);

  const updateContact = useCallback(async (id: string, name: string, paymentIdentifier: string): Promise<Contact | null> => {
    setError(null);
    try {
      const contact = await wallet.updateContact({ id, name, paymentIdentifier });
      await refreshContacts();
      return contact;
    } catch (e) {
      logger.error(LogCategory.SDK, 'Failed to update contact', { error: formatError(e) });
      setError('Failed to update contact');
      return null;
    }
  }, [wallet, refreshContacts]);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      await wallet.deleteContact(id);
      await refreshContacts();
      return true;
    } catch (e) {
      logger.error(LogCategory.SDK, 'Failed to delete contact', { error: formatError(e) });
      setError('Failed to delete contact');
      return false;
    }
  }, [wallet, refreshContacts]);

  return {
    contacts,
    isLoading,
    error,
    addContact,
    updateContact,
    deleteContact,
    findContactByAddress,
    refreshContacts,
  };
}
