import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../server/storage';
import { hash, compare } from 'bcryptjs';
import { z } from 'zod';
import { 
  SUGGESTION_STATUSES, 
  insertSuggestionSchema, 
  insertUserSchema, 
  insertRewardSchema,
  extendedInsertSuggestionSchema
} from '../shared/schema';
import { 
  sendNewSuggestionNotification, 
  sendStatusChangeNotification,
  sendRewardNotification
} from '../server/notifications';
import { generateSessionToken, verifySessionToken, SessionData } from '../api/auth/session';

// Yanıt tipleri
type ResponseData = {
  message?: string;
  data?: any;
  error?: string;
};

// Session tipini genişlet
declare module 'next' {
  interface NextApiRequest {
    session?: SessionData;
  }
}

// Oturum kontrolü middleware
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  callback: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  const token = req.cookies['auth_token'] || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
  }

  try {
    const session = await verifySessionToken(token);
    req.session = session;
    return callback(req, res);
  } catch (error) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş oturum' });
  }
}

// Rol kontrolü middleware
export function withRole(
  roles: string[],
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    if (!req.session) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    const user = await storage.getUser(req.session.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor' });
    }

    return handler(req, res);
  };
}

// API isteklerini işleme
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  const { method, url } = req;

  try {
    // URL path'ini analiz et
    const path = url?.split('?')[0] || '';
    
    // Auth endpointleri
    if (path === '/api/auth/login') {
      if (method === 'POST') {
        return handleLogin(req, res);
      }
    } 
    else if (path === '/api/auth/logout') {
      if (method === 'POST') {
        return handleLogout(req, res);
      }
    } 
    else if (path === '/api/auth/user') {
      return await withAuth(req, res, async (req, res) => {
        return handleGetCurrentUser(req, res);
      });
    }
    
    // Suggestions endpointleri
    else if (path === '/api/suggestions') {
      if (method === 'GET') {
        return await withAuth(req, res, async (req, res) => {
          return handleGetSuggestions(req, res);
        });
      } 
      else if (method === 'POST') {
        return await withAuth(req, res, async (req, res) => {
          return handleCreateSuggestion(req, res);
        });
      }
    } 
    else if (path.match(/^\/api\/suggestions\/\d+$/)) {
      const id = parseInt(path.split('/').pop() || '0');
      
      if (method === 'GET') {
        return await withAuth(req, res, async (req, res) => {
          return handleGetSuggestion(req, res, id);
        });
      } 
      else if (method === 'PATCH') {
        return await withAuth(req, res, async (req, res) => {
          return handleUpdateSuggestion(req, res, id);
        });
      }
    } 
    else if (path === '/api/suggestions/user') {
      return await withAuth(req, res, async (req, res) => {
        return handleGetUserSuggestions(req, res);
      });
    }
    
    // Stats endpointleri
    else if (path === '/api/stats/suggestions') {
      return await withAuth(req, res, async (req, res) => {
        return handleGetSuggestionStats(req, res);
      });
    } 
    else if (path === '/api/stats/top-contributors') {
      return await withAuth(req, res, async (req, res) => {
        return handleGetTopContributors(req, res);
      });
    }
    
    // Eşleşme bulunamadı
    return res.status(404).json({ error: 'API endpoint bulunamadı' });
  } catch (error: any) {
    console.error('API hatası:', error);
    return res.status(500).json({ error: `Sunucu hatası: ${error.message}` });
  }
}

// Auth işleyicileri
async function handleLogin(req: NextApiRequest, res: NextApiResponse) {
  const { employeeId } = req.body;
  
  if (!employeeId) {
    return res.status(400).json({ error: 'Personel ID gereklidir' });
  }

  try {
    // Personel ID ile kullanıcıyı bul
    const user = await storage.getUserByUsername(employeeId);
    
    if (!user) {
      return res.status(401).json({ error: 'Geçersiz personel ID' });
    }
    
    // Token oluştur
    const token = await generateSessionToken(user.id);
    
    // Tokeni cookie olarak ayarla
    res.setHeader('Set-Cookie', `auth_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`);
    
    // Kullanıcı bilgilerini döndür (şifre hariç)
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json({ data: userWithoutPassword });
  } catch (error: any) {
    console.error('Giriş hatası:', error);
    return res.status(500).json({ error: `Giriş işlemi sırasında hata: ${error.message}` });
  }
}

async function handleLogout(req: NextApiRequest, res: NextApiResponse) {
  // Cookie'yi temizle
  res.setHeader('Set-Cookie', 'auth_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0');
  return res.status(200).json({ message: 'Başarıyla çıkış yapıldı' });
}

async function handleGetCurrentUser(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Oturum bulunamadı' });
    }
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Şifreyi hariç tut
    const { password, ...userWithoutPassword } = user;
    return res.status(200).json({ data: userWithoutPassword });
  } catch (error: any) {
    return res.status(500).json({ error: `Kullanıcı bilgileri alınamadı: ${error.message}` });
  }
}

// Suggestion işleyicileri
async function handleGetSuggestions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const status = req.query.status as string;
    
    let suggestions;
    if (status) {
      suggestions = await storage.listSuggestionsByStatus(status);
    } else {
      suggestions = await storage.listSuggestions();
    }
    
    return res.status(200).json({ data: suggestions });
  } catch (error: any) {
    return res.status(500).json({ error: `Öneriler alınamadı: ${error.message}` });
  }
}

async function handleCreateSuggestion(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Formdaki verileri doğrula
    const validatedData = extendedInsertSuggestionSchema.parse(req.body);
    
    // Kullanıcı kontrolü
    const user = await storage.getUser(req.session!.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Öneri oluştur
    const suggestion = await storage.createSuggestion({
      ...validatedData,
      createdById: user.id,
      status: SUGGESTION_STATUSES.NEW,
      createdAt: new Date()
    });
    
    // Bildirim gönder
    await sendNewSuggestionNotification(suggestion);
    
    return res.status(201).json({ 
      message: 'Öneri başarıyla oluşturuldu', 
      data: suggestion 
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: `Geçersiz veri: ${error.message}` });
    }
    return res.status(500).json({ error: `Öneri oluşturulamadı: ${error.message}` });
  }
}

async function handleGetSuggestion(req: NextApiRequest, res: NextApiResponse, id: number) {
  try {
    const suggestion = await storage.getSuggestion(id);
    
    if (!suggestion) {
      return res.status(404).json({ error: 'Öneri bulunamadı' });
    }
    
    // Ödül bilgilerini de getir
    const rewards = await storage.listRewardsBySuggestion(id);
    
    return res.status(200).json({ 
      data: {
        ...suggestion,
        rewards 
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Öneri alınamadı: ${error.message}` });
  }
}

async function handleUpdateSuggestion(req: NextApiRequest, res: NextApiResponse, id: number) {
  try {
    // Öneriyi kontrol et
    const existingSuggestion = await storage.getSuggestion(id);
    if (!existingSuggestion) {
      return res.status(404).json({ error: 'Öneri bulunamadı' });
    }
    
    // Kullanıcı ve rol kontrolü
    const user = await storage.getUser(req.session!.userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    // Sadece yönetici ve yönetici rolündeki kullanıcılar güncelleme yapabilir
    if (user.role !== 'admin' && user.role !== 'manager' && existingSuggestion.createdById !== user.id) {
      return res.status(403).json({ error: 'Bu öneriyi güncelleme yetkiniz yok' });
    }
    
    // Durum değişikliği takibi
    const previousStatus = existingSuggestion.status;
    
    // Güncellenmiş öneriyi kaydet
    const updatedSuggestion = await storage.updateSuggestion(id, req.body);
    
    // Durum değişikliği olduysa bildirim gönder
    if (updatedSuggestion && previousStatus !== updatedSuggestion.status) {
      await sendStatusChangeNotification(updatedSuggestion, previousStatus, user);
    }
    
    // Ödül bilgisi varsa ekle
    if (req.body.reward) {
      const reward = await storage.createReward({
        suggestionId: id,
        userId: req.body.reward.userId || updatedSuggestion!.createdById,
        amount: req.body.reward.amount,
        type: req.body.reward.type,
        createdAt: new Date()
      });
      
      // Ödül bildirimi gönder
      await sendRewardNotification(id, reward.userId, reward.amount, reward.type);
    }
    
    return res.status(200).json({ 
      message: 'Öneri başarıyla güncellendi', 
      data: updatedSuggestion 
    });
  } catch (error: any) {
    return res.status(500).json({ error: `Öneri güncellenemedi: ${error.message}` });
  }
}

async function handleGetUserSuggestions(req: NextApiRequest, res: NextApiResponse) {
  try {
    const userId = req.session!.userId;
    
    const suggestions = await storage.listSuggestionsByUser(userId);
    
    return res.status(200).json({ data: suggestions });
  } catch (error: any) {
    return res.status(500).json({ error: `Kullanıcı önerileri alınamadı: ${error.message}` });
  }
}

// İstatistik işleyicileri
async function handleGetSuggestionStats(req: NextApiRequest, res: NextApiResponse) {
  try {
    const stats = await storage.getSuggestionStats();
    
    return res.status(200).json({ data: stats });
  } catch (error: any) {
    return res.status(500).json({ error: `İstatistikler alınamadı: ${error.message}` });
  }
}

async function handleGetTopContributors(req: NextApiRequest, res: NextApiResponse) {
  try {
    const limit = parseInt(req.query.limit as string || '5');
    
    const contributors = await storage.getTopContributors(limit);
    
    // Kullanıcı bilgilerini ekle
    const contributorsWithDetails = await Promise.all(
      contributors.map(async (item) => {
        const user = await storage.getUser(item.userId);
        return {
          ...item,
          username: user?.username || 'Bilinmeyen',
          fullName: user?.fullName || 'Bilinmeyen Kullanıcı',
          department: user?.department || 'Bilinmeyen'
        };
      })
    );
    
    return res.status(200).json({ data: contributorsWithDetails });
  } catch (error: any) {
    return res.status(500).json({ error: `En iyi katkıda bulunanlar alınamadı: ${error.message}` });
  }
}