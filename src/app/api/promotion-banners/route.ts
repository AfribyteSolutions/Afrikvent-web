import { NextRequest, NextResponse } from 'next/server';

// Banner analytics writes are intentionally disabled in the public Next.js route.
// PromotionBanner content itself is stored in Base44. Tracking will move to a
// server-authorized Base44 function when campaign analytics is enabled.
export async function POST(request: NextRequest) {
  try {
    const { bannerId, bannerIds, action } = await request.json();
    if (!action || !['click', 'impression'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (action === 'click' && !bannerId) {
      return NextResponse.json({ error: 'bannerId required' }, { status: 400 });
    }
    if (action === 'impression' && (!Array.isArray(bannerIds) || bannerIds.length === 0)) {
      return NextResponse.json({ error: 'bannerIds required' }, { status: 400 });
    }
    return NextResponse.json({ success: true, tracked: false });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
