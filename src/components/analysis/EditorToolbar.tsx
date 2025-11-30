import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/services/logger';
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
  setColor: (color: string) => void;
  unsetColor: () => void;
  setFontSize: (size: string) => void;
  unsetFontSize: () => void;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  fontSize: string | null;
  color: string | null;
}

interface TextSelection {
  text: string;
  type: 'word' | 'phrase' | 'sentence' | 'paragraph';
}

interface EditorToolbarProps {
  // Save controls
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastAnalysisResult: {
    text: string;
    type: 'word' | 'phrase' | 'sentence' | 'paragraph';
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

// Font size constants
const FONT_SIZES = [8, 10, 12, 14, 16, 18, 20, 24, 30, 36, 48];
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 72;

// Color presets
const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

// Font size dropdown component
const FontSizeDropdown = ({
  formatCommands,
  activeFormats
}: {
  formatCommands: FormatCommands;
  activeFormats: ActiveFormats;
}) => {
  const [customSize, setCustomSize] = useState('');

  const handleFontSizeChange = (value: string) => {
    const size = parseInt(value);
    if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
      formatCommands.setFontSize(`${size}px`);
      clientLogger.debug('Font size changed', { size });
    } else {
      clientLogger.warn('Font size out of range', { size, range: `${MIN_FONT_SIZE}-${MAX_FONT_SIZE}px` });
    }
  };

  const handleCustomSizeChange = (value: string) => {
    setCustomSize(value);
    if (value) {
      handleFontSizeChange(value);
    }
  };

  return (
    <Select
      value={activeFormats.fontSize || '20px'}
      onValueChange={handleFontSizeChange}
    >
      <SelectTrigger className="w-20 h-8 text-xs">
        <SelectValue placeholder="Size" />
      </SelectTrigger>
      <SelectContent>
        {FONT_SIZES.map(size => (
          <SelectItem key={size} value={`${size}px`} className="text-xs">
            {size}px
          </SelectItem>
        ))}
        <div className="px-2 py-1 border-t">
          <input
            type="number"
            min={MIN_FONT_SIZE}
            max={MAX_FONT_SIZE}
            placeholder="Custom"
            value={customSize}
            onChange={(e) => handleCustomSizeChange(e.target.value)}
            className="w-full text-xs px-2 py-1 border rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </SelectContent>
    </Select>
  );
};

// Color picker component
const ColorPickerButton = ({
  formatCommands,
  activeFormats
}: {
  formatCommands: FormatCommands;
  activeFormats: ActiveFormats;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isChangingRef = React.useRef(false);

  const handleColorSelect = (color: string) => {
    clientLogger.debug('ColorPickerButton: Selecting color', { color, currentOpenState: isOpen });
    formatCommands.setColor(color);
    clientLogger.success('ColorPickerButton: Color applied successfully', { color });
    setIsOpen(false);
  };

  const handleResetColor = () => {
    clientLogger.debug('ColorPickerButton: Resetting color', { currentOpenState: isOpen });
    formatCommands.unsetColor();
    clientLogger.success('ColorPickerButton: Color reset successfully');
    setIsOpen(false);
  };

  const handlePopoverOpenChange = (open: boolean) => {
    // Prevent rapid state changes that cause flicker
    if (isChangingRef.current) {
      clientLogger.debug('ColorPickerButton: Ignoring open change during state transition', {
        from: isOpen,
        to: open,
        trigger: 'onOpenChange callback (blocked)'
      });
      return;
    }

    clientLogger.debug('ColorPickerButton: Popover state changing', {
      from: isOpen,
      to: open,
      trigger: 'onOpenChange callback'
    });

    // No-op if same state
    if (open === isOpen) {
      clientLogger.debug('ColorPickerButton: No state change needed', { currentState: isOpen });
      return;
    }

    // Mark as changing to prevent rapid toggles
    isChangingRef.current = true;
    setIsOpen(open);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isChangingRef.current = false;
    }, 50);
  };

  return (
    <Popover open={isOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 h-8 w-8 relative"
          title="Text color"
          onMouseDown={(e) => e.preventDefault()} // Prevent focus loss like ToolBtn
        >
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{
              backgroundColor: activeFormats.color || '#000000',
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="grid grid-cols-5 gap-2 mb-3">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              onClick={(e) => {
                e.stopPropagation();
                handleColorSelect(color);
              }}
              className="w-7 h-7 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleResetColor();
          }}
          className="w-full text-xs h-7"
        >
          Reset Color
        </Button>
      </PopoverContent>
    </Popover>
  );
};

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

      {/* Font Size and Color Controls */}
      <div className="flex items-center gap-1 border-r pr-2 mr-2">
        <FontSizeDropdown formatCommands={formatCommands} activeFormats={activeFormats} />
        <ColorPickerButton formatCommands={formatCommands} activeFormats={activeFormats} />
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
      {/* <div className="flex items-center gap-1 border-r pr-2 mr-2">
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
      </div> */}

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
      </div>

      {/* Highlight Controls */}
      {/* <div className="flex items-center gap-1 border-r pr-2 mr-2">
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
      </div> */}
    </div>
  );
}

export default EditorToolbar;