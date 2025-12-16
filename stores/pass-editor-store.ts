import { create } from 'zustand';

interface PassEditorState {
  // Step 1: Images
  logo_1x_url: string;
  logo_2x_url: string;
  logo_3x_url: string;
  icon_1x_url: string;
  icon_2x_url: string;
  icon_3x_url: string;
  strip_1x_url: string;
  strip_2x_url: string;
  strip_3x_url: string;
  
  // Step 2: Configuration
  organizationName: string;
  description: string;
  logoText: string;
  headerLabel: string;
  headerValue: string;
  primaryLabel: string;
  primaryValue: string;
  backgroundColor: string;
  foregroundColor: string;
  labelColor: string;
  
  // Step 3: Content
  secondaryLeftLabel: string;
  secondaryLeftValue: string;
  secondaryRightLabel: string;
  secondaryRightValue: string;
  websiteUrl: string;
  
  // Step 4: Back Fields
  latestNewsText: string;
  latestNewsLink: string;
  makeMoneyLink: string;
  redeemCashLink: string;
  shareEarnLink: string;
  notificationMessage: string;
  customerServiceLink: string;
  
  // Barcode
  barcodeMessage: string;
  
  // Actions
  setPassProperty: <K extends keyof PassEditorState>(key: K, value: PassEditorState[K]) => void;
  resetStore: () => void;
  loadFromPassData: (passData: any) => void;
}

const initialState = {
  // Images
  logo_1x_url: '',
  logo_2x_url: '',
  logo_3x_url: '',
  icon_1x_url: '',
  icon_2x_url: '',
  icon_3x_url: '',
  strip_1x_url: '',
  strip_2x_url: '',
  strip_3x_url: '',
  
  // Configuration
  organizationName: '',
  description: '',
  logoText: '',
  headerLabel: '',
  headerValue: '',
  primaryLabel: '',
  primaryValue: '',
  backgroundColor: '#000000',
  foregroundColor: '#FFFFFF',
  labelColor: '#CCCCCC',
  
  // Content
  secondaryLeftLabel: '',
  secondaryLeftValue: '',
  secondaryRightLabel: '',
  secondaryRightValue: '',
  websiteUrl: '',
  
  // Back Fields
  latestNewsText: '',
  latestNewsLink: '',
  makeMoneyLink: '',
  redeemCashLink: '',
  shareEarnLink: '',
  notificationMessage: '',
  customerServiceLink: '',
  
  // Barcode
  barcodeMessage: '',
};

export const usePassEditorStore = create<PassEditorState>((set) => ({
  ...initialState,
  
  setPassProperty: (key, value) => set({ [key]: value }),
  
  resetStore: () => set(initialState),
  
  loadFromPassData: (passData: any) => {
    set({
      // Images - handle both old format (single URL) and new format (multiple URLs)
      logo_1x_url: passData.logo_1x_url || passData.logo || '',
      logo_2x_url: passData.logo_2x_url || passData.logo || '',
      logo_3x_url: passData.logo_3x_url || passData.logo || '',
      icon_1x_url: passData.icon_1x_url || passData.icon || '',
      icon_2x_url: passData.icon_2x_url || passData.icon || '',
      icon_3x_url: passData.icon_3x_url || passData.icon || '',
      strip_1x_url: passData.strip_1x_url || passData.stripImage || '',
      strip_2x_url: passData.strip_2x_url || passData.stripImage || '',
      strip_3x_url: passData.strip_3x_url || passData.stripImage || '',
      
      // Configuration
      organizationName: passData.organizationName || '',
      description: passData.description || '',
      logoText: passData.logoText || '',
      headerLabel: passData.headerLabel || '',
      headerValue: passData.headerValue || '',
      primaryLabel: passData.primaryLabel || 'WELCOME',
      primaryValue: passData.primaryValue || passData.organizationName || '',
      backgroundColor: passData.backgroundColor || '#000000',
      foregroundColor: passData.foregroundColor || '#FFFFFF',
      labelColor: passData.labelColor || '#CCCCCC',
      
      // Content
      secondaryLeftLabel: passData.secondaryLeftLabel || '',
      secondaryLeftValue: passData.secondaryLeftValue || '',
      secondaryRightLabel: passData.secondaryRightLabel || '',
      secondaryRightValue: passData.secondaryRightValue || '',
      websiteUrl: passData.websiteUrl || '',
      
      // Back Fields
      latestNewsText: passData.latestNewsText || '',
      latestNewsLink: passData.latestNewsLink || '',
      makeMoneyLink: passData.makeMoneyLink || '',
      redeemCashLink: passData.redeemCashLink || '',
      shareEarnLink: passData.shareEarnLink || '',
      notificationMessage: passData.notificationMessage || '',
      customerServiceLink: passData.customerServiceLink || '',
      
      // Barcode
      barcodeMessage: passData.barcodeMessage || passData.serialNumber || '',
    });
  },
}));

