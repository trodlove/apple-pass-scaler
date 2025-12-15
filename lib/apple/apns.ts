import PushNotifications from 'node-pushnotifications';
import type { AppleCredentials } from '@/lib/types';

/**
 * Sends a silent push notification to a device to trigger Wallet to fetch updated pass
 * 
 * @param pushToken The device's push token
 * @param appleCredentials Apple Developer Account credentials
 * @returns Promise<boolean> True if notification was sent successfully
 */
export async function sendSilentPush(
  pushToken: string,
  appleCredentials: AppleCredentials
): Promise<boolean> {
  try {
    // Configure APNs provider with token-based authentication
    const settings = {
      apn: {
        token: {
          key: Buffer.from(appleCredentials.apns_auth_key, 'utf-8'),
          keyId: appleCredentials.apns_key_id,
          teamId: appleCredentials.team_id,
        },
        production: process.env.NODE_ENV === 'production', // Use production APNs in production
      },
    };

    const push = new PushNotifications(settings);

    // Prepare the notification payload
    // Silent push with content-available: 1 tells Wallet to check for updates
    const data = {
      topic: appleCredentials.pass_type_id, // Pass Type ID is the topic for Wallet
      priority: 10, // High priority
      pushType: 'background',
      contentAvailable: 1, // Silent push notification
      sound: '', // No sound for silent push
      badge: undefined, // No badge update
    };

    // Send the notification
    const results = await push.send([pushToken], data);

    // Check if the notification was sent successfully
    if (results && results.length > 0) {
      const result = results[0];
      if (result.success) {
        return true;
      } else {
        console.error('Failed to send push notification:', result.message);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('Error sending silent push notification:', error);
    return false;
  }
}

/**
 * Sends silent push notifications to multiple devices
 * 
 * @param pushTokens Array of device push tokens
 * @param appleCredentials Apple Developer Account credentials
 * @returns Promise<{ success: number; failed: number }> Count of successful and failed notifications
 */
export async function sendSilentPushToMultiple(
  pushTokens: string[],
  appleCredentials: AppleCredentials
): Promise<{ success: number; failed: number }> {
  if (pushTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    pushTokens.map(token => sendSilentPush(token, appleCredentials))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;

  return { success, failed };
}

