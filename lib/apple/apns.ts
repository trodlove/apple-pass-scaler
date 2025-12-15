import apn from 'apn';
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
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:11',message:'sendSilentPush called',data:{pushTokenLength:pushToken?.length||0,pushTokenPreview:pushToken?.substring(0,20)||'null',hasKeyId:!!appleCredentials.apns_key_id,hasAuthKey:!!appleCredentials.apns_auth_key,authKeyLength:appleCredentials.apns_auth_key?.length||0,teamId:appleCredentials.team_id,passTypeId:appleCredentials.pass_type_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // Validate token format - APNs tokens are 64 hex characters
    const isApnsToken = /^[0-9a-f]{64}$/i.test(pushToken);
    if (!isApnsToken) {
      console.error(`[APNs] Invalid token format. Expected 64 hex characters, got ${pushToken.length} characters: ${pushToken.substring(0, 20)}...`);
      return false;
    }

    // Prepare APNs auth key
    // The guide suggests Base64 encoding, but we store as PEM text
    // Try both: if it looks like base64 (no BEGIN/END), decode it; otherwise use as PEM string
    let authKey = appleCredentials.apns_auth_key.trim();
    
    // If key doesn't have BEGIN/END markers, it might be base64 encoded
    if (!authKey.includes('BEGIN') && !authKey.includes('END')) {
      try {
        // Try to decode as base64
        authKey = Buffer.from(authKey, 'base64').toString('ascii');
        console.log('[APNs] Decoded key from base64');
      } catch (e) {
        // Not base64, use as-is
        console.log('[APNs] Key is not base64, using as-is');
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:20',message:'Auth key prepared',data:{keyLength:authKey.length,keyStartsWith:authKey.substring(0,50),hasBegin:authKey.includes('BEGIN'),hasEnd:authKey.includes('END')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Configure APNs provider - CRITICAL: Wallet passes MUST use production: true
    // Per the guide: "All Apple Wallet passes, regardless of how they are installed, use the PRODUCTION APNs environment."
    const options = {
      token: {
        key: authKey, // Use PEM string directly
        keyId: appleCredentials.apns_key_id,
        teamId: appleCredentials.team_id,
      },
      production: true, // MUST be true for Wallet passes
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:28',message:'APNs options configured',data:{keyId:options.token.keyId,teamId:options.token.teamId,production:options.production},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    const provider = new apn.Provider(options);

    // Create notification for Wallet pass update
    // Per the guide: payload must be empty, topic must be Pass Type ID
    const notification = new apn.Notification();
    notification.payload = {}; // CRITICAL: Empty payload for Wallet updates
    notification.topic = appleCredentials.pass_type_id; // CRITICAL: Must be Pass Type ID, not Bundle ID
    notification.priority = 5; // Per guide: should be 5, not 10
    notification.contentAvailable = true; // Silent push notification (background update)
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:40',message:'Notification prepared',data:{topic:notification.topic,payload:JSON.stringify(notification.payload),priority:notification.priority,contentAvailable:notification.contentAvailable},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Send the notification
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:42',message:'Calling provider.send',data:{pushTokenLength:pushToken.length,pushTokenPreview:pushToken.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const result = await provider.send(notification, pushToken);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:44',message:'provider.send completed',data:{sent:result.sent.length,failed:result.failed.length,failedDetails:result.failed.length>0?JSON.stringify({device:result.failed[0].device,status:result.failed[0].status,reason:result.failed[0].response?.reason}):'none'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Check result - per guide: detailed error handling
    if (result.failed.length > 0) {
      const failedDevice = result.failed[0];
      const errorReason = failedDevice.response?.reason || 'Unknown error';
      const errorStatus = failedDevice.status;
      console.error('[APNs] Failed Notification:', {
        device: failedDevice.device,
        status: errorStatus,
        response: failedDevice.response,
        reason: errorReason,
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:57',message:'Notification failed',data:{reason:errorReason,device:String(failedDevice.device||'unknown'),status:errorStatus,fullResponse:JSON.stringify(failedDevice.response)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      // Throw error with details so caller can see it
      throw new Error(`APNs failed: ${errorReason} (status: ${errorStatus})`);
    }

    if (result.sent.length > 0) {
      console.log('[APNs] Sent Successfully:', result.sent[0]);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:48',message:'Notification sent successfully',data:{sent:result.sent.length,device:result.sent[0]?.device},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return true;
    }

    return false;
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:57',message:'Error in sendSilentPush',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:'no stack'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    console.error('[APNs] General Error:', error);
    // Re-throw so caller can see the error
    throw error;
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
): Promise<{ success: number; failed: number; errors?: string[] }> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:69',message:'sendSilentPushToMultiple called',data:{pushTokenCount:pushTokens.length,pushTokens:pushTokens.map(t=>t.substring(0,20)+'...')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  if (pushTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    pushTokens.map(async (token) => {
      try {
        return await sendSilentPush(token, appleCredentials);
      } catch (error) {
        console.error(`[APNs] Error sending to token ${token.substring(0, 20)}...:`, error);
        // Don't throw - let Promise.allSettled capture it
        return false;
      }
    })
  );
  // #region agent log
  const resultDetails = results.map((r, i) => ({
    index: i,
    status: r.status,
    value: r.status === 'fulfilled' ? r.value : false,
    reason: r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : 'none',
  }));
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:78',message:'All push sends completed',data:{resultsCount:results.length,results:JSON.stringify(resultDetails)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;
  
  // Collect error details from rejected promises
  const errors = results
    .filter(r => r.status === 'rejected')
    .map(r => r.status === 'rejected' ? (r.reason instanceof Error ? r.reason.message : String(r.reason)) : '');
  
  if (errors.length > 0) {
    console.error('[APNs] Errors from sendSilentPushToMultiple:', errors);
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:83',message:'sendSilentPushToMultiple returning',data:{success,failed,total:pushTokens.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  return { success, failed, errors: errors.length > 0 ? errors : undefined };
}

