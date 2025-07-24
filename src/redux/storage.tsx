import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Params to save value in async storage
 * @param key
 * @param value
 */
export async function setItem(key: string, value: string) {
  await AsyncStorage.setItem(key, value);
}

/**
 * Params to fetch value from async storage
 * @param key
 */
export async function getItem(key: string) {
  const val = await AsyncStorage.getItem(key);
  try {
    if (val !== null || val !== '') {
      return val;
    } else {
      return false;
    }
  } catch (error) {}
}

/**
 * Params used to remove data from async storage
 * @param key
 */
export async function removeData(key: string) {
  try {
    await AsyncStorage.removeItem(key);
    return true;
  } catch (exception) {
    return false;
  }
}

/**
 * Params used to remove multiple keys from async storage
 * @param keys
 */
export async function multiRemove(keys: Array<any>) {
  try {
    AsyncStorage.multiRemove(keys);
    return true;
  } catch (exception) {
    return false;
  }
}
