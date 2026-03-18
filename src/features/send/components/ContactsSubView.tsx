import React, { useState, useMemo } from 'react';
import type { Contact } from '@breeztech/breez-sdk-spark';
import { useContactsContext } from '../../../contexts/ContactsContext';
import { isValidLightningAddress } from '../../../hooks/useContacts';
import { FormInput, FormError, PrimaryButton, ConfirmDialog } from '../../../components/ui';
import { BackIcon, PlusIcon, EditPencilIcon, TrashIcon, ContactsIcon } from '../../../components/Icons';

interface ContactsSubViewProps {
  onSelect: (address: string) => void;
  onBack: () => void;
}

const ContactsSubView: React.FC<ContactsSubViewProps> = ({ onSelect, onBack }) => {
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
    if (!name) { setFormError('Name is required'); return; }
    if (!address) { setFormError('Address is required'); return; }
    if (!isValidLightningAddress(address)) { setFormError('Invalid lightning address format'); return; }

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

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-1.5 text-spark-text-muted hover:text-spark-text-primary rounded-lg hover:bg-white/5 transition-colors"
        >
          <BackIcon />
        </button>
        <h2 className="font-display text-lg font-bold text-spark-text-primary">Contacts</h2>
      </div>

      {/* Search + Add */}
      <div className="flex gap-2 mb-3">
        <div className="flex-1">
          <FormInput
            id="contacts-subview-search"
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
          <PlusIcon />
        </button>
      </div>

      {/* Add/Edit form */}
      {(showAddForm || editingContact) && (
        <div className="bg-spark-dark border border-spark-border rounded-2xl p-4 space-y-3 mb-3">
          <h3 className="font-display font-semibold text-spark-text-primary text-sm">
            {editingContact ? 'Edit Contact' : 'New Contact'}
          </h3>
          <FormInput
            id="subview-contact-name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="Name"
            disabled={isSaving}
          />
          <FormInput
            id="subview-contact-address"
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
      )}

      {/* Contact list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-spark-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredContacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6">
          <div className="w-14 h-14 rounded-2xl bg-spark-surface border border-spark-border flex items-center justify-center mb-3">
            <ContactsIcon className="w-7 h-7 text-spark-text-muted" />
          </div>
          <h3 className="text-base font-semibold text-spark-text-primary mb-1">
            {searchQuery ? 'No matches' : 'No contacts yet'}
          </h3>
          <p className="text-spark-text-muted text-sm text-center max-w-xs">
            {searchQuery ? 'Try a different search term.' : 'Add contacts to quickly send payments.'}
          </p>
        </div>
      ) : (
        <div className="space-y-0.5 max-h-[340px] overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div
              key={contact.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-spark-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-spark-primary font-display font-bold text-sm">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Info - tap to select */}
              <button
                className="flex-1 min-w-0 text-left"
                onClick={() => onSelect(contact.paymentIdentifier)}
              >
                <p className="text-[15px] font-medium text-spark-text-primary truncate">
                  {contact.name}
                </p>
                <p className="text-xs text-spark-text-muted truncate">
                  {contact.paymentIdentifier}
                </p>
              </button>

              {/* Actions */}
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={() => handleStartEdit(contact)}
                  className="p-1.5 text-spark-text-muted hover:text-spark-text-primary rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Edit contact"
                >
                  <EditPencilIcon />
                </button>
                <button
                  onClick={() => setDeletingContact(contact)}
                  className="p-1.5 text-spark-text-muted hover:text-spark-error rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Delete contact"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
};

export default ContactsSubView;
