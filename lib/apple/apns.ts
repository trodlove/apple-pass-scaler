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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:11',message:'sendSilentPush called',data:{pushTokenLength:pushToken?.length||0,pushTokenPreview:pushToken?.substring(0,20)||'null',hasKeyId:!!appleCredentials.apns_key_id,hasAuthKey:!!appleCredentials.apns_auth_key,authKeyLength:appleCredentials.apns_auth_key?.length||0,teamId:appleCredentials.team_id,passTypeId:appleCredentials.pass_type_id,isProduction:process.env.NODE_ENV==='production'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Configure APNs provider with token-based authentication
    const authKeyBuffer = Buffer.from(appleCredentials.apns_auth_key, 'utf-8');
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:20',message:'Auth key buffer created',data:{bufferLength:authKeyBuffer.length,bufferStartsWith:authKeyBuffer.toString('utf-8',0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const settings = {
      apn: {
        token: {
          key: authKeyBuffer,
          keyId: appleCredentials.apns_key_id,
          teamId: appleCredentials.team_id,
        },
        production: process.env.NODE_ENV === 'production', // Use production APNs in production
      },
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:28',message:'APNs settings configured',data:{keyId:settings.apn.token.keyId,teamId:settings.apn.token.teamId,production:settings.apn.production},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:40',message:'Notification payload prepared',data:{topic:data.topic,priority:data.priority,pushType:data.pushType,contentAvailable:data.contentAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Send the notification
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:42',message:'Calling push.send',data:{pushTokenCount:1},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const results = await push.send([pushToken], data);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:44',message:'push.send completed',data:{resultsLength:results?.length||0,result0:results?.[0]?JSON.stringify(results[0]):'null',result0Success:results?.[0]?.success,result0Message:results?.[0]?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Check if the notification was sent successfully
    if (results && results.length > 0) {
      const result = results[0];
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:48',message:'Checking result',data:{success:result.success,message:result.message,fullResult:JSON.stringify(result)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      if (result.success) {
        return true;
      } else {
        console.error('Failed to send push notification:', result.message);
        return false;
      }
    }

    return false;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:57',message:'Error in sendSilentPush',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:'no stack'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
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

