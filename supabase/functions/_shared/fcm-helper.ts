// FCM Helper - Shared utility for sending Firebase Cloud Messaging notifications

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  sound?: string;
  tag?: string;
  color?: string;
}

interface FCMMessage {
  token: string;
  notification: NotificationPayload;
  data?: Record<string, string>;
  android?: {
    priority?: 'high' | 'normal';
    ttl?: number;
  };
}

export async function sendFCMNotification(
  fcmToken: string,
  notification: NotificationPayload,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    const projectId = Deno.env.get('FIREBASE_PROJECT_ID');
    const privateKey = Deno.env.get('FIREBASE_PRIVATE_KEY');
    const clientEmail = Deno.env.get('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
      console.error('Firebase credentials not configured');
      return false;
    }

    // Get access token
    const accessToken = await getFirebaseAccessToken(privateKey, clientEmail);

    // Build FCM message
    const message: FCMMessage = {
      token: fcmToken,
      notification: {
        ...notification,
        icon: notification.icon || 'ic_launcher',
        sound: notification.sound || 'default',
        color: notification.color || '#58CC02',
      },
      data: data || {},
      android: {
        priority: 'high',
        ttl: 86400, // 24 hours
      },
    };

    // Send to FCM
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('FCM error:', error);
      return false;
    }

    console.log('✅ Notification sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    return false;
  }
}

async function getFirebaseAccessToken(
  privateKey: string,
  clientEmail: string
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + expiresIn,
    iat: now,
  };

  // Create JWT (simplified - in production use proper JWT library)
  const headerEncoded = btoa(JSON.stringify(header));
  const payloadEncoded = btoa(JSON.stringify(payload));
  const signatureInput = `${headerEncoded}.${payloadEncoded}`;

  // Sign with private key (this is simplified - use crypto library in production)
  const key = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signatureInput)
  );

  const signatureEncoded = btoa(String.fromCharCode(...new Uint8Array(signature)));
  const jwt = `${signatureInput}.${signatureEncoded}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await response.json();
  return data.access_token;
}

export async function sendBatchNotifications(
  fcmTokens: string[],
  notification: NotificationPayload,
  data?: Record<string, string>
): Promise<number> {
  let successCount = 0;

  for (const token of fcmTokens) {
    const success = await sendFCMNotification(token, notification, data);
    if (success) successCount++;
  }

  return successCount;
}
