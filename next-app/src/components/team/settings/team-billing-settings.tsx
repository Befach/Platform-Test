'use client'

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { CreditCard, Crown, Info, Check } from 'lucide-react'

interface TeamBillingSettingsProps {
    team: {
        plan: string
        created_at: string
    }
}

export function TeamBillingSettings({ team }: TeamBillingSettingsProps) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        Subscription
                    </CardTitle>
                    <CardDescription>Manage your organization&apos;s subscription</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Current Plan</p>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-600 hover:bg-blue-600 text-white">
                                    <Crown className="mr-1 h-3 w-3" />
                                    Pro
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                    Full access to all features
                                </span>
                            </div>
                        </div>
                        <Button variant="outline" disabled>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Manage Billing
                        </Button>
                    </div>

                    {/* Pro Plan Features */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                            <Crown className="h-4 w-4" />
                            Pro Plan Features
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {[
                                'Unlimited workspaces',
                                'External review system',
                                'Real-time collaboration',
                                'Custom analytics dashboards',
                                'AI-powered insights',
                                'Phase-based permissions',
                                'Team management',
                                'Priority support',
                            ].map((feature) => (
                                <div key={feature} className="flex items-center gap-2 text-sm text-blue-800">
                                    <Check className="h-4 w-4 text-blue-600 shrink-0" />
                                    <span>{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-muted-foreground">
                        <p>
                            <strong>Organization Created:</strong>{' '}
                            {new Date(team.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Billing Coming Soon Notice */}
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Billing Portal Coming Soon</AlertTitle>
                <AlertDescription>
                    Self-service billing management with payment history, invoices, and plan upgrades
                    will be available in a future update. Contact support for billing inquiries.
                </AlertDescription>
            </Alert>
        </div>
    )
}
