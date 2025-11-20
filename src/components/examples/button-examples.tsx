'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function ButtonExamples() {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Button Examples</CardTitle>
        <CardDescription>
          Various button styles and configurations using Shadcn UI Button component
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button Variants</h4>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button Sizes</h4>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon">🔥</Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Button States</h4>
          <div className="flex flex-wrap gap-2">
            <Button>Normal</Button>
            <Button disabled>Disabled</Button>
            <Button disabled>
              <span className="animate-spin">⏳</span> Loading...
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">With Icons</h4>
          <div className="flex flex-wrap gap-2">
            <Button>
              <ThemeToggle />
              Theme Toggle
            </Button>
            <Button variant="outline">
              <ThemeToggle />
              With Icon
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}