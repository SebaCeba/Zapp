import crypto from 'crypto';

const PREFIX = 'enc:v1:';

function getKey(): Buffer | null {
  const secret = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    return null;
  }

  return crypto.createHash('sha256').update(secret).digest();
}

export function encryptToken(token: string): string {
  const key = getKey();
  if (!key) {
    return token;
  }

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [
    PREFIX.slice(0, -1),
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url')
  ].join(':');
}

export function decryptToken(value: string): string {
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const key = getKey();
  if (!key) {
    throw new Error('GOOGLE_TOKEN_ENCRYPTION_KEY is required to read encrypted Google tokens');
  }

  const [, , ivText, authTagText, encryptedText] = value.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(authTagText, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedText, 'base64url')),
    decipher.final()
  ]).toString('utf8');
}
