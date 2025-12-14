import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

/**
 * GET /api/accounts
 * Fetch all Apple Developer Accounts
 */
export async function GET() {
  try {
    const { data: accounts, error } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch accounts' },
        { status: 500 }
      );
    }

    return NextResponse.json(accounts || [], { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * Create a new Apple Developer Account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      team_id,
      pass_type_id,
      apns_key_id,
      apns_auth_key,
      pass_signer_cert,
      pass_signer_key,
      wwdr_cert,
      status,
    } = body;

    if (!name || !team_id || !pass_type_id || !apns_key_id || !apns_auth_key || !pass_signer_cert || !pass_signer_key || !wwdr_cert) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const { data: account, error } = await supabaseAdmin
      .from('apple_developer_accounts')
      .insert({
        name,
        team_id,
        pass_type_id,
        apns_key_id,
        apns_auth_key,
        pass_signer_cert,
        pass_signer_key,
        wwdr_cert,
        status: status || 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/accounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

