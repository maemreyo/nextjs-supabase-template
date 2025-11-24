import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { useCallback, useEffect, useState } from 'react';

interface UseTipTapEditorProps {
  initialContent?: string;
  placeholder?: string;
  maxLength?: number;
  editable?: boolean;
  onUpdate?: (content: { html: string; json: any; text: string }) => void;
  onSelectionUpdate?: (selection: { text: string; from: number; to: number }) => void;
}

interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
}

export function useTipTapEditor({
  initialContent = '',
  placeholder = 'Start typing...',
  maxLength = 10000,
  editable = true,
  onUpdate,
  onSelectionUpdate,
}: UseTipTapEditorProps) {
  const [textStats, setTextStats] = useState<TextStats>({
    characters: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0
  });

  const updateTextStats = useCallback((text: string) => {
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    setTextStats({
      characters: text.length,
      words: words.length,
      sentences: sentences.length,
      paragraphs: Math.max(1, paragraphs.length)
    });
  }, []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable default extensions that we're adding separately
        strike: false, // We'll use the one from StarterKit
        // Underline is not in StarterKit by default, so we can add it separately
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
    ],
    content: initialContent,
    editable,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const json = editor.getJSON();
      const text = editor.getText();
      
      updateTextStats(text);
      
      if (onUpdate) {
        onUpdate({ html, json, text });
      }
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const text = editor.state.doc.textBetween(from, to, ' ');
      
      if (onSelectionUpdate) {
        onSelectionUpdate({ text, from, to });
      }
    },
    onTransaction: ({ transaction }) => {
      // Update text stats on transaction
      if (transaction.docChanged) {
        const text = transaction.doc.textContent;
        updateTextStats(text);
      }
    },
  });

  // Update content when initialContent changes
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML()) {
      editor.commands.setContent(initialContent, { emitUpdate: false });
    }
  }, [initialContent, editor]);

  // Update editable state
  useEffect(() => {
    if (editor && editable !== editor.isEditable) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  // Format commands
  const formatCommands = {
    bold: () => editor?.chain().focus().toggleBold().run(),
    italic: () => editor?.chain().focus().toggleItalic().run(),
    underline: () => editor?.chain().focus().toggleUnderline().run(),
    strike: () => editor?.chain().focus().toggleStrike().run(),
    heading: (level: 1 | 2 | 3) => editor?.chain().focus().toggleHeading({ level }).run(),
    bulletList: () => editor?.chain().focus().toggleBulletList().run(),
    orderedList: () => editor?.chain().focus().toggleOrderedList().run(),
    blockquote: () => editor?.chain().focus().toggleBlockquote().run(),
    code: () => editor?.chain().focus().toggleCode().run(),
    codeBlock: () => editor?.chain().focus().toggleCodeBlock().run(),
    horizontalRule: () => editor?.chain().focus().setHorizontalRule().run(),
    textAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => 
      editor?.chain().focus().setTextAlign(alignment).run(),
    setColor: (color: string) => editor?.chain().focus().setColor(color).run(),
    setHighlight: (color: string) => editor?.chain().focus().setHighlight({ color }).run(),
    unsetHighlight: () => editor?.chain().focus().unsetHighlight().run(),
    setLink: (href: string) => editor?.chain().focus().setLink({ href }).run(),
    unsetLink: () => editor?.chain().focus().unsetLink().run(),
    undo: () => editor?.chain().focus().undo().run(),
    redo: () => editor?.chain().focus().redo().run(),
    clearFormat: () => editor?.chain().focus().clearNodes().unsetAllMarks().run(),
  };

  // Active format states
  const activeFormats = {
    bold: editor?.isActive('bold') || false,
    italic: editor?.isActive('italic') || false,
    underline: editor?.isActive('underline') || false,
    strike: editor?.isActive('strike') || false,
    code: editor?.isActive('code') || false,
    heading: {
      1: editor?.isActive('heading', { level: 1 }) || false,
      2: editor?.isActive('heading', { level: 2 }) || false,
      3: editor?.isActive('heading', { level: 3 }) || false,
    },
    bulletList: editor?.isActive('bulletList') || false,
    orderedList: editor?.isActive('orderedList') || false,
    blockquote: editor?.isActive('blockquote') || false,
    codeBlock: editor?.isActive('codeBlock') || false,
    textAlign: editor?.getAttributes('paragraph')?.textAlign || 'left',
  };

  // Content getters
  const getContent = {
    html: editor?.getHTML() || '',
    json: editor?.getJSON() || null,
    text: editor?.getText() || '',
    // markdown: editor?.storage.markdown?.getMarkdown() || '', // Commented out as markdown extension is not included
  };

  // Content setters
  const setContent = (content: string, emitUpdate = true) => {
    editor?.commands.setContent(content, { emitUpdate });
  };

  // Selection helpers
  const getSelection = () => {
    if (!editor) return { text: '', from: 0, to: 0, empty: true };
    
    const { from, to, empty } = editor.state.selection;
    const text = editor.state.doc.textBetween(from, to, ' ');
    
    return { text, from, to, empty };
  };

  const selectAll = () => {
    editor?.commands.selectAll();
  };

  const insertText = (text: string) => {
    editor?.chain().focus().insertContent(text).run();
  };

  const insertHTML = (html: string) => {
    editor?.chain().focus().insertContent(html).run();
  };

  return {
    editor,
    EditorContent,
    formatCommands,
    activeFormats,
    getContent,
    setContent,
    getSelection,
    selectAll,
    insertText,
    insertHTML,
    textStats,
    isEditable: editor?.isEditable || false,
    characterCount: editor?.storage.characterCount.characters() || 0,
  };
}

export default useTipTapEditor;