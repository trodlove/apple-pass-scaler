import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import apn from 'apn';

export const dynamic = 'force-dynamic';

/**
 * GET /api/debug/verify-apns-key
 * Diagnostic endpoint to verify APNs key format and configuration
 */
export async function GET(request: NextRequest) {
  try {
    // Get the active Apple account
    const { data: accounts, error: accountsError } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('*')
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();

    if (accountsError || !accounts) {
      return NextResponse.json(
        { error: 'No active Apple account found' },
        { status: 404 }
      );
    }

    const account = accounts;
    const authKey = account.apns_auth_key.trim();
    
    // Analyze key format
    const keyAnalysis = {
      length: authKey.length,
      hasBegin: authKey.includes('BEGIN'),
      hasEnd: authKey.includes('END'),
      hasNewlines: authKey.includes('\n'),
      hasCarriageReturns: authKey.includes('\r'),
      first50Chars: authKey.substring(0, 50),
      last50Chars: authKey.substring(authKey.length - 50),
      lineCount: authKey.split('\n').length,
    };

    // Try to create provider with current key (as string)
    let providerString: any = null;
    let providerStringError: string | null = null;
    try {
      const keyValueString = authKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n';
      providerString = new apn.Provider({
        token: {
          key: keyValueString,
          keyId: account.apns_key_id,
          teamId: account.team_id,
        },
        production: true,
      });
    } catch (e: any) {
      providerStringError = e.message;
    }

    // Try to create provider with key as Buffer
    let providerBuffer: any = null;
    let providerBufferError: string | null = null;
    try {
      const keyValueBuffer = Buffer.from(authKey.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim() + '\n', 'utf-8');
      providerBuffer = new apn.Provider({
        token: {
          key: keyValueBuffer,
          keyId: account.apns_key_id,
          teamId: account.team_id,
        },
        production: true,
      });
    } catch (e: any) {
      providerBufferError = e.message;
    }

    return NextResponse.json({
      account: {
        keyId: account.apns_key_id,
        teamId: account.team_id,
        passTypeId: account.pass_type_id,
      },
      keyAnalysis,
      providerCreation: {
        asString: {
          success: providerString !== null,
          error: providerStringError,
        },
        asBuffer: {
          success: providerBuffer !== null,
          error: providerBufferError,
        },
      },
      recommendations: [
        'Verify the key ID matches the key in Apple Developer account',
        'Verify the team ID matches your Apple Developer account',
        'Ensure the key has "Apple Push Notifications service (APNs)" enabled',
        'Check if the key has been revoked or expired',
      ],
    }, { status: 200 });
  } catch (error) {
    console.error('Error in verify-apns-key:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

