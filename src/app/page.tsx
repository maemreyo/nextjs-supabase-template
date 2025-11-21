'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  FileText,
  FilePlus,
  Sparkles,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AI Semantic Analysis</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                  <LogIn className="h-4 w-4" />
                  <span>Đăng nhập</span>
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm" className="flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Đăng ký</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
            🚀 Powered by Advanced AI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Phân tích Ngữ nghĩa với
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {' '}AI
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Công cụ phân tích thông minh giúp bạn hiểu sâu sắc về từ vựng, cấu trúc câu và đoạn văn. 
            Nâng cao kỹ năng viết và giao tiếp với phân tích chi tiết từ AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="flex items-center space-x-2">
                <span>Bắt đầu miễn phí</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="flex items-center space-x-2">
                <LogIn className="h-4 w-4" />
                <span>Đăng nhập</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Phân tích Từ</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Hiểu sâu sắc về nghĩa, từ loại, đồng nghĩa, trái nghĩa và cách sử dụng từ trong ngữ cảnh khác nhau.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Định nghĩa và giải thích chi tiết</li>
              <li>• Từ đồng nghĩa và trái nghĩa</li>
              <li>• Ví dụ sử dụng thực tế</li>
            </ul>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Phân tích Câu</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Phân tích cấu trúc ngữ pháp, tìm lỗi sai và gợi ý cải thiện để câu văn mạch lạc và hiệu quả hơn.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Phân tích cấu trúc ngữ pháp</li>
              <li>• Gợi ý viết lại câu</li>
              <li>• Phản hồi mang tính xây dựng</li>
            </ul>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FilePlus className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Phân tích Đoạn</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Đánh giá sự mạch lạc, logic và hiệu quả của đoạn văn cùng các gợi ý cải thiện toàn diện.
            </p>
            <ul className="space-y-2 text-sm text-gray-500">
              <li>• Phân tích cấu trúc đoạn văn</li>
              <li>• Đánh giá sự mạch lạc</li>
              <li>• Gợi ý cải thiện nội dung</li>
            </ul>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-3xl font-bold mb-4">
            Sẵn sàng nâng cao kỹ năng viết của bạn?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Tham gia ngay hôm nay để trải nghiệm sức mạnh của AI trong việc phân tích và cải thiện văn bản.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" variant="secondary" className="flex items-center space-x-2">
                <UserPlus className="h-4 w-4" />
                <span>Đăng ký ngay</span>
              </Button>
            </Link>
            <Link href="/analysis">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                Xem demo
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">AI Semantic Analysis © 2024</span>
            </div>
            <div className="flex space-x-6">
              <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-blue-600">
                Đăng nhập
              </Link>
              <Link href="/auth/signup" className="text-sm text-gray-600 hover:text-blue-600">
                Đăng ký
              </Link>
              <Link href="/analysis" className="text-sm text-gray-600 hover:text-blue-600">
                Phân tích
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
