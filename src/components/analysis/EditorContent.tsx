import React from 'react';
import { EditorContent as TipTapEditorContent } from '@tiptap/react';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/react';

interface EditorContentProps {
  editor: Editor | null;
  className?: string;
}

export function EditorContent({ editor, className }: EditorContentProps) {
  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <TipTapEditorContent
          editor={editor}
          className={cn(
            // "min-h-96 p-6 bg-background rounded border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 prose max-w-none",
            "min-h-96 p-6 prose max-w-none focus-visible:none",
            className
          )}
        />
      </div>
    </div>
  );
}

export default EditorContent;