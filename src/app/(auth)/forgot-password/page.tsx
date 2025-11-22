'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuthStore } from '@/stores/auth-store'
import { Loader2Icon, MailIcon } from 'lucide-react'
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/validations/auth'

function ForgotPasswordPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { resetPassword, isLoading, error } = useAuthStore()
  
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: ''
    }
  })

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    if (isSubmitted) return
    
    setIsSubmitted(true)
    
    try {
      await resetPassword(data.email)
      router.push('/(auth)/signin?message=reset-success')
    } catch (err) {
      console.error('Reset password error:', err)
      setIsSubmitted(false)
    }
  }

  const message = searchParams.get('message')

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Quên mật khẩu</CardTitle>
          <CardDescription className="text-center">
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {message === 'reset-success' && (
            <Alert className="mb-4">
              <AlertDescription>
                Email đặt lại mật khẩu đã được gửi! Vui lòng kiểm tra hòm thư và làm theo hướng dẫn.
              </AlertDescription>
            </Alert>
          )}
          
          {message === 'signup-success' && (
            <Alert className="mb-4">
              <AlertDescription>
                Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!message && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="nhập@email.com"
                            type="email"
                            disabled={isLoading || isSubmitted}
                            {...field}
                          />
                          <MailIcon className="absolute right-3 top-1/2 h-4 w-4 text-gray-400 -translate-y-1/2" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || isSubmitted}
                >
                  {isLoading || isSubmitted ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi link đặt lại mật khẩu'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm">
            <Link 
              href="/(auth)/signin" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
          
          <div className="text-center text-sm">
            Chưa có tài khoản?{' '}
            <Link 
              href="/(auth)/signup" 
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Đăng ký ngay
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center p-4">Loading...</div>}>
      <ForgotPasswordPageContent />
    </Suspense>
  )
}