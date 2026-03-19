import React, { createContext, useContext } from 'react';
import { useContacts, UseContactsReturn } from '../hooks/useContacts';

const ContactsContext = createContext<UseContactsReturn | null>(null);

export const ContactsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const contacts = useContacts();
  return (
    <ContactsContext.Provider value={contacts}>
      {children}
    </ContactsContext.Provider>
  );
};

export const useContactsContext = (): UseContactsReturn => {
  const ctx = useContext(ContactsContext);
  if (!ctx) {
    throw new Error('useContactsContext must be used within a ContactsProvider');
  }
  return ctx;
};
