import { NextRequest, NextResponse } from 'next/server';
import { batchGenerate } from '@/lib/generate';

/**
 * GET /api/cron/generate
 * 
 * Daily auto-generation cron job.
 * Generates 10 new artworks across all styles and sends them to review.
 * 
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/generate",
 *     "schedule": "0 6 * * *"
 *   }]
 * }
 * 
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const DAILY_COUNT = 10;

  try {
    const { results, summary } = await batchGenerate(DAILY_COUNT, {
      autoPublish: false, // Always send to review
    });

    // Log results
    console.log(`[CRON] Daily generation complete: ${summary.success} success, ${summary.failed} failed`);

    return NextResponse.json({
      message: `Daily generation complete`,
      ...summary,
      generated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Daily generation failed:', error);
    return NextResponse.json(
      { error: 'Generation failed', message: error.message },
      { status: 500 }
    );
  }
}

// Vercel cron configuration
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minute timeout for batch generation
