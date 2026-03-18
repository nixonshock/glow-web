import React, { useMemo } from 'react';
import { useContactsContext } from '../../../contexts/ContactsContext';

interface ContactAutocompleteProps {
  query: string;
  isVisible: boolean;
  isLoading: boolean;
  onSelect: (paymentIdentifier: string) => void;
}

const ContactAutocomplete: React.FC<ContactAutocompleteProps> = ({ query, isVisible, isLoading, onSelect }) => {
  const { contacts } = useContactsContext();

  const filtered = useMemo(() => {
    if (!contacts.length || !query.trim()) return [];
    const q = query.toLowerCase();
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.paymentIdentifier.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  if (!isVisible || !filtered.length || isLoading) return null;

  return (
    <div
      className="absolute left-0 right-0 top-full mt-1 z-10 bg-spark-surface border border-spark-border rounded-xl shadow-lg overflow-y-auto max-h-[192px]"
      onMouseDown={(e) => e.preventDefault()}
    >
      {filtered.map((contact) => (
        <button
          key={contact.id}
          onClick={() => onSelect(contact.paymentIdentifier)}
          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-spark-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-spark-primary font-display font-bold text-xs">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-spark-text-primary truncate">
              {contact.name}
            </p>
            <p className="text-xs text-spark-text-muted truncate">
              {contact.paymentIdentifier}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ContactAutocomplete;
