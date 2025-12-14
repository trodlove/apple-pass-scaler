import PushNotifications from 'node-pushnotifications';
import type { AppleCredentials } from '@/lib/types';

/**
 * Sends a visible push notification to a device for Wallet passes
 * 
 * @param pushToken The device's push token
 * @param appleCredentials Apple Developer Account credentials
 * @param message Optional message to display in the notification
 * @returns Promise<boolean> True if notification was sent successfully
 */
export async function sendSilentPush(
  pushToken: string,
  appleCredentials: AppleCredentials,
  message?: string
): Promise<boolean> {
  try {
    // Handle APNs key - it might be stored as PEM format or raw string
    let apnsKey: Buffer | string = appleCredentials.apns_auth_key;
    
    // If it's a PEM format (starts with -----BEGIN), use it as-is
    // Otherwise, convert to Buffer
    if (!apnsKey.includes('-----BEGIN')) {
      apnsKey = Buffer.from(appleCredentials.apns_auth_key, 'utf-8');
    }

    // Configure APNs provider with token-based authentication
    const settings = {
      apn: {
        token: {
          key: apnsKey,
          keyId: appleCredentials.apns_key_id,
          teamId: appleCredentials.team_id,
        },
        production: true, // Always use production for Wallet passes
      },
    };

    const push = new PushNotifications(settings);

    // Prepare the notification payload
    // For Wallet passes, we need to send a visible notification
    const data: any = {
      topic: appleCredentials.pass_type_id, // Pass Type ID is the topic for Wallet
      priority: 10, // High priority
      pushType: message ? 'alert' : 'background',
      contentAvailable: 1, // Tell Wallet to check for updates
    };

    // If message is provided, send visible notification
    if (message) {
      data.alert = {
        title: 'Wallet Update',
        body: message,
      };
      data.sound = 'default';
    } else {
      // Silent push to trigger update check
      data.pushType = 'background';
      data.sound = '';
    }

    // Send the notification
    const results = await push.send([pushToken], data);

    // Check if the notification was sent successfully
    if (results && results.length > 0) {
      const result = results[0];
      if (result.success) {
        console.log('✅ Push notification sent successfully to', pushToken.substring(0, 20) + '...');
        return true;
      } else {
        console.error('❌ Failed to send push notification:', result.message, result);
        return false;
      }
    }

    console.error('❌ No results returned from push.send');
    return false;
  } catch (error) {
    console.error('❌ Error sending push notification:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return false;
  }
}

/**
 * Sends push notifications to multiple devices
 * 
 * @param pushTokens Array of device push tokens
 * @param appleCredentials Apple Developer Account credentials
 * @param message Optional message to display in notifications
 * @returns Promise<{ success: number; failed: number }> Count of successful and failed notifications
 */
export async function sendSilentPushToMultiple(
  pushTokens: string[],
  appleCredentials: AppleCredentials,
  message?: string
): Promise<{ success: number; failed: number }> {
  if (pushTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  console.log(`📤 Sending notifications to ${pushTokens.length} device(s)${message ? ` with message: "${message}"` : ''}`);

  const results = await Promise.allSettled(
    pushTokens.map(token => sendSilentPush(token, appleCredentials, message))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;

  console.log(`📊 Notification results: ${success} successful, ${failed} failed`);

  return { success, failed };
}

