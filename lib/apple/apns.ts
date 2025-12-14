import PushNotifications from 'node-pushnotifications';
import type { AppleCredentials } from '@/lib/types';

/**
 * Sends a silent push notification to a device to trigger Wallet to fetch updated pass
 * 
 * IMPORTANT: Apple Wallet notifications work by:
 * 1. Updating a pass field with changeMessage property
 * 2. Sending a SILENT push (content-available: 1)
 * 3. Device fetches updated pass
 * 4. iOS compares old vs new pass and shows notification if field changed
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

    // Prepare the SILENT push notification payload
    // This is CRITICAL: Must be silent (no alert, no sound) - just content-available
    // The actual notification text comes from the pass field with changeMessage
    const data: any = {
      topic: appleCredentials.pass_type_id, // Pass Type ID is the topic for Wallet
      priority: 10, // High priority
      pushType: 'background', // Background push (silent)
      contentAvailable: 1, // This tells Wallet to check for updates
      // NO alert, NO sound, NO badge - this is a silent push
    };

    // Send the notification
    const results = await push.send([pushToken], data);

    // Check if the notification was sent successfully
    if (results && results.length > 0) {
      const result = results[0];
      if (result.success) {
        console.log('✅ Silent push sent successfully to', pushToken.substring(0, 20) + '...');
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

  console.log(`📤 Sending silent push notifications to ${pushTokens.length} device(s)`);

  const results = await Promise.allSettled(
    pushTokens.map(token => sendSilentPush(token, appleCredentials))
  );

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;

  console.log(`📊 Notification results: ${success} successful, ${failed} failed`);

  return { success, failed };
}

