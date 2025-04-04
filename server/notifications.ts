import { Suggestion, User } from "@shared/schema";
import { storage } from "./storage";
import { log } from "./vite";

// E-posta bildirim fonksiyonları

// E-posta türleri
export enum EmailType {
  SUGGESTION_CREATED = "SUGGESTION_CREATED",
  STATUS_CHANGED = "STATUS_CHANGED",
  DEPARTMENT_REVIEW_NEEDED = "DEPARTMENT_REVIEW_NEEDED",
  FEASIBILITY_ASSESSMENT_NEEDED = "FEASIBILITY_ASSESSMENT_NEEDED",
  SOLUTION_NEEDED = "SOLUTION_NEEDED", 
  COST_ASSESSMENT_NEEDED = "COST_ASSESSMENT_NEEDED",
  EXECUTIVE_REVIEW_NEEDED = "EXECUTIVE_REVIEW_NEEDED",
  SUGGESTION_APPROVED = "SUGGESTION_APPROVED",
  SUGGESTION_REJECTED = "SUGGESTION_REJECTED",
  IMPLEMENTATION_STARTED = "IMPLEMENTATION_STARTED",
  IMPLEMENTATION_COMPLETED = "IMPLEMENTATION_COMPLETED",
  EVALUATION_NEEDED = "EVALUATION_NEEDED",
  REWARD_ASSIGNED = "REWARD_ASSIGNED",
}

/**
 * E-posta bildirimlerini göndermek için fonksiyon
 * API anahtarı olmadığı için şu anda sadece konsola yazıyor
 */
export async function sendEmail(to: string, subject: string, body: string, fromName: string = "Kaizen Sistem"): Promise<boolean> {
  try {
    // SendGrid API anahtarı olmadığı için gerçek e-posta gönderemiyoruz.
    // Bunun yerine konsola yazalım ve başarılı kabul edelim
    
    log(`[EMAIL] To: ${to}`, "notifications");
    log(`[EMAIL] Subject: ${subject}`, "notifications");
    log(`[EMAIL] Body: ${body}`, "notifications");
    log(`[EMAIL] From: ${fromName}`, "notifications");
    
    // Burada normalde e-posta gönderme kodları olacaktı
    // SENDGRID_API_KEY olduğunda burası aktif edilebilir
    
    return true;
  } catch (error) {
    console.error("E-posta gönderirken hata oluştu:", error);
    return false;
  }
}

/**
 * Belirli role sahip tüm kullanıcılara e-posta göndermek için yardımcı fonksiyon
 */
export async function sendEmailToUsersWithRole(role: string, subject: string, body: string): Promise<void> {
  try {
    const users = await storage.listUsers();
    const usersWithRole = users.filter(user => user.role === role);
    
    for (const user of usersWithRole) {
      if (user.email) {
        await sendEmail(user.email, subject, body);
      }
    }
  } catch (error) {
    console.error("Rolle ilgili kullanıcılara e-posta gönderirken hata:", error);
  }
}

/**
 * Durum değişikliği bildirimi
 */
export async function sendStatusChangeNotification(suggestion: Suggestion, previousStatus: string, user?: User): Promise<void> {
  try {
    // Öneri sahibine bildirim gönder
    const suggestionOwner = await storage.getUser(suggestion.submittedBy);
    
    if (suggestionOwner?.email) {
      const subject = `Kaizen Önerinizin Durumu Değişti: ${previousStatus} -> ${suggestion.status}`;
      const body = `
        Değerli ${suggestionOwner.displayName || suggestionOwner.username},
        
        "${suggestion.title}" başlıklı Kaizen önerinizin durumu değişmiştir.
        
        Önceki durum: ${previousStatus}
        Yeni durum: ${suggestion.status}
        
        Detayları görmek için sisteme giriş yapabilirsiniz.
        
        Saygılarımızla,
        Kaizen Sistemi
      `;
      
      await sendEmail(suggestionOwner.email, subject, body);
    }
    
    // Yeni duruma göre ilgili kişilere bildirim gönder
    switch (suggestion.status) {
      case "department_review":
        // Bölüm müdürlerine bildirim gönder
        await sendEmailToUsersWithRole("manager", 
          "Yeni Bir Kaizen Önerisi İnceleme Bekliyor",
          `"${suggestion.title}" başlıklı yeni bir Kaizen önerisi bölüm incelemesi bekliyor.`
        );
        break;
      
      case "feasibility_assessment":
        // Mühendislere bildirim gönder
        await sendEmailToUsersWithRole("manager", 
          "Yapılabilirlik Değerlendirmesi Bekleyen Öneri",
          `"${suggestion.title}" başlıklı Kaizen önerisi için yapılabilirlik değerlendirmesi yapmanız gerekmektedir.`
        );
        break;
      
      case "executive_review":
        // Genel müdüre bildirim gönder
        await sendEmailToUsersWithRole("executive", 
          "Genel Müdür Onayı Bekleyen Kaizen Önerisi",
          `"${suggestion.title}" başlıklı Kaizen önerisi genel müdür onayı beklemektedir.`
        );
        break;
      
      case "approved":
        // Tüm yöneticilere bildirim gönder
        await sendEmailToUsersWithRole("manager", 
          "Onaylanan Kaizen Önerisi",
          `"${suggestion.title}" başlıklı Kaizen önerisi onaylanmıştır.`
        );
        await sendEmailToUsersWithRole("executive", 
          "Onaylanan Kaizen Önerisi",
          `"${suggestion.title}" başlıklı Kaizen önerisi onaylanmıştır.`
        );
        break;
        
      case "rejected":
        // Bildirim gönderildi, başka bir şey yapmaya gerek yok
        break;
    }
  } catch (error) {
    console.error("Durum değişikliği bildirimi gönderilirken hata:", error);
  }
}

/**
 * Yeni öneri oluşturulduğunda bildirim
 */
export async function sendNewSuggestionNotification(suggestion: Suggestion): Promise<void> {
  try {
    const suggestionOwner = await storage.getUser(suggestion.submittedBy);
    
    // Yöneticilere bildirim gönder
    await sendEmailToUsersWithRole("manager", 
      "Yeni Kaizen Önerisi Oluşturuldu",
      `${suggestionOwner?.displayName || suggestionOwner?.username} tarafından "${suggestion.title}" başlıklı yeni bir Kaizen önerisi oluşturuldu.`
    );
    
  } catch (error) {
    console.error("Yeni öneri bildirimi gönderilirken hata:", error);
  }
}

/**
 * Ödül verildiğinde bildirim
 */
export async function sendRewardNotification(suggestionId: number, userId: number, amount: string, type: string): Promise<void> {
  try {
    const user = await storage.getUser(userId);
    const suggestion = await storage.getSuggestion(suggestionId);
    
    if (!user || !suggestion || !user.email) return;
    
    const subject = "Kaizen Öneriniz İçin Ödül Kazandınız!";
    const body = `
      Değerli ${user.displayName || user.username},
      
      "${suggestion.title}" başlıklı Kaizen öneriniz için ${amount} ${type} ödülü kazandınız.
      
      Tebrikler! Katkılarınız için teşekkür ederiz.
      
      Saygılarımızla,
      Kaizen Sistemi
    `;
    
    await sendEmail(user.email, subject, body);
    
  } catch (error) {
    console.error("Ödül bildirimi gönderilirken hata:", error);
  }
}