/**
 * README Component for Word Analysis Components
 * 
 * Component này chứa thông tin hướng dẫn sử dụng các component trong thư mục analysis.
 * Có thể sử dụng như một component hiển thị tài liệu trong ứng dụng.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function AnalysisComponentsReadme() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-4">Word Analysis Components</h1>
      
      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Tổng quan</h2>
        <p className="text-gray-700 mb-4">
          Đây là thư mục chứa các component cho việc hiển thị phân tích từ với cấu trúc collocations mới.
          Các component được thiết kế để tái sử dụng và có responsive design cho mobile và desktop.
        </p>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Các Component</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-blue-700">1. WordAnalysisDisplay</h3>
            <p className="text-gray-700 mb-2">
              Component chính để hiển thị chi tiết phân tích từ với tất cả các phần: meta, definitions, 
              inference_strategy, relations, và usage.
            </p>
            <div className="bg-gray-100 p-3 rounded">
              <code className="text-sm">
                {`<WordAnalysisDisplay 
  analysis={wordAnalysis} 
  onSynonymClick={handleSynonymClick}
  onAntonymClick={handleAntonymClick}
  onCollocationClick={handleCollocationClick}
/>`}
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-blue-700">2. CollocationList</h3>
            <p className="text-gray-700 mb-2">
              Component để hiển thị danh sách collocations với các trường thông tin chi tiết:
              phrase, meaning, usage_example, và frequency_level.
            </p>
            <div className="bg-gray-100 p-3 rounded">
              <code className="text-sm">
                {`<CollocationList 
  collocations={collocations} 
  onCollocationClick={handleCollocationClick}
  maxItems={5}
  showFrequencyLevel={true}
/>`}
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-blue-700">3. WordUsageSection</h3>
            <p className="text-gray-700 mb-2">
              Component để hiển thị phần usage của WordAnalysis, bao gồm collocations và ví dụ sử dụng.
            </p>
            <div className="bg-gray-100 p-3 rounded">
              <code className="text-sm">
                {`<WordUsageSection 
  usage={analysis.usage} 
  onCollocationClick={handleCollocationClick}
  maxCollocations={5}
/>`}
              </code>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-blue-700">4. SynonymAntonymList</h3>
            <p className="text-gray-700 mb-2">
              Component tái sử dụng để hiển thị danh sách từ đồng nghĩa và trái nghĩa.
            </p>
            <div className="bg-gray-100 p-3 rounded">
              <code className="text-sm">
                {`<SynonymAntonymList 
  synonyms={synonyms}
  antonyms={antonyms}
  onSynonymClick={handleSynonymClick}
  onAntonymClick={handleAntonymClick}
  maxItems={5}
/>`}
              </code>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Cấu trúc Collocation</h2>
        <p className="text-gray-700 mb-4">
          Collocation object có cấu trúc như sau:
        </p>
        <div className="bg-gray-100 p-3 rounded">
          <pre className="text-sm">
{`interface Collocation {
  phrase: string;                    // Cụm từ collocation
  meaning: string;                   // Nghĩa của collocation
  usage_example?: string;             // Ví dụ sử dụng (optional)
  frequency_level: 'common' | 'uncommon' | 'rare';  // Mức độ phổ biến
}`}
          </pre>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Frequency Level Badges</h2>
        <p className="text-gray-700 mb-4">
          Các màu sắc cho frequency level badges:
        </p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800 border-green-200">common</Badge>
            <span className="text-sm">- Màu xanh lá cây</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">uncommon</Badge>
            <span className="text-sm">- Màu vàng</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-100 text-red-800 border-red-200">rare</Badge>
            <span className="text-sm">- Màu đỏ</span>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Responsive Design</h2>
        <p className="text-gray-700 mb-4">
          Các component được thiết kế responsive với:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Mobile-first approach</li>
          <li>Grid layout thay đổi từ 1 cột (mobile) thành 2 cột (desktop)</li>
          <li>Max height cho scrollable containers</li>
          <li>Touch-friendly click targets</li>
          <li>Dark mode support</li>
        </ul>
      </Card>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-3">Ví dụ sử dụng</h2>
        <p className="text-gray-700 mb-4">
          Xem file examples.tsx để có các ví dụ chi tiết về cách sử dụng các component.
        </p>
        <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
          <p className="text-sm">
            Import: <code>import * from '@/components/analysis';</code>
          </p>
        </div>
      </Card>
    </div>
  );
}

export default AnalysisComponentsReadme;