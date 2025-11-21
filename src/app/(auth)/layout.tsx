import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 ${geistSans.variable} ${geistMono.variable} antialiased`}>
      <div className="flex min-h-screen">
        {/* Left side - Branding and illustration */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-gray-900 dark:to-gray-800">
          <div className="flex flex-col justify-center px-12 py-12">
            <div className="text-center">
              <h1 className={`text-4xl font-bold text-white ${geistMono.className}`}>
                AI Analysis
              </h1>
              <p className="mt-2 text-sm text-blue-100">
                Phân tích ngôn ngữ thông minh với AI
              </p>
            </div>
            
            {/* Illustration */}
            <div className="mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8">
                <div className="flex items-center justify-center h-48 w-48">
                  <div className="h-full w-full rounded-lg bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
                    <svg className="h-24 w-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 0 0 0 2l-2-2m6 12a2 2 0 002-2v-6a2 2 0 00-2-2H7a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15l-2-2m0 0l4-4m0 0l4 4M3 10a7 7 0 00-7 7h14a7 7 0 007-7v0a7 7 0 00-7-7H3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <div className="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-sm">
            <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg">
              <div className="p-6 sm:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}