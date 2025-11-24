const { generateHTML } = require('@tiptap/html/server');
const StarterKit = require('@tiptap/starter-kit').default;
const Underline = require('@tiptap/extension-underline').default;
const { TextStyle } = require('@tiptap/extension-text-style');
const Color = require('@tiptap/extension-color').default;
const Highlight = require('@tiptap/extension-highlight').default;
const TextAlign = require('@tiptap/extension-text-align').default;
const Link = require('@tiptap/extension-link').default;

// Test data from the original log
const testData = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          marks: [
            { type: 'strike' },
            { type: 'underline' }
          ],
          text: 'Phân tích chi tiết từ, câu và đoạn văn bằng AI'
        }
      ]
    }
  ]
};

console.log('🔍 [TEST] Input TipTap JSON:', JSON.stringify(testData, null, 2));

try {
  // Use the same configuration as our API
  const html = generateHTML(testData, [
    StarterKit,
    Underline,
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Link.configure({ openOnClick: false }),
  ]);
  
  console.log('✅ [TEST] Generated HTML:', html);
  
  // Check if the HTML contains the expected tags
  const hasStrike = html.includes('<s>') || html.includes('<s ');
  const hasUnderline = html.includes('<u>') || html.includes('<u ');
  
  console.log('✅ [TEST] Has strikethrough:', hasStrike);
  console.log('✅ [TEST] Has underline:', hasUnderline);
  
  if (hasStrike && hasUnderline) {
    console.log('🎉 [TEST] SUCCESS: Both strikethrough and underline are preserved!');
  } else {
    console.log('❌ [TEST] FAILED: Missing formatting tags');
  }
  
} catch (error) {
  console.error('❌ [TEST] ERROR:', error);
}