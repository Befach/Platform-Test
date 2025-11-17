import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ArrowLeft, Bell } from 'lucide-react'

interface ComingSoonModuleProps {
  workspaceId: string
  moduleName: string
  moduleIcon: string
  description: string
  plannedFeatures: string[]
}

export function ComingSoonModule({
  workspaceId,
  moduleName,
  moduleIcon,
  description,
  plannedFeatures,
}: ComingSoonModuleProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/workspaces/${workspaceId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Workspace
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">{moduleIcon}</div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-4xl font-bold">{moduleName}</h1>
              <Badge className="bg-yellow-100 text-yellow-800 text-sm">
                Coming Soon
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground">{description}</p>
          </div>

          {/* Planned Features */}
          <Card>
            <CardHeader>
              <CardTitle>Planned Features</CardTitle>
              <CardDescription>
                What you can expect when this module launches
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plannedFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-semibold mt-0.5">
                      {index + 1}
                    </div>
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-blue-900">
                  Development in Progress
                </h3>
                <p className="text-sm text-blue-700">
                  We're actively working on this module. It will be available in a future update.
                </p>
                <Button variant="outline" className="gap-2" disabled>
                  <Bell className="h-4 w-4" />
                  Notify Me When Ready
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Back Button */}
          <div className="text-center">
            <Link href={`/workspaces/${workspaceId}`}>
              <Button variant="outline" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Workspace
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
