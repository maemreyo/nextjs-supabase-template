import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404 - Trang không tìm thấy</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Xin lỗi, trang bạn đang tìm kiếm không tồn tại.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">
          Quay lại trang chủ
        </Link>
      </Button>
    </div>
  )
}