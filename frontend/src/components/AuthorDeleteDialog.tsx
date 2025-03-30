import React from 'react';
import Button from './Button';

interface AuthorDeleteDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  authorName: string;
}

const AuthorDeleteDialog: React.FC<AuthorDeleteDialogProps> = ({
  onConfirm,
  onCancel,
  authorName,
}) => {
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="fixed inset-x-0 top-16 bottom-0 z-[60] overflow-y-auto">
        <div className="min-h-full p-4">
          <div className="w-full max-w-md mx-auto bg-card border border-border rounded-lg shadow-elevation p-6 animate-fade-in">
            <h3 className="text-lg font-medium mb-2">Delete Author</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete the author "{authorName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={onConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorDeleteDialog;