import React, { useState } from 'react';
import { BottomSheetContainer, BottomSheetCard, DialogHeader, FormInput, PrimaryButton } from '../../../components/ui';
import { ContactsIcon } from '../../../components/Icons';
import { useContactsContext } from '../../../contexts/ContactsContext';
import { useToast } from '../../../contexts/ToastContext';

interface SaveContactDialogProps {
  isOpen: boolean;
  lightningAddress: string;
  onClose: () => void;
}

const SaveContactDialog: React.FC<SaveContactDialogProps> = ({ isOpen, lightningAddress, onClose }) => {
  const defaultName = lightningAddress.split('@')[0] || '';
  const [name, setName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);
  const { addContact } = useContactsContext();
  const { showToast } = useToast();

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      const result = await addContact(trimmed, lightningAddress);
      if (result) {
        showToast('success', 'Contact saved');
        onClose();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard>
        <DialogHeader title="Save Contact" onClose={onClose} icon={<ContactsIcon />} />

        <div className="space-y-4">
          <p className="text-sm text-spark-text-muted text-center font-mono">{lightningAddress}</p>

          <FormInput
            id="save-contact-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contact name"
            disabled={isSaving}
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 font-display font-semibold text-spark-text-secondary border border-spark-border rounded-xl hover:text-spark-text-primary hover:border-spark-border-light transition-colors"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleSave}
              disabled={!name.trim() || isSaving}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </PrimaryButton>
          </div>
        </div>
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default SaveContactDialog;
