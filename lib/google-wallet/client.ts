import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import type { ClassConfig, PassConfig, PassUpdates } from './types';

// Parse credentials from environment
function getCredentials() {
  const jsonString = process.env.GOOGLE_WALLET_SERVICE_ACCOUNT_JSON;
  if (!jsonString) {
    throw new Error('GOOGLE_WALLET_SERVICE_ACCOUNT_JSON environment variable is not set');
  }
  return JSON.parse(jsonString);
}

function getIssuerId() {
  const issuerId = process.env.GOOGLE_WALLET_ISSUER_ID;
  if (!issuerId) {
    throw new Error('GOOGLE_WALLET_ISSUER_ID environment variable is not set');
  }
  return issuerId;
}

// Get authenticated Google Wallet API client
export async function getWalletClient() {
  const credentials = getCredentials();
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/wallet_object.issuer'],
  });
  
  return google.walletobjects({ version: 'v1', auth });
}

/**
 * Create a new Generic Pass Class (template)
 */
export async function createPassClass(config: ClassConfig) {
  const client = await getWalletClient();
  const issuerId = getIssuerId();
  const classId = `${issuerId}.${config.classId}`;

  const genericClass: any = {
    id: classId,
    issuerName: config.issuerName,
    reviewStatus: 'UNDER_REVIEW',
    // Required header fields
    classTemplateInfo: {
      cardTemplateOverride: {
        cardRowTemplateInfos: [
          {
            oneItem: {
              item: {
                firstValue: {
                  fields: [{ fieldPath: "object.textModulesData['details']" }],
                },
              },
            },
          },
        ],
      },
    },
    // Hero image at the top of the pass
    ...(config.heroImageUrl && {
      heroImage: {
        sourceUri: { uri: config.heroImageUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Hero Image' } },
      },
    }),
    // Logo image
    ...(config.logoUrl && {
      logo: {
        sourceUri: { uri: config.logoUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Logo' } },
      },
    }),
  };

  try {
    const response = await client.genericclass.insert({ requestBody: genericClass });
    return {
      success: true,
      classId: config.classId,
      resourceId: classId,
      data: response.data,
    };
  } catch (error: any) {
    // If class already exists, try to get it
    if (error.code === 409) {
      const existing = await client.genericclass.get({ resourceId: classId });
      return {
        success: true,
        classId: config.classId,
        resourceId: classId,
        data: existing.data,
        alreadyExists: true,
      };
    }
    throw error;
  }
}

/**
 * Create a new Generic Pass Object with appLinkData for affiliate link
 */
export async function createPassObject(config: PassConfig) {
  const client = await getWalletClient();
  const issuerId = getIssuerId();
  const objectId = `${issuerId}.${config.objectId}`;
  const classId = `${issuerId}.${config.classId}`;

  const passObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    // Required: Card title that appears at the top of the pass
    cardTitle: {
      defaultValue: {
        language: 'en',
        value: config.title || 'Exclusive Offer',
      },
    },
    // Required: Header shown on the pass
    header: {
      defaultValue: {
        language: 'en',
        value: config.subtitle || 'Tap below to claim',
      },
    },
    // Text content for details
    textModulesData: [
      {
        id: 'details',
        header: 'Details',
        body: config.title || 'Your exclusive offer awaits!',
      },
    ],
    // Hero image
    ...(config.heroImageUrl && {
      heroImage: {
        sourceUri: { uri: config.heroImageUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Hero Image' } },
      },
    }),
    // Logo
    ...(config.logoUrl && {
      logo: {
        sourceUri: { uri: config.logoUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Logo' } },
      },
    }),
    // THIS IS THE KEY FEATURE - Clickable affiliate link button on front of pass
    appLinkData: {
      webAppLinkInfo: {
        appTarget: {
          targetUri: {
            uri: config.affiliateLink,
          },
        },
      },
      displayText: {
        defaultValue: {
          language: 'en-US',
          value: 'CLAIM YOUR REWARD',
        },
      },
    },
  };

  try {
    const response = await client.genericobject.insert({ requestBody: passObject });
    return {
      success: true,
      objectId: config.objectId,
      resourceId: objectId,
      data: response.data,
    };
  } catch (error: any) {
    // If object already exists, try to get it
    if (error.code === 409) {
      const existing = await client.genericobject.get({ resourceId: objectId });
      return {
        success: true,
        objectId: config.objectId,
        resourceId: objectId,
        data: existing.data,
        alreadyExists: true,
      };
    }
    throw error;
  }
}

/**
 * Update a pass object - this automatically triggers a push notification
 */
export async function updatePassObject(passObjectId: string, updates: PassUpdates) {
  const client = await getWalletClient();
  const issuerId = getIssuerId();
  const resourceId = passObjectId.includes('.') ? passObjectId : `${issuerId}.${passObjectId}`;

  const updatePayload: any = {};

  // Update text content
  if (updates.title || updates.body) {
    updatePayload.textModulesData = [
      {
        id: 'notification',
        header: updates.title || 'New Update!',
        body: updates.body || '',
      },
    ];
  }

  // Update hero image
  if (updates.heroImageUrl) {
    updatePayload.heroImage = {
      sourceUri: { uri: updates.heroImageUrl },
      contentDescription: { defaultValue: { language: 'en', value: 'Hero Image' } },
    };
  }

  const response = await client.genericobject.patch({
    resourceId,
    requestBody: updatePayload,
  });

  return {
    success: true,
    objectId: passObjectId,
    data: response.data,
  };
}

/**
 * Generate a "Save to Google Wallet" URL using JWT
 */
export function generateSaveUrl(passObject: any): string {
  const credentials = getCredentials();
  
  const claims = {
    iss: credentials.client_email,
    aud: 'google',
    origins: [process.env.NEXT_PUBLIC_APP_URL || 'https://localhost:3000'],
    typ: 'savetowallet',
    payload: {
      genericObjects: [passObject],
    },
  };

  const token = jwt.sign(claims, credentials.private_key, { algorithm: 'RS256' });
  return `https://pay.google.com/gp/v/save/${token}`;
}

/**
 * Create a pass object and return the save URL in one step
 */
export async function createPassWithSaveUrl(config: PassConfig) {
  const issuerId = getIssuerId();
  const objectId = `${issuerId}.${config.objectId}`;
  const classId = `${issuerId}.${config.classId}`;

  // Build the pass object for JWT signing
  const passObject: any = {
    id: objectId,
    classId: classId,
    state: 'ACTIVE',
    // Required: Card title that appears at the top of the pass
    cardTitle: {
      defaultValue: {
        language: 'en',
        value: config.title || 'Exclusive Offer',
      },
    },
    // Required: Header shown on the pass
    header: {
      defaultValue: {
        language: 'en',
        value: config.subtitle || 'Tap below to claim',
      },
    },
    // Text content for details
    textModulesData: [
      {
        id: 'details',
        header: 'Details',
        body: config.title || 'Your exclusive offer awaits!',
      },
    ],
    ...(config.heroImageUrl && {
      heroImage: {
        sourceUri: { uri: config.heroImageUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Hero Image' } },
      },
    }),
    ...(config.logoUrl && {
      logo: {
        sourceUri: { uri: config.logoUrl },
        contentDescription: { defaultValue: { language: 'en', value: 'Logo' } },
      },
    }),
    // Affiliate link button on front of pass
    appLinkData: {
      webAppLinkInfo: {
        appTarget: {
          targetUri: {
            uri: config.affiliateLink,
          },
        },
      },
      displayText: {
        defaultValue: {
          language: 'en-US',
          value: 'CLAIM YOUR REWARD',
        },
      },
    },
  };

  const saveUrl = generateSaveUrl(passObject);

  return {
    success: true,
    objectId: config.objectId,
    resourceId: objectId,
    saveUrl,
    passObject,
  };
}

/**
 * Get a pass class by ID
 */
export async function getPassClass(classId: string) {
  const client = await getWalletClient();
  const issuerId = getIssuerId();
  const resourceId = classId.includes('.') ? classId : `${issuerId}.${classId}`;

  const response = await client.genericclass.get({ resourceId });
  return response.data;
}

/**
 * Get a pass object by ID
 */
export async function getPassObject(objectId: string) {
  const client = await getWalletClient();
  const issuerId = getIssuerId();
  const resourceId = objectId.includes('.') ? objectId : `${issuerId}.${objectId}`;

  const response = await client.genericobject.get({ resourceId });
  return response.data;
}
