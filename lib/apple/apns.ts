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
    const authKey = appleCredentials.apns_auth_key.trim();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:20',message:'Auth key prepared',data:{keyLength:authKey.length,keyStartsWith:authKey.substring(0,50),hasBegin:authKey.includes('BEGIN'),hasEnd:authKey.includes('END')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Configure APNs provider using dedicated 'apn' library
    // APNs keys work for both sandbox and production
    // For testing, try sandbox first (physical devices often need sandbox during development)
    // For production, Wallet passes require production APNs
    const keyValue = authKey.includes('BEGIN') ? authKey : Buffer.from(authKey, 'utf-8');
    
    // Try sandbox first for testing, then production
    let options = {
      token: {
        key: keyValue,
        keyId: appleCredentials.apns_key_id,
        teamId: appleCredentials.team_id,
      },
      production: false, // Start with sandbox for testing
    };
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:28',message:'APNs options configured',data:{keyId:options.token.keyId,teamId:options.token.teamId,production:options.production},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    // Try production first, then sandbox if production fails
    let provider = new apn.Provider(options);
    let useSandbox = false;

    // Create notification for Wallet pass update
    // Silent push with content-available tells Wallet to check for updates
    const notification = new apn.Notification();
    notification.topic = appleCredentials.pass_type_id; // Pass Type ID is the topic for Wallet
    notification.contentAvailable = true; // Silent push notification
    notification.priority = 10; // High priority
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:40',message:'Notification prepared',data:{topic:notification.topic,contentAvailable:notification.contentAvailable,priority:notification.priority,production:options.production},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    // Send the notification
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:42',message:'Calling provider.send (production)',data:{pushTokenLength:pushToken.length,pushTokenPreview:pushToken.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    let result = await provider.send(notification, pushToken);
    
    // If sandbox fails with BadEnvironmentKeyInToken, try production
    if (result.failed.length > 0 && result.failed[0].response?.reason === 'BadEnvironmentKeyInToken') {
      console.log('[APNs] Sandbox failed with BadEnvironmentKeyInToken, trying production...');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:50',message:'Retrying with production',data:{reason:result.failed[0].response?.reason},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      options.production = true;
      provider = new apn.Provider(options);
      useSandbox = false;
      result = await provider.send(notification, pushToken);
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:44',message:'provider.send completed',data:{sent:result.sent.length,failed:result.failed.length,failedDetails:JSON.stringify(result.failed)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Check result
    if (result.sent.length > 0) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:48',message:'Notification sent successfully',data:{sent:result.sent.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      return true;
    }

    if (result.failed.length > 0) {
      const failure = result.failed[0];
      const errorReason = failure.response?.reason || 'Unknown error';
      console.error(`[APNs] Failed to send notification: ${errorReason}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:57',message:'Notification failed',data:{reason:errorReason,device:String(failure.device||'unknown')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:69',message:'sendSilentPushToMultiple called',data:{pushTokenCount:pushTokens.length,pushTokens:pushTokens.map(t=>t.substring(0,20)+'...')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  if (pushTokens.length === 0) {
    return { success: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    pushTokens.map(token => sendSilentPush(token, appleCredentials))
  );
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:78',message:'All push sends completed',data:{resultsCount:results.length,results:JSON.stringify(results.map((r,i)=>({index:i,status:r.status,value:r.status==='fulfilled'?r.value:'rejected',reason:r.status==='rejected'?r.reason?.message:'none'})))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  const success = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
  const failed = results.length - success;
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/apple/apns.ts:83',message:'sendSilentPushToMultiple returning',data:{success,failed,total:pushTokens.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  // #endregion

  return { success, failed };
}

