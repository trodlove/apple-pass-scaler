import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generatePassBuffer } from '@/lib/apple/pass-generation';
import { getAppleAccountById } from '@/lib/apple/credentials';

/**
 * Apple Web Service API
 * Handles all 5 required endpoints for Wallet pass updates
 * 
 * Endpoints:
 * - POST /v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
 * - DELETE /v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
 * - GET /v1/passes/{passTypeID}/{serialNumber}
 * - GET /v1/devices/{deviceID}/registrations/{passTypeID}?passesUpdatedSince={tag}
 * - POST /v1/log
 */
export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function DELETE(request: NextRequest) {
  return handleRequest(request, 'DELETE');
}

async function handleRequest(request: NextRequest, method: string) {
  try {
    // Parse the path
    const pathSegments = request.nextUrl.pathname.split('/').filter(Boolean);
    // Expected: ['api', 'apple', 'v1', ...rest]
    const applePath = pathSegments.slice(3).join('/');

    // Log all incoming requests for debugging
    console.log(`[Apple Web Service] ${method} ${applePath} - User-Agent: ${request.headers.get('user-agent')?.substring(0, 50)}`);

    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('ApplePass ')) {
      console.log(`[Apple Web Service] Missing or invalid Authorization header`);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const authenticationToken = authHeader.substring('ApplePass '.length);

    // Validate authentication token
    const { data: pass, error: authError } = await supabaseAdmin
      .from('passes')
      .select('*')
      .eq('authentication_token', authenticationToken)
      .single();

    if (authError || !pass) {
      console.log(`[Apple Web Service] Authentication failed - token: ${authenticationToken.substring(0, 10)}...`);
      return new NextResponse('Unauthorized', { status: 401 });
    }

    console.log(`[Apple Web Service] Authenticated - Pass: ${pass.serial_number}, Path: ${applePath}`);

    // Route to appropriate handler based on path and method
    if (method === 'POST' && applePath.startsWith('devices/') && applePath.includes('/registrations/')) {
      return handleRegisterDevice(request, applePath, pass);
    } else if (method === 'DELETE' && applePath.startsWith('devices/') && applePath.includes('/registrations/')) {
      return handleUnregisterDevice(request, applePath, pass);
    } else if (method === 'GET' && applePath.startsWith('passes/')) {
      return handleGetPass(request, applePath, pass);
    } else if (method === 'GET' && applePath.startsWith('devices/') && applePath.includes('/registrations/')) {
      return handleGetUpdatedPasses(request, applePath, pass);
    } else if (method === 'POST' && applePath === 'log') {
      return handleLog(request, applePath, pass);
    }

    return new NextResponse('Not Found', { status: 404 });
  } catch (error) {
    console.error('Error in Apple Web Service:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
 * Register a device for a pass
 */
async function handleRegisterDevice(
  request: NextRequest,
  path: string,
  pass: any
) {
  try {
    // Parse path: devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
    const pathParts = path.split('/');
    const deviceID = pathParts[1];
    const serialNumber = pathParts[4];

    console.log(`[Device Registration] Device ID: ${deviceID}, Serial: ${serialNumber}, Pass ID: ${pass.id}`);

    // Verify serial number matches
    if (pass.serial_number !== serialNumber) {
      console.error(`[Device Registration] Serial number mismatch: expected ${pass.serial_number}, got ${serialNumber}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Read push token from request body
    const body = await request.text();
    let pushToken = body.trim();

    if (!pushToken) {
      console.error('[Device Registration] No push token provided');
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Parse JSON if Wallet sent token as JSON string (e.g., {"pushToken":"..."})
    try {
      const parsed = JSON.parse(pushToken);
      if (parsed.pushToken) {
        pushToken = parsed.pushToken;
      }
    } catch (e) {
      // Not JSON, use as-is (should be plain hex token)
    }

    console.log(`[Device Registration] Push token received: ${pushToken.substring(0, 20)}...`);

    // Find or create device
    let { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('device_library_identifier', deviceID)
      .single();

    if (deviceError && deviceError.code === 'PGRST116') {
      // Device doesn't exist, create it
      const { data: newDevice, error: createError } = await supabaseAdmin
        .from('devices')
        .insert({
          device_library_identifier: deviceID,
          push_token: pushToken,
        })
        .select()
        .single();

      if (createError || !newDevice) {
        console.error('Error creating device:', createError);
        return new NextResponse('Internal Server Error', { status: 500 });
      }
      device = newDevice;
    } else if (deviceError) {
      console.error('Error fetching device:', deviceError);
      return new NextResponse('Internal Server Error', { status: 500 });
    } else {
      // Update push token if device exists
      await supabaseAdmin
        .from('devices')
        .update({ push_token: pushToken })
        .eq('id', device.id);
    }

    // Create registration if it doesn't exist
    const { error: regError } = await supabaseAdmin
      .from('registrations')
      .upsert({
        pass_id: pass.id,
        device_id: device.id,
      }, {
        onConflict: 'pass_id,device_id',
      });

    if (regError) {
      console.error('[Device Registration] Error creating registration:', regError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    console.log(`[Device Registration] Successfully registered device ${deviceID} for pass ${pass.id}`);
    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error in handleRegisterDevice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * DELETE /v1/devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
 * Unregister a device from a pass
 */
async function handleUnregisterDevice(
  request: NextRequest,
  path: string,
  pass: any
) {
  try {
    // Parse path: devices/{deviceID}/registrations/{passTypeID}/{serialNumber}
    const pathParts = path.split('/');
    const deviceID = pathParts[1];
    const serialNumber = pathParts[4];

    // Verify serial number matches
    if (pass.serial_number !== serialNumber) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Find device
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('device_library_identifier', deviceID)
      .single();

    if (deviceError || !device) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Delete registration
    const { error: deleteError } = await supabaseAdmin
      .from('registrations')
      .delete()
      .eq('pass_id', pass.id)
      .eq('device_id', device.id);

    if (deleteError) {
      console.error('Error deleting registration:', deleteError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error in handleUnregisterDevice:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * GET /v1/passes/{passTypeID}/{serialNumber}
 * Get the latest version of a pass
 */
async function handleGetPass(
  request: NextRequest,
  path: string,
  pass: any
) {
  try {
    // Parse path: passes/{passTypeID}/{serialNumber}
    const pathParts = path.split('/');
    const serialNumber = pathParts[2];

    // Verify serial number matches
    if (pass.serial_number !== serialNumber) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Get template and account
    const [template, account] = await Promise.all([
      pass.template_id
        ? supabaseAdmin.from('pass_templates').select('*').eq('id', pass.template_id).single()
        : Promise.resolve({ data: null, error: null }),
      pass.apple_account_id
        ? getAppleAccountById(pass.apple_account_id)
        : Promise.resolve(null),
    ]);

    if (!account) {
      return new NextResponse('Account not found', { status: 500 });
    }

    const credentials = {
      team_id: account.team_id,
      pass_type_id: account.pass_type_id,
      apns_key_id: account.apns_key_id,
      apns_auth_key: account.apns_auth_key,
      pass_signer_cert: account.pass_signer_cert,
      pass_signer_key: account.pass_signer_key,
      wwdr_cert: account.wwdr_cert,
    };

    const templateData = (template as any).data
      ? {
          pass_style: (template as any).data.pass_style,
          fields: (template as any).data.fields,
        }
      : {
          pass_style: 'generic',
          fields: {},
        };

    // Update webServiceURL in pass data
    // CRITICAL: Include notificationMessage and all backFields configuration from pass_data
    // This ensures all backFields (including links) are preserved when regenerating the pass
    // The notificationMessage triggers the notification when iOS compares old vs new pass
    const passData = {
      ...pass.pass_data,
      serialNumber: pass.serial_number,
      authenticationToken: pass.authentication_token,
      webServiceURL: `${request.nextUrl.origin}/api/apple`,
      // Ensure notificationMessage is included if it exists in pass_data
      notificationMessage: pass.pass_data?.notificationMessage || pass.pass_data?.broadcastMessage || 'Welcome! Check back for updates.',
      // Preserve all backFields configuration (links, etc.)
      latestNewsText: pass.pass_data?.latestNewsText,
      latestNewsLink: pass.pass_data?.latestNewsLink,
      makeMoneyLink: pass.pass_data?.makeMoneyLink,
      redeemCashLink: pass.pass_data?.redeemCashLink,
      shareEarnLink: pass.pass_data?.shareEarnLink,
      customerServiceLink: pass.pass_data?.customerServiceLink,
    };

    // Log for debugging - this endpoint is called when device fetches updated pass after silent push
    // CRITICAL: This is called AFTER iOS receives the silent push and checks for updated passes
    const previousMessage = pass.pass_data?.notificationMessage || pass.pass_data?.broadcastMessage || 'Welcome! Check back for updates.';
    const newMessage = passData.notificationMessage || 'Welcome! Check back for updates.';
    const valueChanged = previousMessage !== newMessage;
    
    console.log('[GET /v1/passes] Regenerating pass with updated data:', {
      serialNumber: pass.serial_number,
      hasNotificationMessage: !!passData.notificationMessage,
      previousMessage: previousMessage.substring(0, 50),
      newMessage: newMessage.substring(0, 50),
      valueChanged: valueChanged,
      willTriggerNotification: valueChanged && !!passData.notificationMessage,
      passDataKeys: Object.keys(passData),
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });

    // Generate pass buffer
    const passBuffer = await generatePassBuffer(passData, templateData, credentials);

    // Return the pass file
    return new NextResponse(passBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': `attachment; filename="pass.pkpass"`,
      },
    });
  } catch (error) {
    console.error('Error in handleGetPass:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * GET /v1/devices/{deviceID}/registrations/{passTypeID}?passesUpdatedSince={tag}
 * Get list of passes that have been updated since a given timestamp
 */
async function handleGetUpdatedPasses(
  request: NextRequest,
  path: string,
  pass: any
) {
  try {
    // Parse path: devices/{deviceID}/registrations/{passTypeID}
    const pathParts = path.split('/');
    const deviceID = pathParts[1];

    // Get passesUpdatedSince query parameter
    const passesUpdatedSince = request.nextUrl.searchParams.get('passesUpdatedSince');

    // Find device
    const { data: device, error: deviceError } = await supabaseAdmin
      .from('devices')
      .select('*')
      .eq('device_library_identifier', deviceID)
      .single();

    if (deviceError || !device) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Get all passes registered to this device that have been updated since the timestamp
    // CRITICAL: This endpoint is called by iOS after receiving a silent push to check which passes need updating
    let query = supabaseAdmin
      .from('registrations')
      .select('pass_id, passes!inner(serial_number, last_updated_at)')
      .eq('device_id', device.id);

    if (passesUpdatedSince) {
      // Filter by last_updated_at - only return passes updated since the given timestamp
      query = query.gt('passes.last_updated_at', passesUpdatedSince);
    }

    const { data: registrations, error: regError } = await query;

    if (regError) {
      console.error('[GET /v1/devices/.../registrations] Error fetching registrations:', regError);
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    // Extract serial numbers
    const serialNumbers = registrations
      ?.map((reg: any) => reg.passes?.serial_number)
      .filter((sn: string) => sn) || [];

    // Log for debugging - this is called when iOS checks for updated passes after silent push
    console.log('[GET /v1/devices/.../registrations] Device checking for updated passes:', {
      deviceID: deviceID.substring(0, 20) + '...',
      passesUpdatedSince: passesUpdatedSince || 'none (all passes)',
      updatedPassesCount: serialNumbers.length,
      serialNumbers: serialNumbers,
      timestamp: new Date().toISOString(),
    });

    if (serialNumbers.length === 0) {
      // Return empty array, not 204 - per Apple docs, should return [] not 204
      return NextResponse.json([], { status: 200 });
    }

    // Return serial numbers as JSON array - per Apple docs format
    return NextResponse.json(serialNumbers, { status: 200 });
  } catch (error) {
    console.error('Error in handleGetUpdatedPasses:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * POST /v1/log
 * Log errors from devices
 */
async function handleLog(
  request: NextRequest,
  path: string,
  pass: any
) {
  try {
    const body = await request.text();
    console.log(`[Device Log] Pass ${pass.serial_number}:`, body);

    // You could store logs in a database table if needed
    // For now, we just log to console

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error in handleLog:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

