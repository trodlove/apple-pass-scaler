declare module 'node-pushnotifications' {
  interface Settings {
    apn?: {
      token?: {
        key: Buffer | string;
        keyId: string;
        teamId: string;
      };
      production?: boolean;
    };
  }

  interface NotificationData {
    topic?: string;
    priority?: number;
    pushType?: string;
    contentAvailable?: number;
    sound?: string;
    badge?: number;
    [key: string]: any;
  }

  interface NotificationResult {
    success: boolean;
    message?: string;
    [key: string]: any;
  }

  class PushNotifications {
    constructor(settings: Settings);
    send(deviceTokens: string[], data: NotificationData): Promise<NotificationResult[]>;
  }

  export default PushNotifications;
}

