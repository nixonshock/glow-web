import React, { useState, useEffect, useRef } from 'react';
import { BottomSheetContainer, BottomSheetCard, DialogHeader, PrimaryButton } from '../../../components/ui';
import { ContactsIcon, CheckIcon } from '../../../components/Icons';
import { useContactsContext } from '../../../contexts/ContactsContext';

interface SaveContactDialogProps {
  isOpen: boolean;
  lightningAddress: string;
  onClose: () => void;
}

const SaveContactDialog: React.FC<SaveContactDialogProps> = ({ isOpen, lightningAddress, onClose }) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { addContact } = useContactsContext();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName(lightningAddress.split('@')[0] || '');
      setIsSaving(false);
      setSaved(false);
    }
  }, [isOpen, lightningAddress]);

  // Auto-focus name input when dialog opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => nameInputRef.current?.focus(), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      const result = await addContact(trimmed, lightningAddress);
      if (result) {
        setSaved(true);
        setTimeout(onClose, 2000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BottomSheetContainer isOpen={isOpen} onClose={onClose}>
      <BottomSheetCard>
        {saved ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-spark-success/15 flex items-center justify-center">
              <CheckIcon className="text-spark-success w-6 h-6" />
            </div>
            <p className="font-display font-semibold text-spark-text-primary">Contact saved</p>
          </div>
        ) : (
          <>
            <DialogHeader title="Save Contact" onClose={onClose} icon={<ContactsIcon />} />

            <div className="space-y-4">
              <p className="text-sm text-spark-text-muted text-center font-mono truncate">{lightningAddress}</p>

              <input
                ref={nameInputRef}
                id="save-contact-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) handleSave(); }}
                placeholder="Contact name"
                disabled={isSaving}
                className="w-full bg-spark-dark border border-spark-border rounded-xl px-4 py-3 text-spark-text-primary placeholder-spark-text-muted focus:border-spark-primary focus:ring-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
          </>
        )}
      </BottomSheetCard>
    </BottomSheetContainer>
  );
};

export default SaveContactDialog;
