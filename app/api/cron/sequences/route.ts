import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { sendSilentPushToMultiple } from '@/lib/apple/apns';
import { getAppleAccountById } from '@/lib/apple/credentials';

/**
 * GET /api/cron/sequences
 * Vercel Cron endpoint that processes due sequence steps
 * Protected by Vercel Cron secret
 */
export async function GET(request: NextRequest) {
  try {
    // Verify Vercel Cron authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.VERCEL_CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query for all sequence enrollments that are due
    const now = new Date().toISOString();
    const { data: enrollments, error: enrollmentsError } = await supabaseAdmin
      .from('sequence_enrollments')
      .select(`
        *,
        sequences!inner(*),
        passes!inner(id, apple_account_id, pass_data)
      `)
      .eq('status', 'ACTIVE')
      .lte('next_execution_at', now);

    if (enrollmentsError) {
      console.error('Error fetching sequence enrollments:', enrollmentsError);
      return NextResponse.json(
        { error: 'Failed to fetch enrollments' },
        { status: 500 }
      );
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No due sequences found',
        processed: 0,
      }, { status: 200 });
    }

    let processed = 0;
    let errors = 0;

    // Process each due enrollment
    for (const enrollment of enrollments) {
      try {
        const pass = (enrollment as any).passes;
        const sequence = (enrollment as any).sequences;

        if (!pass || !sequence) {
          console.warn(`Missing pass or sequence for enrollment ${enrollment.id}`);
          errors++;
          continue;
        }

        // Get the current step
        const { data: step, error: stepError } = await supabaseAdmin
          .from('sequence_steps')
          .select('*')
          .eq('sequence_id', sequence.id)
          .eq('step_number', enrollment.current_step)
          .single();

        if (stepError || !step) {
          console.warn(`Step ${enrollment.current_step} not found for sequence ${sequence.id}`);
          // Mark enrollment as completed if no more steps
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({ status: 'COMPLETED' })
            .eq('id', enrollment.id);
          continue;
        }

        // Update pass_data with the message template
        // Replace %@ placeholder with any dynamic content if needed
        const message = step.message_template.replace('%@', '');
        const updatedPassData = {
          ...pass.pass_data,
          sequenceMessage: message,
          sequenceStep: enrollment.current_step,
          sequenceUpdatedAt: new Date().toISOString(),
        };

        const { error: updateError } = await supabaseAdmin
          .from('passes')
          .update({
            pass_data: updatedPassData,
            last_updated_at: new Date().toISOString(),
            last_modified: new Date().toISOString(), // CRITICAL: iOS uses this to detect updates
          })
          .eq('id', pass.id);

        if (updateError) {
          console.error(`Error updating pass ${pass.id}:`, updateError);
          errors++;
          continue;
        }

        // Get all registered devices for this pass
        const { data: registrations, error: regError } = await supabaseAdmin
          .from('registrations')
          .select('device_id, devices!inner(push_token)')
          .eq('pass_id', pass.id);

        if (regError) {
          console.error(`Error fetching registrations for pass ${pass.id}:`, regError);
          errors++;
          continue;
        }

        // Send push notifications if there are devices
        if (registrations && registrations.length > 0 && pass.apple_account_id) {
          const pushTokens = registrations
            .map((reg: any) => {
              let token = reg.devices?.push_token;
              if (!token) return null;
              
              // Parse JSON string if token is stored as JSON
              try {
                const parsed = JSON.parse(token);
                if (parsed.pushToken) {
                  return parsed.pushToken;
                }
              } catch (e) {
                // Not JSON, use as-is
              }
              
              return token;
            })
            .filter((token: string | null): token is string => !!token && token.trim().length > 0);

          if (pushTokens.length > 0) {
            // Get account credentials
            const account = await getAppleAccountById(pass.apple_account_id);
            if (account) {
              const credentials = {
                team_id: account.team_id,
                pass_type_id: account.pass_type_id,
                apns_key_id: account.apns_key_id,
                apns_auth_key: account.apns_auth_key,
                pass_signer_cert: account.pass_signer_cert,
                pass_signer_key: account.pass_signer_key,
                wwdr_cert: account.wwdr_cert,
              };

              await sendSilentPushToMultiple(pushTokens, credentials);
            }
          }
        }

        // Check if there are more steps
        const { data: nextStep, error: nextStepError } = await supabaseAdmin
          .from('sequence_steps')
          .select('*')
          .eq('sequence_id', sequence.id)
          .eq('step_number', enrollment.current_step + 1)
          .single();

        if (nextStepError || !nextStep) {
          // No more steps, mark as completed
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({ status: 'COMPLETED' })
            .eq('id', enrollment.id);
        } else {
          // Calculate next execution time
          const nextExecutionAt = new Date();
          nextExecutionAt.setHours(nextExecutionAt.getHours() + nextStep.delay_hours);

          // Update enrollment for next step
          await supabaseAdmin
            .from('sequence_enrollments')
            .update({
              current_step: enrollment.current_step + 1,
              next_execution_at: nextExecutionAt.toISOString(),
            })
            .eq('id', enrollment.id);
        }

        processed++;
      } catch (error) {
        console.error(`Error processing enrollment ${enrollment.id}:`, error);
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processed} sequence enrollments`,
      processed,
      errors,
    }, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in sequence cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

