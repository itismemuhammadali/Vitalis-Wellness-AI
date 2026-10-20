/**
 * In-App Purchase Service
 * 
 * This service is ready for integration with react-native-iap.
 * Once you have access to Apple and Google developer accounts:
 * 
 * 1. Install: npm install react-native-iap
 * 2. Configure products in App Store Connect and Google Play Console:
 *    - Basic: com.kyvo.basic.monthly ($9.99/month)
 *    - Premium: com.kyvo.premium.monthly ($19.99/month)
 * 3. Uncomment the imports and implementation below
 * 4. Test with sandbox accounts
 */

// import * as RNIap from 'react-native-iap';
// import { Platform } from 'react-native';

export const PRODUCT_IDS = {
  basic: Platform.select({
    ios: "com.kyvo.basic.monthly",
    android: "com.kyvo.basic.monthly",
  }) as string,
  premium: Platform.select({
    ios: "com.kyvo.premium.monthly",
    android: "com.kyvo.premium.monthly",
  }) as string,
};

export interface PurchaseResult {
  success: boolean;
  transactionId?: string;
  platform?: "ios" | "android";
  error?: string;
}

/**
 * Initialize IAP connection
 * Uncomment when react-native-iap is installed
 */
export async function initializeIAP(): Promise<boolean> {
  try {
    // await RNIap.initConnection();
    // console.log('✅ IAP connection initialized');
    // return true;
    
    console.log("⚠️ IAP not configured yet - using mock mode");
    return true;
  } catch (error) {
    console.error("Error initializing IAP:", error);
    return false;
  }
}

/**
 * Get available products
 * Uncomment when react-native-iap is installed
 */
export async function getProducts() {
  try {
    // const products = await RNIap.getSubscriptions({
    //   skus: [PRODUCT_IDS.basic, PRODUCT_IDS.premium],
    // });
    // console.log('✅ Products loaded:', products);
    // return products;
    
    console.log("⚠️ IAP not configured - returning mock products");
    return [
      {
        productId: PRODUCT_IDS.basic,
        title: "Basic Plan",
        description: "1,000 messages per day",
        price: "$9.99",
        currency: "USD",
      },
      {
        productId: PRODUCT_IDS.premium,
        title: "Premium Plan",
        description: "Unlimited messages",
        price: "$19.99",
        currency: "USD",
      },
    ];
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

/**
 * Purchase a subscription
 * Uncomment when react-native-iap is installed
 */
export async function purchaseSubscription(
  tier: "basic" | "premium"
): Promise<PurchaseResult> {
  try {
    const productId = PRODUCT_IDS[tier];

    // Real implementation (uncomment when ready):
    // const purchase = await RNIap.requestSubscription({
    //   sku: productId,
    // });
    //
    // if (purchase) {
    //   // Verify purchase with your backend
    //   const transactionId = purchase.transactionId || purchase.purchaseToken;
    //   
    //   // Finish the transaction
    //   if (Platform.OS === 'ios') {
    //     await RNIap.finishTransaction({ purchase, isConsumable: false });
    //   } else {
    //     await RNIap.acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
    //   }
    //
    //   return {
    //     success: true,
    //     transactionId,
    //     platform: Platform.OS as 'ios' | 'android',
    //   };
    // }

    // Mock implementation for development
    console.log(`⚠️ Mock purchase: ${tier} plan`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate network delay

    return {
      success: true,
      transactionId: `mock_${Date.now()}_${tier}`,
      platform: Platform.OS as "ios" | "android",
    };
  } catch (error: any) {
    console.error("Purchase error:", error);
    
    // Handle user cancellation
    if (error.code === "E_USER_CANCELLED") {
      return {
        success: false,
        error: "Purchase cancelled",
      };
    }

    return {
      success: false,
      error: error.message || "Purchase failed",
    };
  }
}

/**
 * Restore purchases
 * Uncomment when react-native-iap is installed
 */
export async function restorePurchases(): Promise<PurchaseResult[]> {
  try {
    // const purchases = await RNIap.getAvailablePurchases();
    // console.log('✅ Purchases restored:', purchases);
    // return purchases.map(p => ({
    //   success: true,
    //   transactionId: p.transactionId || p.purchaseToken,
    //   platform: Platform.OS as 'ios' | 'android',
    // }));

    console.log("⚠️ Mock restore purchases");
    return [];
  } catch (error) {
    console.error("Error restoring purchases:", error);
    return [];
  }
}

/**
 * End IAP connection
 * Uncomment when react-native-iap is installed
 */
export async function endIAP(): Promise<void> {
  try {
    // await RNIap.endConnection();
    // console.log('✅ IAP connection ended');
  } catch (error) {
    console.error("Error ending IAP:", error);
  }
}

// Platform-specific imports
import { Platform } from "react-native";
