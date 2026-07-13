const ITERATIONS = 100000;

/**
 * Encrypts a text payload using AES-GCM derived from a user passphrase using PBKDF2.
 * Output includes salt + IV + ciphertext combined into a single base64 string.
 * Runs 100% on-device inside client memory.
 */
export async function encryptData(data: string, passphrase: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  
  // Import the raw passphrase text
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive the 256-bit AES-GCM key
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Generate a random 12-byte initialization vector
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt the encoded data string
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    aesKey,
    encoder.encode(data)
  );
  
  // Combine salt (16 bytes) + IV (12 bytes) + ciphertext into a single byte array
  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);
  
  // Convert byte array to standard base64 string
  let binary = '';
  const len = combined.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(combined[i]);
  }
  return btoa(binary);
}

/**
 * Decrypts a base64 string derived from encryptData using the correct user passphrase.
 * Throws an error if the passphrase is incorrect or the payload is corrupted.
 */
export async function decryptData(encryptedBase64: string, passphrase: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  // Convert base64 back to byte array
  const binaryString = atob(encryptedBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  if (bytes.length < 28) {
    throw new Error('Payload is too short to be valid ciphertext');
  }
  
  // Extract components
  const salt = bytes.slice(0, 16);
  const iv = bytes.slice(16, 28);
  const ciphertext = bytes.slice(28);
  
  // Import passphrase
  const rawKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive key using PBKDF2
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  
  try {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      aesKey,
      ciphertext
    );
    return decoder.decode(decrypted);
  } catch (err) {
    throw new Error('Incorrect passphrase or corrupted data');
  }
}
