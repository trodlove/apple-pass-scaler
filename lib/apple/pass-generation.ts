import { PKPass } from 'passkit-generator';
import type { AppleCredentials, PassData, TemplateData } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Generates a signed .pkpass file buffer from pass data and template
 * 
 * @param passData User-specific data including tracking parameters
 * @param templateData Template structure with pass style and fields
 * @param appleCredentials Apple Developer Account credentials
 * @returns Promise<Buffer> The signed .pkpass file as a Buffer
 */
export async function generatePassBuffer(
  passData: PassData,
  templateData: TemplateData,
  appleCredentials: AppleCredentials
): Promise<Buffer> {
  try {
    // Create pass.json structure
    const passStyle = templateData.pass_style || 'generic';
    
    // Base pass.json structure
    const passJson: any = {
      formatVersion: 1,
      passTypeIdentifier: appleCredentials.pass_type_id,
      teamIdentifier: appleCredentials.team_id,
      organizationName: passData.organizationName || 'Apple Pass Scaler',
      description: passData.description || 'Wallet Pass',
      serialNumber: passData.serialNumber || generateSerialNumber(),
      backgroundColor: passData.backgroundColor || 'rgb(255, 255, 255)',
      foregroundColor: passData.foregroundColor || 'rgb(0, 0, 0)',
    };

    // Add labelColor if provided
    if (passData.labelColor) {
      passJson.labelColor = passData.labelColor;
    }

    // Add logoText if provided
    if (passData.logoText) {
      passJson.logoText = passData.logoText;
    }

    // Set pass type based on style
    let passTypeSection: any = {};
    if (passStyle === 'coupon') {
      passJson.coupon = passTypeSection;
    } else if (passStyle === 'loyalty') {
      passJson.storeCard = passTypeSection;
    } else if (passStyle === 'boardingPass') {
      passJson.boardingPass = passTypeSection;
    } else if (passStyle === 'eventTicket') {
      passJson.eventTicket = passTypeSection;
    } else {
      passJson.generic = passTypeSection;
    }

    // Add header fields - always include at least a default header so pass isn't blank
    if (!passTypeSection.headerFields) {
      passTypeSection.headerFields = [];
    }
    if (passData.headerLabel && passData.headerValue) {
      passTypeSection.headerFields.push({
        key: 'header',
        label: passData.headerLabel,
        value: passData.headerValue,
      });
    } else {
      // Add default header if none provided
      passTypeSection.headerFields.push({
        key: 'header',
        label: 'Wallet Pass',
        value: passData.organizationName || 'Apple Pass Scaler',
      });
    }

    // Add secondary fields - always include at least default fields so pass isn't blank
    if (!passTypeSection.secondaryFields) {
      passTypeSection.secondaryFields = [];
    }
    if (passData.secondaryLeftLabel && passData.secondaryLeftValue) {
      passTypeSection.secondaryFields.push({
        key: 'secondaryLeft',
        label: passData.secondaryLeftLabel,
        value: passData.secondaryLeftValue,
      });
    } else {
      // Add default secondary field
      passTypeSection.secondaryFields.push({
        key: 'secondaryLeft',
        label: 'Status',
        value: 'Active',
      });
    }
    if (passData.secondaryRightLabel && passData.secondaryRightValue) {
      passTypeSection.secondaryFields.push({
        key: 'secondaryRight',
        label: passData.secondaryRightLabel,
        value: passData.secondaryRightValue,
      });
    } else {
      // Add default secondary field
      passTypeSection.secondaryFields.push({
        key: 'secondaryRight',
        label: 'ID',
        value: passData.serialNumber?.substring(0, 12) || 'N/A',
      });
    }

    // Add primaryFields - CRITICAL: These show on the front of the pass
    // Without primaryFields, the pass will appear blank
    if (!passTypeSection.primaryFields) {
      passTypeSection.primaryFields = [];
    }
    if (passData.primaryLabel && passData.primaryValue) {
      passTypeSection.primaryFields.push({
        key: 'primary',
        label: passData.primaryLabel,
        value: passData.primaryValue,
      });
    } else {
      // Add default primary field - CRITICAL: pass must have visible content on front
      passTypeSection.primaryFields.push({
        key: 'primary',
        label: 'Welcome',
        value: passData.organizationName || 'Apple Pass Scaler',
      });
    }

    // NOTE: backFields are now added directly to the PKPass object after creation
    // This ensures they're properly included in the final pass structure
    // See code below after PKPass object is created

    // Add website URL if provided
    if (passData.websiteUrl) {
      passJson.associatedStoreIdentifiers = [];
      // Note: In production, you'd need to register the website domain with Apple
      // For now, we'll add it as a webServiceURL alternative
      passJson.userInfo = {
        websiteUrl: passData.websiteUrl,
      };
    }

    // Add webServiceURL and authenticationToken if provided
    if (passData.webServiceURL) {
      passJson.webServiceURL = passData.webServiceURL;
      passJson.authenticationToken = passData.authenticationToken;
    }

    // Add relevantDate if provided
    if (passData.relevantDate) {
      passJson.relevantDate = new Date(passData.relevantDate).toISOString();
    }

    // Helper function to convert base64 data URL to Buffer
    function base64ToBuffer(base64: string): Buffer {
      // Handle data URLs (data:image/png;base64,...)
      const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
      return Buffer.from(base64Data, 'base64');
    }

    // Create a minimal icon (1x1 transparent PNG) - required by Apple
    const minimalIcon = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Regenerate pass.json with updated fields (after adding headerFields, secondaryFields, etc.)
    // This ensures the JSON structure is complete before creating buffers
    const finalPassJson = JSON.parse(JSON.stringify(passJson));

    // Create buffers object for passkit-generator
    const buffers: Record<string, Buffer> = {
      'pass.json': Buffer.from(JSON.stringify(finalPassJson, null, 2)),
    };

    // Add images if provided
    if (passData.logo) {
      try {
        const logoBuffer = base64ToBuffer(passData.logo);
        buffers['logo.png'] = logoBuffer;
        buffers['logo@2x.png'] = logoBuffer; // Use same image for 2x
      } catch (error) {
        console.warn('Error processing logo image:', error);
      }
    }

    if (passData.icon) {
      try {
        const iconBuffer = base64ToBuffer(passData.icon);
        buffers['icon.png'] = iconBuffer;
        buffers['icon@2x.png'] = iconBuffer;
      } catch (error) {
        console.warn('Error processing icon image:', error);
        // Fallback to minimal icon
        buffers['icon.png'] = minimalIcon;
        buffers['icon@2x.png'] = minimalIcon;
      }
    } else {
      // Use minimal icon if no custom icon provided
      buffers['icon.png'] = minimalIcon;
      buffers['icon@2x.png'] = minimalIcon;
    }

    if (passData.stripImage) {
      try {
        const stripBuffer = base64ToBuffer(passData.stripImage);
        buffers['strip.png'] = stripBuffer;
        buffers['strip@2x.png'] = stripBuffer;
      } catch (error) {
        console.warn('Error processing strip image:', error);
      }
    }

    // Create certificates object (omit signerKeyPassphrase if empty)
    const certificates: any = {
      wwdr: appleCredentials.wwdr_cert,
      signerCert: appleCredentials.pass_signer_cert,
      signerKey: appleCredentials.pass_signer_key,
    };
    
    // Only add signerKeyPassphrase if it's not empty (library doesn't allow empty string)
    // For now, we assume no passphrase is needed, so we omit it entirely

    // Create the pass from scratch using constructor
    const pass = new PKPass(
      buffers,
      certificates,
      {
        passTypeIdentifier: appleCredentials.pass_type_id,
        teamIdentifier: appleCredentials.team_id,
        serialNumber: passData.serialNumber || generateSerialNumber(),
        organizationName: passData.organizationName || 'Apple Pass Scaler',
        description: passData.description || 'Wallet Pass',
      }
    );

    // CRITICAL: Add backFields using PKPass object methods
    // The library might not preserve backFields from pass.json buffer, so we add them directly
    // Clear any existing backFields first
    if (pass.backFields) {
      pass.backFields.length = 0;
    }
    
    // Add "Latest news" field with link support
    if (passData.latestNewsText || passData.latestNewsLink) {
      const latestNewsField: any = {
        key: 'latestNews',
        label: 'Latest news:',
        value: passData.latestNewsText || 'Unlock bonuses up to 2X your earnings! Find your new daily bonus here.',
      };
      
      if (passData.latestNewsLink) {
        latestNewsField.attributedValue = `<a href='${passData.latestNewsLink}'>${passData.latestNewsText || 'here'}</a>`;
      } else {
        latestNewsField.attributedValue = '<a href=\'https://example.com/latest-news\'>here</a>';
      }
      
      pass.backFields.push(latestNewsField);
    } else {
      // Default latest news field
      pass.backFields.push({
        key: 'latestNews',
        label: 'Latest news:',
        value: 'Unlock bonuses up to 2X your earnings! Find your new daily bonus for Tuesday here.',
        attributedValue: '<a href=\'https://example.com/latest-news\'>here</a>',
      });
    }
    
    // Add "Make more money" field with link
    pass.backFields.push({
      key: 'makeMoney',
      label: 'Make more money:',
      value: 'Make Money',
      attributedValue: passData.makeMoneyLink 
        ? `<a href='${passData.makeMoneyLink}'>Make Money</a>`
        : '<a href=\'https://example.com/make-money\'>Make Money</a>',
    });
    
    // Add "Redeem your cash" field with link
    pass.backFields.push({
      key: 'redeemCash',
      label: 'Redeem your cash:',
      value: 'Redeem Earnings',
      attributedValue: passData.redeemCashLink
        ? `<a href='${passData.redeemCashLink}'>Redeem Earnings</a>`
        : '<a href=\'https://example.com/redeem\'>Redeem Earnings</a>',
    });
    
    // Add "Share and earn" field with link
    pass.backFields.push({
      key: 'shareEarn',
      label: 'Share and earn:',
      value: 'Pass the Gravy',
      attributedValue: passData.shareEarnLink
        ? `<a href='${passData.shareEarnLink}'>Pass the Gravy</a>`
        : '<a href=\'https://example.com/share\'>Pass the Gravy</a>',
    });
    
    // Add "Last Update" field (the notification field) - CRITICAL for push notifications
    // This field MUST have changeMessage for notifications to work
    const notificationMessage = passData.notificationMessage || passData.broadcastMessage || 'Welcome! Check back for updates.';
    
    // CRITICAL: changeMessage must be a proper message format with %@ placeholder
    // The %@ will be replaced by iOS with the new field value when displaying the notification
    pass.backFields.push({
      key: 'lastUpdate',
      label: 'Last Update:',
      value: notificationMessage,
      changeMessage: 'New update: %@', // CRITICAL: Proper message format - %@ gets replaced with new value
    });
    
    // Add "Customer service" field with link
    pass.backFields.push({
      key: 'customerService',
      label: 'Customer service:',
      value: 'Get Help',
      attributedValue: passData.customerServiceLink
        ? `<a href='${passData.customerServiceLink}'>Get Help</a>`
        : '<a href=\'https://example.com/help\'>Get Help</a>',
    });
    
    console.log('[Pass Generation] BackFields added via PKPass object:', {
      backFieldsCount: pass.backFields.length,
      allBackFields: pass.backFields.map((f: any) => ({ key: f.key, label: f.label, hasAttributedValue: !!f.attributedValue, hasChangeMessage: !!f.changeMessage })),
    });

    // Populate fields from template and pass data
    // Note: We're now handling fields directly in pass.json structure above
    // This section is kept for backward compatibility with templates
    // Only use template fields if no custom fields were provided
    const hasCustomFields = passData.headerLabel || passData.secondaryLeftLabel || passData.secondaryRightLabel;
    if (templateData.fields && !hasCustomFields) {
      Object.entries(templateData.fields).forEach(([key, fieldConfig]: [string, any]) => {
        const value = passData[key] !== undefined ? passData[key] : fieldConfig.defaultValue;
        
        if (value !== undefined && value !== null) {
          // Add field to primaryFields (works for all pass types)
          pass.primaryFields.push({
            key,
            label: fieldConfig.label || key,
            value: String(value),
          });
        }
      });
    }

    // Add locations if provided
    if (passData.locations && Array.isArray(passData.locations)) {
      pass.setLocations(...passData.locations.map((loc: any) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude,
        relevantText: loc.relevantText,
      })));
    }

    // Add barcodes if provided
    if (passData.barcode) {
      if (typeof passData.barcode === 'string') {
        pass.setBarcodes(passData.barcode);
      } else {
        pass.setBarcodes({
          message: passData.barcode.message,
          format: passData.barcode.format || 'PKBarcodeFormatQR',
          messageEncoding: passData.barcode.messageEncoding || 'iso-8859-1',
        });
      }
    } else if (passData.serialNumber) {
      // Add a default barcode with serial number if no barcode provided
      pass.setBarcodes(passData.serialNumber);
    }

    // Generate the .pkpass buffer
    const buffer = pass.getAsBuffer();

    return buffer;
  } catch (error) {
    console.error('Error generating pass buffer:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.stack);
    }
    throw new Error(`Failed to generate pass: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Helper function to generate a serial number
 */
function generateSerialNumber(): string {
  return `PASS-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

