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
    console.log(`[Apple Web Service] Full pathname: ${request.nextUrl.pathname}, Query: ${request.nextUrl.search}`);
    
    // Also log directly to database for guaranteed visibility
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: `[Apple Web Service] ${method} ${applePath}`,
        data: { method, applePath, fullPath: request.nextUrl.pathname, query: request.nextUrl.search, userAgent: request.headers.get('user-agent')?.substring(0, 50) },
        level: 'info',
      }),
    }).catch(() => {});

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:35',message:'Request received',data:{method,applePath,pathSegments:pathSegments.join('/'),fullPath:request.nextUrl.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // CRITICAL: GET /v1/devices/{deviceID}/registrations/{passTypeID} does NOT require authentication
    // Per Apple docs: "All requests (except for getting the list of updatable passes) are authenticated"
    // Check if this is the GET /v1/devices/{deviceID}/registrations/{passTypeID} endpoint
    // Path format: devices/{deviceID}/registrations/{passTypeID}
    const pathParts = applePath.split('/').filter(p => p.length > 0); // Filter empty strings
    
    // SIMPLIFIED: Check if this matches the pattern exactly
    // Pattern: devices/{deviceID}/registrations/{passTypeID}
    const isGetUpdatedPassesList = method === 'GET' && 
      pathParts.length === 4 && 
      pathParts[0] === 'devices' && 
      pathParts[2] === 'registrations';

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:50',message:'Path analysis',data:{pathParts,pathPartsLength:pathParts.length,isGet:method==='GET',isDevices:pathParts[0]==='devices',isRegistrations:pathParts[2]==='registrations',isGetUpdatedPassesList,applePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL DEBUG: Log path parsing details to console (visible in Vercel logs)
    console.log(`[DEBUG] Path parsing:`, JSON.stringify({
      method,
      applePath,
      pathParts,
      pathPartsLength: pathParts.length,
      pathParts0: pathParts[0],
      pathParts1: pathParts[1],
      pathParts2: pathParts[2],
      pathParts3: pathParts[3],
      isGet: method === 'GET',
      isDevices: pathParts[0] === 'devices',
      isRegistrations: pathParts[2] === 'registrations',
      isGetUpdatedPassesList,
      fullPathname: request.nextUrl.pathname,
    }, null, 2));

    let pass: any = null;

    // Only require authentication for endpoints that need it
    if (!isGetUpdatedPassesList) {
      console.log(`[DEBUG] AUTH REQUIRED - isGetUpdatedPassesList=false for path: ${applePath}`);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:57',message:'Auth required - checking header',data:{applePath,isGetUpdatedPassesList},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // Authenticate the request
      const authHeader = request.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('ApplePass ')) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:60',message:'401 - Missing auth header',data:{applePath,hasAuthHeader:!!authHeader,authHeaderPreview:authHeader?.substring(0,20),isGetUpdatedPassesList},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        console.log(`[Apple Web Service] Missing or invalid Authorization header for ${applePath}`);
        console.log(`[Apple Web Service] isGetUpdatedPassesList was: ${isGetUpdatedPassesList}, method: ${method}, pathParts: ${JSON.stringify(pathParts)}`);
        
        // Log 401 error to database
        await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `[Apple Web Service] 401 Unauthorized - ${method} ${applePath}`,
            data: { method, applePath, isGetUpdatedPassesList, pathParts, hasAuthHeader: !!request.headers.get('authorization') },
            level: 'error',
          }),
        }).catch(() => {});
        
        return new NextResponse('Unauthorized', { status: 401 });
      }

      const authenticationToken = authHeader.substring('ApplePass '.length);

      // Validate authentication token
      const { data: authPass, error: authError } = await supabaseAdmin
        .from('passes')
        .select('*')
        .eq('authentication_token', authenticationToken)
        .single();

      if (authError || !authPass) {
        console.log(`[Apple Web Service] Authentication failed - token: ${authenticationToken.substring(0, 10)}...`);
        return new NextResponse('Unauthorized', { status: 401 });
      }

      pass = authPass;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:77',message:'Auth successful',data:{serialNumber:pass.serial_number,applePath},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      console.log(`[Apple Web Service] Authenticated - Pass: ${pass.serial_number}, Path: ${applePath}`);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:79',message:'No auth required - GET updated passes list',data:{applePath,pathParts},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      console.log(`[DEBUG] NO AUTH REQUIRED - isGetUpdatedPassesList=true for path: ${applePath}, pathParts: ${JSON.stringify(pathParts)}`);
      console.log(`[Apple Web Service] No authentication required for GET /v1/devices/.../registrations/{passTypeID}`);
      
      // Log successful auth bypass to database
      await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: `[Apple Web Service] Auth bypass successful - GET ${applePath}`,
          data: { method, applePath, pathParts, isGetUpdatedPassesList: true },
          level: 'info',
        }),
      }).catch(() => {});
    }

    // Route to appropriate handler based on path and method
    if (method === 'POST' && applePath.startsWith('devices/') && applePath.includes('/registrations/')) {
      return handleRegisterDevice(request, applePath, pass!);
    } else if (method === 'DELETE' && applePath.startsWith('devices/') && applePath.includes('/registrations/')) {
      return handleUnregisterDevice(request, applePath, pass!);
    } else if (method === 'GET' && applePath.startsWith('passes/')) {
      // Log BEFORE calling handleGetPass to see if route is even being hit
      console.log('[Apple Web Service] Routing to handleGetPass:', { applePath, hasPass: !!pass });
      await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: '[Apple Web Service] Routing to handleGetPass',
          data: { applePath, hasPass: !!pass, method },
          level: 'info',
        }),
      }).catch(() => {});
      return handleGetPass(request, applePath, pass!);
    } else if (isGetUpdatedPassesList) {
      // This endpoint doesn't need a pass object, but we need to extract passTypeID from path
      return handleGetUpdatedPasses(request, applePath, null);
    } else if (method === 'POST' && applePath === 'log') {
      return handleLog(request, applePath, pass!);
    }

    // Log 404s
    console.log('[Apple Web Service] 404 - No route matched:', { method, applePath });
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[Apple Web Service] 404 - No route matched',
        data: { method, applePath },
        level: 'warn',
      }),
    }).catch(() => {});
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
    const passTypeID = pathParts[1];
    const serialNumber = pathParts[2];

    // Log that this endpoint was called - CRITICAL for debugging
    console.log('[GET /v1/passes] Request received:', {
      passTypeID,
      serialNumber,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 50),
    });
    
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[GET /v1/passes] Request received',
        data: { passTypeID, serialNumber },
        level: 'info',
      }),
    }).catch(() => {});

    // Find pass by serial number (don't rely on authenticated pass object)
    const { data: foundPass, error: passError } = await supabaseAdmin
      .from('passes')
      .select('*')
      .eq('serial_number', serialNumber)
      .single();

    if (passError || !foundPass) {
      console.log('[GET /v1/passes] Pass not found:', { serialNumber, error: passError?.message });
      await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: '[GET /v1/passes] Pass not found',
          data: { serialNumber, error: passError?.message },
          level: 'error',
        }),
      }).catch(() => {});
      return new NextResponse('Not Found', { status: 404 });
    }

    // Verify passTypeID matches
    if (foundPass.apple_account_id) {
      const account = await getAppleAccountById(foundPass.apple_account_id);
      if (account && account.pass_type_id !== passTypeID) {
        console.log('[GET /v1/passes] PassTypeID mismatch:', { 
          expected: passTypeID, 
          actual: account.pass_type_id,
          serialNumber,
        });
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
    
    // Use foundPass instead of authenticated pass
    pass = foundPass;

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
  pass: any // Can be null for this endpoint - no auth required
) {
  try {
    // Parse path: devices/{deviceID}/registrations/{passTypeID}
    const pathParts = path.split('/');
    const deviceID = pathParts[1];
    const passTypeID = pathParts[3]; // Extract passTypeID from path

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
    // Filter by passTypeID to only return passes matching the requested type
    // First, get the apple_account_id for this passTypeID
    const { data: account, error: accountError } = await supabaseAdmin
      .from('apple_developer_accounts')
      .select('id')
      .eq('pass_type_id', passTypeID)
      .eq('status', 'ACTIVE')
      .limit(1)
      .single();

    if (accountError || !account) {
      console.log(`[GET /v1/devices/.../registrations] No active account found for passTypeID: ${passTypeID}`);
      return NextResponse.json([], { status: 200 });
    }

    // CRITICAL FIX: Get all serial numbers for this device registration first
    // Then filter by last_modified if passesUpdatedSince is provided
    const { data: allRegistrations, error: allRegError } = await supabaseAdmin
      .from('registrations')
      .select('pass_id, passes!inner(serial_number, last_modified, apple_account_id)')
      .eq('device_id', device.id)
      .eq('passes.apple_account_id', account.id);

    if (allRegError || !allRegistrations) {
      console.log('[GET /v1/devices/.../registrations] No registrations found');
      return NextResponse.json({ serialNumbers: [], lastUpdated: new Date().toISOString() }, { status: 200 });
    }

    const allSerialNumbers = allRegistrations
      .map((reg: any) => reg.passes?.serial_number)
      .filter((sn: string) => sn);

    // Log query parameters
    console.log('[GET /v1/devices/.../registrations] Query parameters:', {
      deviceID: deviceID.substring(0, 20) + '...',
      deviceId: device.id,
      passTypeID,
      accountId: account.id,
      passesUpdatedSince: passesUpdatedSince || 'none (returning all passes)',
      allSerialNumbersCount: allSerialNumbers.length,
    });

    // CRITICAL FIX: If no passesUpdatedSince tag, return ALL serial numbers for this device
    // This is what iOS expects when checking for updates after a push
    if (!passesUpdatedSince) {
      console.log('[GET /v1/devices/.../registrations] No passesUpdatedSince - returning ALL serial numbers:', allSerialNumbers);
      return NextResponse.json({
        serialNumbers: allSerialNumbers,
        lastUpdated: new Date().toISOString(),
      }, { status: 200 });
    }

    // CRITICAL FIX: If passesUpdatedSince IS provided, find which passes have been modified since that timestamp
    // passesUpdatedSince is a Unix timestamp (seconds), convert to ISO string for database comparison
    const passesUpdatedSinceDate = new Date(parseInt(passesUpdatedSince) * 1000).toISOString();
    
    const { data: updatedPasses, error: passError } = await supabaseAdmin
      .from('passes')
      .select('serial_number')
      .in('serial_number', allSerialNumbers)
      .gt('last_modified', passesUpdatedSinceDate);

    if (passError) {
      console.error('[GET /v1/devices/.../registrations] Error fetching updated passes:', passError);
      return NextResponse.json({ serialNumbers: [], lastUpdated: new Date().toISOString() }, { status: 200 });
    }

    const updatedSerialNumbers = updatedPasses?.map((p: any) => p.serial_number) || [];
    
    console.log('[GET /v1/devices/.../registrations] Filtering by passesUpdatedSince:', {
      passesUpdatedSince,
      passesUpdatedSinceDate,
      allSerialNumbersCount: allSerialNumbers.length,
      updatedSerialNumbersCount: updatedSerialNumbers.length,
      updatedSerialNumbers,
    });
    
    // Use updatedSerialNumbers for the rest of the logic
    const serialNumbers = updatedSerialNumbers;

    // serialNumbers is already set above based on whether passesUpdatedSince was provided

    // Log for debugging - this is called when iOS checks for updated passes after silent push
    console.log('[GET /v1/devices/.../registrations] Device checking for updated passes:', {
      deviceID: deviceID.substring(0, 20) + '...',
      passTypeID,
      passesUpdatedSince: passesUpdatedSince || 'none (all passes)',
      updatedPassesCount: serialNumbers.length,
      serialNumbers: serialNumbers,
      allRegistrationsCount: allSerialNumbers.length,
      timestamp: new Date().toISOString(),
    });
    
    // Log to database for guaranteed visibility
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[GET /v1/devices/.../registrations] Returning updated passes',
        data: { 
          deviceID: deviceID.substring(0, 20) + '...', 
          passTypeID,
          passesUpdatedSince: passesUpdatedSince || 'none',
          serialNumbersCount: serialNumbers.length,
          serialNumbers,
          allRegistrationsCount: allSerialNumbers.length,
        },
        level: serialNumbers.length > 0 ? 'info' : 'warn',
      }),
    }).catch(() => {});

    // CRITICAL FIX: Return the correct format per Apple documentation
    // The response should be a JSON object with serialNumbers array and lastUpdated timestamp
    // This is the critical response. If serialNumbers is not empty, iOS will proceed to fetch the passes.
    console.log('[GET /v1/devices/.../registrations] Returning response:', {
      serialNumbersCount: serialNumbers.length,
      serialNumbers,
      passesUpdatedSince: passesUpdatedSince || 'none',
    });
    
    await fetch(`${request.nextUrl.origin}/api/debug/log-event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: '[GET /v1/devices/.../registrations] Returning serial numbers - iOS should fetch passes',
        data: { 
          deviceID, 
          passTypeID, 
          passesUpdatedSince, 
          serialNumbers, 
          count: serialNumbers.length,
          expectedCalls: serialNumbers.map((sn: string) => `GET /v1/passes/${passTypeID}/${sn}`),
        },
        level: serialNumbers.length > 0 ? 'info' : 'warn',
      }),
    }).catch(() => {});
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/f2e4e82b-ebdd-4413-8acd-05ca1ad240c1',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/apple/v1/[...path]/route.ts:670',message:'Returning serial numbers to iOS',data:{serialNumbers,passTypeID,expectedCalls:serialNumbers.map((sn:string)=>`GET /v1/passes/${passTypeID}/${sn}`)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // CRITICAL: Return JSON object with serialNumbers array and lastUpdated timestamp
    return NextResponse.json({
      serialNumbers: serialNumbers,
      lastUpdated: new Date().toISOString(),
    }, { status: 200 });
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

