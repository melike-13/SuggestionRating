import { sign, verify } from 'jsonwebtoken';

// Token süreleri ve secret key
const JWT_SECRET = process.env.JWT_SECRET || 'kaizen-suggestion-system-secret-key';
const TOKEN_EXPIRY = '24h';

// Session veri yapısı
export interface SessionData {
  userId: number;
  exp?: number;
  iat?: number;
}

// JWT token oluşturma fonksiyonu
export async function generateSessionToken(userId: number): Promise<string> {
  return new Promise((resolve, reject) => {
    sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY }, (err, token) => {
      if (err) return reject(err);
      resolve(token as string);
    });
  });
}

// JWT token doğrulama fonksiyonu
export async function verifySessionToken(token: string): Promise<SessionData> {
  return new Promise((resolve, reject) => {
    verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded as SessionData);
    });
  });
}