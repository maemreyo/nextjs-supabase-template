import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  FolderOpen,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  Code,
  Loader2,
  MousePointer,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Editor } from '@tiptap/react';

interface FormatCommands {
  bold: () => void;
  italic: () => void;
  underline: () => void;
  strike: () => void;
  bulletList: () => void;
  orderedList: () => void;
  blockquote: () => void;
  horizontalRule: () => void;
  undo: () => void;
  redo: () => void;
  clearFormat: () => void;
  setHighlight: (color: string) => void;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
}

interface TextSelection {
  text: string;
  type: 'word' | 'sentence' | 'paragraph';
}

interface EditorToolbarProps {
  // Save controls
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastAnalysisResult: {
    text: string;
    type: 'word' | 'sentence' | 'paragraph';
    data: any;
  } | null;
  sessionId?: string;
  onSave: () => void;
  onSessionActions: () => void;
  
  // Editor formatting
  formatCommands: FormatCommands;
  activeFormats: ActiveFormats;
  
  // Selection controls
  selection: TextSelection;
  expandToWord: () => void;
  expandToSentence: () => void;
  expandToParagraph: () => void;
  
  // Highlight controls
  highlightColors: string[];
  onHighlight: (color: string) => void;
  
  className?: string;
}

// Internal toolbar button component
const ToolBtn = ({ 
  onClick, 
  active, 
  disabled, 
  children, 
  title 
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
}) => (
  <Button
    variant="ghost"
    size="sm"
    onMouseDown={(e) => e.preventDefault()} // Prevent focus loss
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn("p-2 h-8 w-8", active && "bg-muted", disabled && "opacity-40")}
  >
    {children}
  </Button>
);

export function EditorToolbar({
  isSaving,
  hasUnsavedChanges,
  lastAnalysisResult,
  sessionId,
  onSave,
  onSessionActions,
  formatCommands,
  activeFormats,
  selection,
  expandToWord,
  expandToSentence,
  expandToParagraph,
  highlightColors,
  onHighlight,
  className
}: EditorToolbarProps) {
  return (
    <div className={cn("border-b p-2 flex items-center gap-1 flex-wrap", className)}>
      {/* Save Controls Section */}
      <div className="flex items-center gap-2 border-r pr-2 mr-2">
        <Button
          variant="outline"
          size="sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onSave}
          disabled={isSaving || (!lastAnalysisResult && !selection.text)}
          className="h-7 px-2"
          title={sessionId ? "Lưu kết quả phân tích vào session (Ctrl+S)" : "Lưu kết quả phân tích (Ctrl+S)"}
        >
          {isSaving ? (
            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Đang lưu...</>
          ) : (
            <><Save className="h-3 w-3 mr-1" />Lưu</>
          )}
        </Button>

        {/* Session Management Dropdown */}
        {sessionId && (
          <Button
            variant="outline"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onSessionActions}
            className="h-7 px-2"
            title="Quản lý session"
          >
            <FolderOpen className="h-3 w-3 mr-1" />
            Session
          </Button>
        )}
      </div>

      {/* Text Formatting Controls */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
        <ToolBtn onClick={() => formatCommands.bold()} active={activeFormats.bold} title="Bold">
          <Bold size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.italic()} active={activeFormats.italic} title="Italic">
          <Italic size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.underline()} active={activeFormats.underline} title="Underline">
          <Underline size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.strike()} active={activeFormats.strike} title="Strike">
          <Strikethrough size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.clearFormat()} title="Clear">
          <Code size={16} />
        </ToolBtn>
      </div>

      {/* List and Structure Controls */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
        <ToolBtn onClick={() => formatCommands.bulletList()} title="Bullet list">
          <List size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.orderedList()} title="Ordered list">
          <ListOrdered size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.blockquote()} title="Quote">
          <Quote size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.horizontalRule()} title="Horizontal rule">
          <Minus size={16} />
        </ToolBtn>
      </div>

      {/* History Controls */}
      <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
        <ToolBtn onClick={() => formatCommands.undo()} title="Undo">
          <Undo size={16} />
        </ToolBtn>
        <ToolBtn onClick={() => formatCommands.redo()} title="Redo">
          <Redo size={16} />
        </ToolBtn>
      </div>

      {/* Selection Expansion Controls */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <Button 
          variant="outline" 
          size="sm" 
          onMouseDown={(e) => e.preventDefault()} 
          onClick={expandToWord} 
          className="text-xs px-2 py-1 h-7"
        >
          Word
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onMouseDown={(e) => e.preventDefault()} 
          onClick={expandToSentence} 
          className="text-xs px-2 py-1 h-7"
        >
          Sentence
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onMouseDown={(e) => e.preventDefault()} 
          onClick={expandToParagraph} 
          className="text-xs px-2 py-1 h-7"
        >
          Paragraph
        </Button>
      </div>

      {/* Highlight Controls */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        {highlightColors.map(color => (
          <button
            key={color}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onHighlight(color)}
            className="w-5 h-5 rounded border border-gray-300 hover:scale-110 transition-transform"
            style={{ backgroundColor: color }}
            title={`Highlight with ${color}`}
          />
        ))}
      </div>

      {/* Selection Info */}
      <div className="ml-auto flex items-center gap-2">
        {selection.text && (
          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">
            <MousePointer className="h-3 w-3 mr-1" />
            Đã chọn: {selection.text.length} ký tự
          </Badge>
        )}
      </div>
    </div>
  );
}

export default EditorToolbar;