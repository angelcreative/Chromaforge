import React from 'react';
import { BaseCard, ThemeColors } from '../BaseComponents';
import { Button } from '../Molecules';
import { Upload, HelpCircle } from 'lucide-react';

export default function UploadCard({ theme }: { theme: ThemeColors }) {
  return (
    <BaseCard theme={theme} className="p-6">
      <h2 className="text-xl font-bold mb-2" style={{ color: theme.text.main }}>Upload file</h2>
      <p className="text-sm mb-6" style={{ color: theme.text.secondary }}>Click to upload or drag and drop</p>

      <div
        className="border-2 border-dashed rounded-xl p-12 mb-4 text-center cursor-pointer transition-colors"
        style={{
          borderColor: theme.border.subtle,
          backgroundColor: theme.bg.input,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = theme.action.primary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border.subtle;
        }}
      >
        <Upload size={48} className="mx-auto mb-4" style={{ color: theme.text.tertiary }} strokeWidth={1.5}/>
        <p className="text-sm" style={{ color: theme.text.secondary }}>No Files Selected</p>
      </div>

      <div className="mb-6">
        <p className="text-xs" style={{ color: theme.text.tertiary }}>
          Supported formats: JPEG, JPG, PNG, ...
          <span className="ml-2">Max file size: 5MB</span>
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Button theme={theme} variant="tertiary" icon={<HelpCircle size={16} strokeWidth={1.5}/>}>
          Support
        </Button>
        <div className="flex gap-3">
          <Button theme={theme} variant="secondary">Cancel</Button>
          <Button theme={theme}>Save</Button>
        </div>
      </div>
    </BaseCard>
  );
}
