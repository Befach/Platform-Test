# Vercel Speed Insights Integration Guide

This document describes how Vercel Speed Insights has been integrated into the Product Lifecycle Platform and how to use it.

## Overview

Vercel Speed Insights is a tool that helps you measure and improve the performance of your web application. It provides real-time Core Web Vitals metrics and other performance indicators to help you understand how your users experience your application.

## Integration Details

### What Was Added

1. **Package Installation**
   - Added `@vercel/speed-insights` to `package.json` dependencies

2. **Component Integration**
   - Imported `SpeedInsights` from `@vercel/speed-insights/next` in `/src/app/layout.tsx`
   - Added the `<SpeedInsights />` component to the root layout's JSX

### Why the Root Layout?

The `SpeedInsights` component was added to the root layout (`src/app/layout.tsx`) because:
- It runs on every page of the application
- Being in the root layout ensures tracking across all routes
- It's a non-blocking component that doesn't affect page rendering
- The root layout is the optimal location in Next.js 13+ App Router architecture

## How It Works

1. **On Deployment to Vercel**: After your next deployment to Vercel, Speed Insights will automatically:
   - Create new routes scoped at `/_vercel/speed-insights/*`
   - Inject a tracking script into your application
   - Begin collecting Core Web Vitals data

2. **Data Collection**: The component collects performance metrics including:
   - **LCP (Largest Contentful Paint)**: How quickly the main content loads
   - **FID (First Input Delay)**: How responsive the page is to user input
   - **CLS (Cumulative Layout Shift)**: Visual stability during page load
   - **TTFB (Time to First Byte)**: Server response performance
   - **FCP (First Contentful Paint)**: When content first appears

3. **Dashboard**: Once deployed and users visit your site, you can view metrics in the Vercel Dashboard:
   - Navigate to your project → Speed Insights tab
   - Data typically becomes available after a few days of user traffic

## Configuration

### Environment Setup

No additional environment variables are required for basic Speed Insights functionality. However, for production use:

1. **Enable Speed Insights in Vercel Dashboard**:
   - Go to your Vercel project settings
   - Select the "Speed Insights" tab
   - Click "Enable" to activate monitoring

2. **Deploy to Vercel**:
   ```bash
   vercel deploy
   ```

   Or push to your connected Git repository (recommended for continuous deployment)

### Optional: Custom Data Filtering

If you need to filter sensitive information from the URL before sending to Vercel, you can add a `speedInsightsBeforeSend` function to the window object:

```typescript
// In a component or layout
if (typeof window !== 'undefined') {
  (window as any).speedInsightsBeforeSend = (data: any) => {
    // Remove sensitive query parameters
    if (data.url) {
      data.url = data.url.split('?')[0];
    }
    return data;
  };
}
```

## Local Development

Speed Insights will **not** collect data during local development (`npm run dev`). Metrics are only collected when:
- Your application is deployed to Vercel
- Speed Insights has been enabled in the Vercel Dashboard
- Real users are visiting your site

## Monitoring

### Viewing Performance Metrics

1. Deploy your application to Vercel
2. Ensure Speed Insights is enabled in your project settings
3. Wait for user traffic (typically a few days for meaningful data)
4. Access metrics at: Dashboard → Project → Speed Insights tab

### Key Metrics to Monitor

| Metric | Target | Description |
|--------|--------|-------------|
| **LCP** | < 2.5s | Largest visual element load time |
| **FID** | < 100ms | First user interaction delay |
| **CLS** | < 0.1 | Visual stability (lower is better) |
| **TTFB** | < 600ms | Server response speed |
| **FCP** | < 1.8s | Time to first content |

## Troubleshooting

### Metrics Not Appearing

If you don't see metrics in the dashboard:

1. **Verify Deployment**: Check that your app is deployed to Vercel (not localhost)
2. **Check Enablement**: Ensure Speed Insights is enabled in project settings
3. **Wait for Traffic**: Give it a few days for data to accumulate
4. **Check Script**: Verify `/_vercel/speed-insights/script.js` is present in the page body using browser DevTools

### Performance Issues

If your application experiences performance issues:

1. Check the Speed Insights dashboard for bottlenecks
2. Review Core Web Vitals metrics
3. Use Chrome DevTools for deeper analysis
4. Consider implementing performance optimizations:
   - Image optimization with `next/image`
   - Code splitting with dynamic imports
   - Caching strategies for static content
   - Database query optimization

## Next Steps

1. **Deploy to Vercel**: Deploy your application with these changes
2. **Enable Speed Insights**: Activate in your project settings
3. **Monitor Metrics**: Check the dashboard periodically
4. **Optimize**: Use insights to identify and fix performance bottlenecks
5. **Learn More**: Visit the [Speed Insights documentation](https://vercel.com/docs/speed-insights)

## References

- [Vercel Speed Insights Documentation](https://vercel.com/docs/speed-insights)
- [Core Web Vitals Guide](https://web.dev/vitals/)
- [Next.js Performance Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [@vercel/speed-insights Package](https://www.npmjs.com/package/@vercel/speed-insights)

## Current Implementation

The Speed Insights component has been integrated into:
- **File**: `src/app/layout.tsx`
- **Integration Point**: Root layout JSX
- **Status**: Ready for Vercel deployment

No additional configuration is needed. Once deployed to Vercel and users visit your site, Speed Insights will automatically begin collecting performance data.
