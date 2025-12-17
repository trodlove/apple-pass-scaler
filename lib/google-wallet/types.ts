// Google Wallet Pass Types

export interface GooglePass {
  id: string;
  pass_class_id: string;
  pass_object_id: string;
  affiliate_link: string;
  tracking_data: Record<string, any> | null;
  created_at: string;
}

export interface ClassConfig {
  classId: string;
  issuerName: string;
  title: string;
  subtitle?: string;
  logoUrl?: string;
  heroImageUrl?: string;
}

export interface PassConfig {
  objectId: string;
  classId: string;
  affiliateLink: string;
  title?: string;
  subtitle?: string;
  heroImageUrl?: string;
  logoUrl?: string;
  trackingData?: Record<string, any>;
}

export interface PassUpdates {
  title?: string;
  body?: string;
  heroImageUrl?: string;
}

export interface CreateClassRequest {
  classId: string;
  issuerName: string;
  title: string;
  subtitle?: string;
  logoUrl?: string;
  heroImageUrl?: string;
}

export interface CreatePassRequest {
  classId: string;
  affiliateLink: string;
  title?: string;
  subtitle?: string;
  heroImageUrl?: string;
  logoUrl?: string;
  trackingData?: Record<string, any>;
}

export interface UpdatePassRequest {
  passObjectId: string;
  title?: string;
  body?: string;
  heroImageUrl?: string;
}

export interface BroadcastRequest {
  message: string;
  title?: string;
}

export interface CreateClassResponse {
  success: boolean;
  classId: string;
  resourceId: string;
}

export interface CreatePassResponse {
  success: boolean;
  passObjectId: string;
  saveUrl: string;
}

export interface UpdatePassResponse {
  success: boolean;
  passObjectId: string;
  message: string;
}

export interface BroadcastResponse {
  success: boolean;
  totalPasses: number;
  updated: number;
  failed: number;
}
