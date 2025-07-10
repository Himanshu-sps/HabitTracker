/**
 * Represents the user data stored in Firestore and used in the app.
 * Use this type throughout the app for user data.
 */
export interface UserDataType {
  id: string;
  name: string;
  email: string;
  // image?: string | null; // Uncomment if you add user images
}

/**
 * Standard response type for async operations.
 * Use this type throughout the app for API/service responses.
 */
export interface BaseResponseType<T = any> {
  success: boolean;
  data?: T;
  msg?: string;
}
