import { useState, useCallback, useEffect, useMemo } from 'react';
import type { Contact } from '@breeztech/breez-sdk-spark';
import { useWallet } from '../contexts/WalletContext';
import { logger, LogCategory } from '../services/logger';
import { formatError } from '../utils/formatError';

const LN_ADDRESS_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidLightningAddress(address: string): boolean {
  return LN_ADDRESS_REGEX.test(address);
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
      setContacts(result);
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
