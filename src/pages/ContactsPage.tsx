import React, { useState, useMemo } from 'react';
import type { Contact } from '@breeztech/breez-sdk-spark';
import SlideInPage from '../components/layout/SlideInPage';
import { useContactsContext } from '../contexts/ContactsContext';
import { isValidLightningAddress } from '../hooks/useContacts';
import { FormInput, FormError, PrimaryButton, ConfirmDialog } from '../components/ui';

interface ContactsPageProps {
  onBack: () => void;
  onSendToContact: (address: string) => void;
}

const ContactsPage: React.FC<ContactsPageProps> = ({ onBack, onSendToContact }) => {
  const { contacts, isLoading, addContact, updateContact, deleteContact } = useContactsContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [formName, setFormName] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const filteredContacts = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const filtered = query
      ? contacts.filter(c =>
          c.name.toLowerCase().includes(query) ||
          c.paymentIdentifier.toLowerCase().includes(query)
        )
      : [...contacts];
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [contacts, searchQuery]);

  const resetForm = () => {
    setFormName('');
    setFormAddress('');
    setFormError(null);
    setShowAddForm(false);
    setEditingContact(null);
  };

  const handleStartEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormName(contact.name);
    setFormAddress(contact.paymentIdentifier);
    setFormError(null);
    setShowAddForm(false);
  };

  const handleStartAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleSave = async () => {
    const name = formName.trim();
    const address = formAddress.trim();
    if (!name) {
      setFormError('Name is required');
      return;
    }
    if (!address) {
      setFormError('Address is required');
      return;
    }
    if (!isValidLightningAddress(address)) {
      setFormError('Invalid lightning address format');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    if (editingContact) {
      const result = await updateContact(editingContact.id, name, address);
      if (result) resetForm();
      else setFormError('Failed to update contact');
    } else {
      const result = await addContact(name, address);
      if (result) resetForm();
      else setFormError('Failed to add contact');
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingContact) return;
    await deleteContact(deletingContact.id);
    setDeletingContact(null);
  };

  const renderForm = () => (
    <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-3">
      <h3 className="font-display font-semibold text-spark-text-primary text-sm">
        {editingContact ? 'Edit Contact' : 'New Contact'}
      </h3>
      <FormInput
        id="contact-name"
        value={formName}
        onChange={(e) => setFormName(e.target.value)}
        placeholder="Name"
        disabled={isSaving}
      />
      <FormInput
        id="contact-address"
        value={formAddress}
        onChange={(e) => setFormAddress(e.target.value)}
        placeholder="user@domain.com"
        disabled={isSaving}
      />
      <FormError error={formError} />
      <div className="flex gap-2">
        <button
          onClick={resetForm}
          className="flex-1 py-2.5 text-sm font-medium border border-spark-border text-spark-text-secondary rounded-xl hover:text-spark-text-primary transition-colors"
        >
          Cancel
        </button>
        <PrimaryButton onClick={handleSave} disabled={isSaving} className="flex-1">
          {isSaving ? 'Saving...' : 'Save'}
        </PrimaryButton>
      </div>
    </div>
  );

  const renderContactRow = (contact: Contact) => (
    <div
      key={contact.id}
      className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors"
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-spark-primary/15 flex items-center justify-center flex-shrink-0">
        <span className="text-spark-primary font-display font-bold text-sm">
          {contact.name.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Info - tap to send */}
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => onSendToContact(contact.paymentIdentifier)}
      >
        <p className="text-[15px] font-medium text-spark-text-primary truncate">
          {contact.name}
        </p>
        <p className="text-xs text-spark-text-muted truncate">
          {contact.paymentIdentifier}
        </p>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => handleStartEdit(contact)}
          className="p-2 text-spark-text-muted hover:text-spark-text-primary rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Edit contact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => setDeletingContact(contact)}
          className="p-2 text-spark-text-muted hover:text-spark-error rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Delete contact"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <SlideInPage title="Contacts" onClose={onBack} slideFrom="left">
      <div className="p-4 space-y-4">
        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="flex-1">
            <FormInput
              id="contact-search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
            />
          </div>
          <button
            onClick={handleStartAdd}
            className="px-3 bg-spark-primary text-white rounded-xl hover:bg-spark-primary-light transition-colors flex items-center justify-center"
            aria-label="Add contact"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Add/Edit form */}
        {(showAddForm || editingContact) && renderForm()}

        {/* Contact list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-spark-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-16 h-16 rounded-2xl bg-spark-surface border border-spark-border flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-spark-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-spark-text-primary mb-1">
              {searchQuery ? 'No matches' : 'No contacts yet'}
            </h3>
            <p className="text-spark-text-muted text-sm text-center max-w-xs">
              {searchQuery
                ? 'Try a different search term.'
                : 'Add contacts to quickly send payments to your favorite people.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredContacts.map(renderContactRow)}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deletingContact}
        title="Delete Contact"
        message={`Are you sure you want to delete "${deletingContact?.name}"?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeletingContact(null)}
      />
    </SlideInPage>
  );
};

export default ContactsPage;
