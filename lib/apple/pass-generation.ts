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

    // Add logoText if provided
    if (passData.logoText) {
      passJson.logoText = passData.logoText;
    }

    // Set pass type based on style
    if (passStyle === 'coupon') {
      passJson.coupon = {};
    } else if (passStyle === 'loyalty') {
      passJson.storeCard = {};
    } else if (passStyle === 'boardingPass') {
      passJson.boardingPass = {};
    } else if (passStyle === 'eventTicket') {
      passJson.eventTicket = {};
    } else {
      passJson.generic = {};
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

    // Create a minimal icon (1x1 transparent PNG) - required by Apple
    // This is a minimal valid PNG
    const minimalIcon = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // Create buffers object for passkit-generator
    const buffers: Record<string, Buffer> = {
      'pass.json': Buffer.from(JSON.stringify(passJson, null, 2)),
      'icon.png': minimalIcon,
      'icon@2x.png': minimalIcon, // 2x version
    };

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

    // Populate fields from template and pass data
    if (templateData.fields) {
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

