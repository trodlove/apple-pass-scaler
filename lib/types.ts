// Database table types
export type AppleAccountStatus = 'ACTIVE' | 'BURNED' | 'COOLDOWN';

export interface AppleDeveloperAccount {
  id: string;
  name: string;
  team_id: string;
  pass_type_id: string;
  apns_key_id: string;
  apns_auth_key: string;
  pass_signer_cert: string;
  pass_signer_key: string;
  wwdr_cert: string;
  status: AppleAccountStatus;
  last_used_at: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface PassTemplate {
  id: string;
  name: string;
  pass_style: string;
  fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Pass {
  id: string;
  serial_number: string;
  authentication_token: string;
  template_id: string | null;
  apple_account_id: string | null;
  pass_data: Record<string, any> | null;
  revenue: number;
  created_at: string;
  last_updated_at: string;
}

export interface Device {
  id: string;
  device_library_identifier: string;
  push_token: string;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  pass_id: string;
  device_id: string;
  created_at: string;
}

export interface Sequence {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_number: number;
  delay_hours: number;
  message_template: string;
  created_at: string;
  updated_at: string;
}

export interface SequenceEnrollment {
  id: string;
  pass_id: string;
  sequence_id: string;
  current_step: number;
  next_execution_at: string;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  created_at: string;
  updated_at: string;
}

// API request/response types
export interface IssuePassRequest {
  click_id?: string;
  redirect_url?: string;
  [key: string]: any; // For utm_* and other tracking params
}

export interface PostbackRequest {
  click_id: string;
  revenue: number;
}

export interface BroadcastRequest {
  message: string;
}

// Apple credentials type for internal use
export interface AppleCredentials {
  team_id: string;
  pass_type_id: string;
  apns_key_id: string;
  apns_auth_key: string;
  pass_signer_cert: string;
  pass_signer_key: string;
  wwdr_cert: string;
}

// Pass generation types
export interface PassData {
  [key: string]: any;
}

export interface TemplateData {
  pass_style: string;
  fields: Record<string, any>;
}

