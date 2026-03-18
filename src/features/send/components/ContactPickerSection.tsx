import React, { useMemo } from 'react';
import type { Contact } from '@breeztech/breez-sdk-spark';
import { useContactsContext } from '../../../contexts/ContactsContext';

interface ContactPickerSectionProps {
  query: string;
  onSelect: (contact: Contact) => void;
  isLoading: boolean;
}

const ContactPickerSection: React.FC<ContactPickerSectionProps> = ({ query, onSelect, isLoading }) => {
  const { contacts } = useContactsContext();

  const filtered = useMemo(() => {
    if (!contacts.length || !query.trim()) return [];
    const q = query.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.paymentIdentifier.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  if (!contacts.length) return null;

  // Fixed-height row: always rendered to prevent layout shift, chips appear/disappear inside
  return (
    <div className="h-9 overflow-x-auto overflow-y-hidden flex items-center gap-2 scrollbar-hidden">
      {filtered.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onSelect(contact)}
          disabled={isLoading}
          className="flex-shrink-0 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full bg-spark-primary/10 border border-spark-primary/20 hover:bg-spark-primary/20 transition-colors text-left disabled:opacity-50"
        >
          <div className="w-6 h-6 rounded-full bg-spark-primary/20 flex items-center justify-center">
            <span className="text-spark-primary font-display font-bold text-[10px]">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-sm font-medium text-spark-text-primary whitespace-nowrap">
            {contact.name}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ContactPickerSection;
