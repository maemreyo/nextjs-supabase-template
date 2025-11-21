'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuth, useAuthUser, useAuthProfile, useAuthState, useAuthActions } from '@/hooks/stores/use-auth-store'

// Example component showing auth state
export function AuthStatusExample() {
  const { isAuthenticated, user, profile, userDisplayName, userAvatar, isEmailVerified } = useAuth()
  
  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Not Authenticated</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You are not currently signed in. Use the sign in form below to access your account.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={userAvatar || undefined} alt={userDisplayName} />
            <AvatarFallback>{userDisplayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-lg">{userDisplayName}</CardTitle>
            <CardDescription>{user?.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Badge variant={isEmailVerified ? 'default' : 'secondary'}>
            {isEmailVerified ? 'Verified' : 'Not Verified'}
          </Badge>
          {profile && (
            <Badge variant="outline">
              Profile Complete
            </Badge>
          )}
        </div>
        
        {profile && (
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Full Name:</strong> {profile.full_name || 'Not set'}
            </p>
            <p className="text-sm">
              <strong>Member Since:</strong> {new Date(user?.created_at || '').toLocaleDateString()}
            </p>
            <p className="text-sm">
              <strong>Last Updated:</strong> {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'Never'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Example component for sign in form
export function SignInFormExample() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { signIn, isLoading, error } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await signIn(email, password)
      // Form will be cleared automatically on successful sign in
    } catch (error) {
      // Error is handled by the store
      console.error('Sign in failed:', error)
    }
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Example component for sign up form
export function SignUpFormExample() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const { signUp, isLoading, error } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await signUp(email, password, { full_name: fullName })
      // Form will be cleared automatically on successful sign up
    } catch (error) {
      console.error('Sign up failed:', error)
    }
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign Up</CardTitle>
        <CardDescription>Create a new account to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Example component for profile management
export function ProfileManagementExample() {
  const { user, profile, updateProfile, uploadAvatar, isLoading } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  
  const handleProfileUpdate = async () => {
    try {
      await updateProfile({ full_name: fullName })
    } catch (error) {
      console.error('Profile update failed:', error)
    }
  }
  
  const handleAvatarUpload = async () => {
    if (!avatarFile) return
    
    try {
      await uploadAvatar(avatarFile)
      setAvatarFile(null)
    } catch (error) {
      console.error('Avatar upload failed:', error)
    }
  }
  
  if (!user) {
    return <p>Please sign in to manage your profile.</p>
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Profile Management</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="avatar">Avatar</Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            disabled={isLoading}
          />
          {avatarFile && (
            <p className="text-sm text-muted-foreground">
              Selected: {avatarFile.name}
            </p>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Button 
            onClick={handleProfileUpdate} 
            disabled={isLoading || fullName === profile?.full_name}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
          
          <Button 
            onClick={handleAvatarUpload} 
            disabled={isLoading || !avatarFile}
            variant="outline"
          >
            {isLoading ? 'Uploading...' : 'Upload Avatar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Example component for password reset
export function PasswordResetExample() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const { resetPassword, isLoading, error } = useAuth()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await resetPassword(email)
      setSubmitted(true)
    } catch (error) {
      console.error('Password reset failed:', error)
    }
  }
  
  if (submitted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Email Sent</CardTitle>
          <CardDescription>
            Check your email for password reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            We've sent a password reset link to {email}. 
            Please check your inbox and follow the instructions.
          </p>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>
          Enter your email to receive password reset instructions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending...' : 'Send Reset Email'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// Combined auth examples component
export function AuthExamples() {
  const { isAuthenticated } = useAuthState()
  
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Authentication Examples</h2>
        
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <AuthStatusExample />
          
          {!isAuthenticated ? (
            <>
              <SignInFormExample />
              <SignUpFormExample />
            </>
          ) : (
            <>
              <ProfileManagementExample />
              <PasswordResetExample />
            </>
          )}
        </div>
      </div>
    </div>
  )
}