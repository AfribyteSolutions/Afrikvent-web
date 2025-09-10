import { NextRequest, NextResponse } from 'next/server';

interface PromotionalBannerData {
  id: string;
  imageUrl: string;
  altText: string;
  href: string;
  openInNewTab?: boolean;
  overlayText?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };
  height?: number;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
  clickCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
  clientId?: string;
  campaignId?: string;
  budget?: number;
  costPerClick?: number;
  costPerImpression?: number;
}

// 💡 Using a mock in-memory data store to simulate a database.
// In a real application, you would perform these operations on a persistent database.
const mockBanners: PromotionalBannerData[] = [
  {
    id: "banner-1",
    imageUrl: "/images/promotions/tech-conference-banner.jpg",
    altText: "TechCorp 2024 Conference - Innovation Summit",
    href: "https://techcorp.com/conference-2024",
    openInNewTab: true,
    overlayText: {
      title: "TechCorp Innovation Summit 2024",
      subtitle: "Join 5000+ developers & entrepreneurs",
      buttonText: "Register Now"
    },
    height: 250,
    isActive: true,
    priority: 10,
    startDate: "2024-01-01T00:00:00Z",
    endDate: "2024-12-31T23:59:59Z",
    clickCount: 156,
    impressionCount: 8420,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
    clientId: "client-techcorp",
    campaignId: "campaign-tech-summit-2024",
    budget: 5000,
    costPerClick: 2.50,
    costPerImpression: 0.10
  },
  {
    id: "banner-2",
    imageUrl: "/images/promotions/music-festival-banner.jpg",
    altText: "Summer Music Festival 2024",
    href: "https://summermusicfest.com/tickets",
    openInNewTab: true,
    overlayText: {
      title: "Summer Music Festival",
      subtitle: "3 Days of Amazing Music",
      buttonText: "Buy Tickets"
    },
    height: 200,
    isActive: true,
    priority: 8,
    startDate: "2024-03-01T00:00:00Z",
    endDate: "2024-06-30T23:59:59Z",
    clickCount: 89,
    impressionCount: 4250,
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-10T14:20:00Z",
    clientId: "client-musicfest",
    campaignId: "campaign-summer-fest-2024",
    budget: 3000,
    costPerClick: 1.80,
    costPerImpression: 0.08
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bannerId, bannerIds, action } = body;

    // Validation
    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 });
    }

    if (action === 'click') {
      if (!bannerId) {
        return NextResponse.json({ error: 'bannerId required for click tracking' }, { status: 400 });
      }

      // 💡 Find the banner and increment its click count
      const banner = mockBanners.find(b => b.id === bannerId);
      if (banner) {
        banner.clickCount++;
        banner.updatedAt = new Date().toISOString();
        console.log(`Tracked click for banner ID: ${bannerId}. New click count: ${banner.clickCount}`);
      }
      
      return NextResponse.json({ success: true, message: 'Click tracked' });

    } else if (action === 'impression') {
      if (!bannerIds || !Array.isArray(bannerIds)) {
        return NextResponse.json({ error: 'bannerIds (array) required for impression tracking' }, { status: 400 });
      }

      // 💡 Loop through all banner IDs and increment their impression counts
      for (const id of bannerIds) {
        const banner = mockBanners.find(b => b.id === id);
        if (banner) {
          banner.impressionCount++;
          banner.updatedAt = new Date().toISOString();
        }
      }
      console.log(`Tracked impressions for banner IDs: ${bannerIds}`);
      
      return NextResponse.json({ success: true, message: 'Impressions tracked' });

    } else {
      return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error tracking banner event:', error);
    return NextResponse.json(
      { error: 'Failed to track banner event' },
      { status: 500 }
    );
  }
}
