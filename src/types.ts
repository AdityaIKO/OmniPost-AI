import { Timestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  createdAt: Timestamp;
}

export interface BrandProfile {
  id?: string;
  brandName: string;
  industry: string;
  targetAudience: string;
  toneOfVoice: string;
  customInstructions?: string;
  createdAt: Timestamp;
}

export interface GeneratedPost {
  id?: string;
  brandProfileId: string;
  platforms: string[];
  contentPillar?: string;
  topic: string;
  outputs?: {
    X?: string;
    Facebook?: string;
    Instagram?: string;
    TikTok?: string;
  };
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  scheduledDate?: Timestamp;
  publishTime?: string;
  status: 'draft' | 'scheduled' | 'published';
  createdAt: Timestamp;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string;
    email?: string | null;
    emailVerified?: boolean;
    isAnonymous?: boolean;
    tenantId?: string | null;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}
