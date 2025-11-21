import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, Type, FileText, AlignLeft, Bold, Italic, Underline, List, ListOrdered, Quote, Highlighter, MessageSquare, Volume2, BookMarked, Strikethrough, Code, Undo, Redo, Minus } from 'lucide-react';

// ============================================
// PLACEHOLDER CALLBACKS - Replace with your implementations
// ============================================
const callbacks = {
  analyzeWord: (word) => {
    console.log('Analyzing word:', word);
    return { word, type: 'word', definition: 'Definition placeholder', pronunciation: '/.../', examples: ['Example 1', 'Example 2'] };
  },
  analyzePhrase: (phrase) => {
    console.log('Analyzing phrase:', phrase);
    return { phrase, type: 'phrase', meaning: 'Phrase meaning placeholder', usage: 'Common usage', examples: ['Example phrase usage'] };
  },
  analyzeSentence: (sentence) => {
    console.log('Analyzing sentence:', sentence);
    return { sentence, type: 'sentence', grammar: 'Grammar analysis', structure: 'S + V + O', translation: 'Translation placeholder' };
  },
  analyzeParagraph: (paragraph) => {
    console.log('Analyzing paragraph:', paragraph);
    return { paragraph, type: 'paragraph', mainIdea: 'Main idea', summary: 'Summary', keyPoints: ['Point 1', 'Point 2'] };
  },
  pronounce: (text) => console.log('Pronouncing:', text),
  translate: (text) => { console.log('Translating:', text); return 'Translation placeholder'; },
  addToVocabulary: (text, type) => console.log('Adding to vocabulary:', text, type),
  highlightText: (text, color) => console.log('Highlighting:', text, color),
  onContentChange: (html) => console.log('Content changed:', html),
};

const EnglishLearningEditor = () => {
  const [selectedText, setSelectedText] = useState('');
  const [selectionType, setSelectionType] = useState('');
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, show: false });
  const [analysisPanel, setAnalysisPanel] = useState({ show: false, data: null });
  const [activeFormats, setActiveFormats] = useState({});
  const editorRef = useRef(null);

  const detectSelectionType = (text) => {
    const trimmed = text.trim();
    const wordCount = trimmed.split(/\s+/).length;
    const sentenceCount = (trimmed.match(/[.!?]+/g) || []).length;
    const hasNewlines = /\n\n/.test(trimmed);
    if (hasNewlines || sentenceCount > 2) return 'paragraph';
    if (sentenceCount >= 1) return 'sentence';
    if (wordCount > 1) return 'phrase';
    return 'word';
  };

  const expandToWord = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    let start = range.startOffset, end = range.endOffset;
    while (start > 0 && /\w/.test(text[start - 1])) start--;
    while (end < text.length && /\w/.test(text[end])) end++;
    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, end);
    sel.removeAllRanges();
    sel.addRange(range);
    handleTextSelection();
  };

  const expandToSentence = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    const text = range.startContainer.textContent || '';
    let start = range.startOffset, end = range.endOffset;
    while (start > 0 && !/[.!?]/.test(text[start - 1])) start--;
    while (end < text.length && !/[.!?]/.test(text[end])) end++;
    if (end < text.length) end++;
    range.setStart(range.startContainer, start);
    range.setEnd(range.startContainer, Math.min(end, text.length));
    sel.removeAllRanges();
    sel.addRange(range);
    handleTextSelection();
  };

  const expandToParagraph = () => {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    let node = sel.anchorNode;
    while (node && node.nodeName !== 'P' && node.parentNode) node = node.parentNode;
    if (node && (node.nodeName === 'P' || node.nodeName === 'DIV')) {
      const range = document.createRange();
      range.selectNodeContents(node);
      sel.removeAllRanges();
      sel.addRange(range);
      handleTextSelection();
    }
  };

  const handleTextSelection = () => {
    const sel = window.getSelection();
    const text = sel.toString().trim();
    if (text.length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectionType(detectSelectionType(text));
      setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top - 10, show: true });
    } else {
      setMenuPosition({ x: 0, y: 0, show: false });
    }
  };

  const handleAnalyze = () => {
    let data;
    switch (selectionType) {
      case 'word': data = callbacks.analyzeWord(selectedText); break;
      case 'phrase': data = callbacks.analyzePhrase(selectedText); break;
      case 'sentence': data = callbacks.analyzeSentence(selectedText); break;
      case 'paragraph': data = callbacks.analyzeParagraph(selectedText); break;
      default: data = null;
    }
    setAnalysisPanel({ show: true, data });
    setMenuPosition({ ...menuPosition, show: false });
  };

  const formatText = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
    updateActiveFormats();
  };

  const updateActiveFormats = () => {
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    });
  };

  const handleHighlight = (color) => {
    document.execCommand('hiliteColor', false, color);
    callbacks.highlightText(selectedText, color);
    setMenuPosition({ ...menuPosition, show: false });
  };

  useEffect(() => {
    const onMouseUp = () => setTimeout(handleTextSelection, 10);
    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, []);

  const ToolBtn = ({ onClick, active, disabled, children, title }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${active ? 'bg-gray-200' : 'hover:bg-gray-100'} ${disabled ? 'opacity-40' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-2 flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('bold')} active={activeFormats.bold} title="Bold"><Bold size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('italic')} active={activeFormats.italic} title="Italic"><Italic size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('underline')} active={activeFormats.underline} title="Underline"><Underline size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('strikeThrough')} active={activeFormats.strikeThrough} title="Strike"><Strikethrough size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('removeFormat')} title="Clear"><Code size={16} /></ToolBtn>
          </div>

          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('insertUnorderedList')} title="Bullet list"><List size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('insertOrderedList')} title="Ordered list"><ListOrdered size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('formatBlock', 'blockquote')} title="Quote"><Quote size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('insertHorizontalRule')} title="Horizontal rule"><Minus size={16} /></ToolBtn>
          </div>

          <div className="flex items-center gap-0.5 border-r pr-2 mr-2">
            <ToolBtn onClick={() => formatText('undo')} title="Undo"><Undo size={16} /></ToolBtn>
            <ToolBtn onClick={() => formatText('redo')} title="Redo"><Redo size={16} /></ToolBtn>
          </div>

          <div className="flex items-center gap-1 border-r pr-2 mr-2">
            <button onClick={expandToWord} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Word</button>
            <button onClick={expandToSentence} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Sentence</button>
            <button onClick={expandToParagraph} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">Paragraph</button>
          </div>

          <div className="flex items-center gap-1">
            {['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff'].map(c => (
              <button key={c} onClick={() => handleHighlight(c)} className="w-5 h-5 rounded border border-gray-300" style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 text-sm text-gray-500">
            <BookOpen size={14} />
            <span>English Learning Editor</span>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-3xl mx-auto">
            <div
              ref={editorRef}
              contentEditable
              className="min-h-96 p-6 bg-white rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 prose max-w-none"
              onInput={(e) => callbacks.onContentChange(e.currentTarget.innerHTML)}
              onKeyUp={updateActiveFormats}
              onClick={updateActiveFormats}
              suppressContentEditableWarning
            >
              <h2>Welcome to the English Learning Editor</h2>
              <p>This editor helps you learn English by analyzing words, phrases, sentences, and paragraphs.</p>
              <p><strong>How to use:</strong></p>
              <ul>
                <li>Select a <em>word</em> → definitions, pronunciation, examples</li>
                <li>Select a <em>phrase</em> → idioms, collocations</li>
                <li>Select a <em>sentence</em> → grammar, structure analysis</li>
                <li>Select a <em>paragraph</em> → main idea, summary</li>
              </ul>
              <p>Try selecting any text to see the analysis menu!</p>
              <blockquote>Learning English requires consistent practice and exposure to various texts.</blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Bubble Menu */}
      {menuPosition.show && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-1 z-50"
          style={{ left: menuPosition.x, top: menuPosition.y, transform: 'translate(-50%, -100%)' }}
        >
          <span className="text-xs text-gray-500 px-2 border-r">{selectionType}</span>
          <button onClick={handleAnalyze} className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 flex items-center gap-1">
            <BookMarked size={12} /> Analyze
          </button>
          <button onClick={() => callbacks.pronounce(selectedText)} className="p-1.5 hover:bg-gray-100 rounded" title="Pronounce"><Volume2 size={14} /></button>
          <button onClick={() => callbacks.addToVocabulary(selectedText, selectionType)} className="p-1.5 hover:bg-gray-100 rounded" title="Save"><BookOpen size={14} /></button>
          <button onClick={() => handleHighlight('#fef08a')} className="p-1.5 hover:bg-gray-100 rounded" title="Highlight"><Highlighter size={14} /></button>
        </div>
      )}

      {/* Analysis Panel */}
      {analysisPanel.show && analysisPanel.data && (
        <div className="w-80 bg-white border-l border-gray-200 overflow-auto">
          <div className="sticky top-0 bg-white border-b p-3 flex items-center justify-between">
            <h3 className="font-medium flex items-center gap-2"><MessageSquare size={16} className="text-blue-500" />Analysis</h3>
            <button onClick={() => setAnalysisPanel({ show: false, data: null })} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>
          <div className="p-4 text-sm">
            <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mb-2">{analysisPanel.data.type}</span>
            <div className="p-2 bg-gray-50 rounded border mb-4 font-medium">{analysisPanel.data[analysisPanel.data.type]}</div>

            {analysisPanel.data.type === 'word' && (
              <>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Pronunciation</h4><span className="text-blue-600">{analysisPanel.data.pronunciation}</span></div>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Definition</h4><p className="text-gray-700">{analysisPanel.data.definition}</p></div>
                <div><h4 className="text-xs text-gray-500 mb-1">Examples</h4>{analysisPanel.data.examples.map((e,i) => <p key={i} className="text-gray-600">• {e}</p>)}</div>
              </>
            )}
            {analysisPanel.data.type === 'phrase' && (
              <>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Meaning</h4><p className="text-gray-700">{analysisPanel.data.meaning}</p></div>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Usage</h4><p className="text-gray-700">{analysisPanel.data.usage}</p></div>
                <div><h4 className="text-xs text-gray-500 mb-1">Examples</h4>{analysisPanel.data.examples.map((e,i) => <p key={i} className="text-gray-600">• {e}</p>)}</div>
              </>
            )}
            {analysisPanel.data.type === 'sentence' && (
              <>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Grammar</h4><p className="text-gray-700">{analysisPanel.data.grammar}</p></div>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Structure</h4><p className="text-gray-700">{analysisPanel.data.structure}</p></div>
                <div><h4 className="text-xs text-gray-500 mb-1">Translation</h4><p className="text-gray-700">{analysisPanel.data.translation}</p></div>
              </>
            )}
            {analysisPanel.data.type === 'paragraph' && (
              <>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Main Idea</h4><p className="text-gray-700">{analysisPanel.data.mainIdea}</p></div>
                <div className="mb-3"><h4 className="text-xs text-gray-500 mb-1">Summary</h4><p className="text-gray-700">{analysisPanel.data.summary}</p></div>
                <div><h4 className="text-xs text-gray-500 mb-1">Key Points</h4>{analysisPanel.data.keyPoints.map((p,i) => <p key={i} className="text-gray-600">• {p}</p>)}</div>
              </>
            )}

            <button onClick={() => callbacks.addToVocabulary(selectedText, selectionType)} className="mt-4 w-full py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm flex items-center justify-center gap-2">
              <BookOpen size={14} /> Add to Vocabulary
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnglishLearningEditor;