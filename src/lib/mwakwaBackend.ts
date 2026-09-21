import { base44 } from '@/api/base44Client';

export type MwakwaUser = {
  id: string;
  email?: string;
  full_name?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  role?: string;
  account_type?: 'attendee' | 'organizer';
};

export const mwakwaAuth = {
  me: async (): Promise<MwakwaUser | null> => {
    try {
      return (await base44.auth.me()) as MwakwaUser;
    } catch {
      return null;
    }
  },
  isAuthenticated: () => base44.auth.isAuthenticated(),
  login: (email: string, password: string) => base44.auth.loginViaEmailPassword(email, password),
  register: (email: string, password: string) => base44.auth.register({ email, password }),
  verifyOtp: (email: string, otpCode: string) => base44.auth.verifyOtp({ email, otpCode }),
  resendOtp: (email: string) => base44.auth.resendOtp(email),
  requestPasswordReset: (email: string) => base44.auth.resetPasswordRequest(email),
  updateMe: (data: Record<string, unknown>) => base44.auth.updateMe(data),
  loginWithGoogle: (fromUrl?: string) => base44.auth.loginWithProvider('google', fromUrl),
  logout: (redirectUrl = '/') => base44.auth.logout(redirectUrl),
};

export const mwakwaData = {
  events: base44.entities.Event,
  ticketTypes: base44.entities.TicketType,
  tickets: base44.entities.Ticket,
  payments: base44.entities.Payment,
  orders: base44.entities.Order,
  organizerProfiles: base44.entities.OrganizerProfile,
  comments: base44.entities.EventComment,
  savedEvents: base44.entities.SavedEvent,
  discountCodes: base44.entities.DiscountCode,
  eventComments: base44.entities.EventComment,
  promotionBanners: base44.entities.PromotionBanner,
  brandSettings: base44.entities.BrandSettings,
  platformSettings: base44.entities.PlatformSettings,
  contentPages: base44.entities.ContentPage,
  siteSections: base44.entities.SiteSection,
  navigationItems: base44.entities.NavigationItem,
  feePolicies: base44.entities.FeePolicy,
  payoutPolicies: base44.entities.PayoutPolicy,
  refundPolicies: base44.entities.RefundPolicy,
  cancellationPolicies: base44.entities.CancellationPolicy,
  eventPolicyOverrides: base44.entities.EventPolicyOverride,
  cmsChangeRequests: base44.entities.CmsChangeRequest,
  businessInfo: base44.entities.BusinessInfo,
};

export const mwakwaFiles = {
  uploadPublic: (file: File) => base44.integrations.Core.UploadFile({ file }),
  uploadPrivate: (file: File) => base44.integrations.Core.UploadPrivateFile({ file }),
  signedUrl: (fileUri: string, expiresIn = 300) =>
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: fileUri, expires_in: expiresIn }),
};
