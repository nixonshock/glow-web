import React, { useState } from 'react';
import { FormInput } from '../../../components/ui';

interface SaveContactPromptProps {
  lightningAddress: string;
  onSaved: (name: string) => Promise<void>;
  onDismiss: () => void;
}

const SaveContactPrompt: React.FC<SaveContactPromptProps> = ({ lightningAddress, onSaved, onDismiss }) => {
  const defaultName = lightningAddress.split('@')[0] || '';
  const [name, setName] = useState(defaultName);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSaving(true);
    try {
      await onSaved(trimmed);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4 bg-spark-dark/50 border border-spark-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-spark-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-medium text-spark-text-primary">Save to contacts?</span>
      </div>
      <p className="text-xs text-spark-text-muted">{lightningAddress}</p>
      <FormInput
        id="save-contact-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Contact name"
        disabled={isSaving}
      />
      <div className="flex gap-2">
        <button
          onClick={onDismiss}
          className="flex-1 py-2 text-sm font-medium text-spark-text-secondary hover:text-spark-text-primary transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim() || isSaving}
          className="flex-1 py-2 text-sm font-medium bg-spark-primary text-white rounded-xl hover:bg-spark-primary-light transition-colors disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
};

export default SaveContactPrompt;
