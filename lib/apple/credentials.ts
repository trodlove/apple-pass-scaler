import { supabaseAdmin } from '@/lib/supabase/server';
import type { AppleDeveloperAccount, AppleCredentials } from '@/lib/types';

/**
 * Gets an active Apple Developer Account for pass generation.
 * Implements churn-and-burn strategy by rotating through accounts
 * based on last_used_at timestamp.
 * 
 * @returns Promise<AppleCredentials | null> The credentials object or null if no active account found
 */
export async function getActiveAppleAccount(): Promise<AppleCredentials | null> {
  try {
    // Query for an ACTIVE account, ordered by last_used_at ascending (oldest first)
    // This distributes load across accounts
    const { data, error } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('*')
      .eq('status', 'ACTIVE')
      .order('last_used_at', { ascending: true, nullsFirst: true })
      .order('priority', { ascending: false }) // Higher priority first if last_used_at is the same
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching active Apple account:', error);
      return null;
    }

    if (!data) {
      console.warn('No active Apple Developer Account found');
      return null;
    }

    // Update the last_used_at timestamp atomically
    const { error: updateError } = await supabaseAdmin
      .from('apple_developer_accounts')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);

    if (updateError) {
      console.error('Error updating last_used_at:', updateError);
      // Still return the account even if update fails
    }

    // Return the credentials in the format needed for pass generation
    return {
      team_id: data.team_id,
      pass_type_id: data.pass_type_id,
      apns_key_id: data.apns_key_id,
      apns_auth_key: data.apns_auth_key,
      pass_signer_cert: data.pass_signer_cert,
      pass_signer_key: data.pass_signer_key,
      wwdr_cert: data.wwdr_cert,
    };
  } catch (error) {
    console.error('Unexpected error in getActiveAppleAccount:', error);
    return null;
  }
}

/**
 * Gets a specific Apple Developer Account by ID
 * 
 * @param accountId The UUID of the account
 * @returns Promise<AppleDeveloperAccount | null>
 */
export async function getAppleAccountById(accountId: string): Promise<AppleDeveloperAccount | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error) {
      console.error('Error fetching Apple account by ID:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error in getAppleAccountById:', error);
    return null;
  }
}

