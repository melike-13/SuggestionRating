# Vercel Dağıtım Kılavuzu

Bu belge, Kaizen/Kıvılcım Öneri Sistemi uygulamasını Vercel'de dağıtmak için gereken adımları açıklar.

## Ön Koşullar

1. Bir GitHub hesabı
2. Bir Vercel hesabı
3. Bir Supabase hesabı (ücretsiz veya ücretli plan)

## 1. Supabase Kurulumu

1. [Supabase](https://supabase.com/) hesabınıza giriş yapın
2. Yeni bir proje oluşturun
3. Proje oluşturulduğunda, aşağıdaki bilgileri not edin:
   - Supabase URL (`https://your-project-id.supabase.co`)
   - Supabase Anon Key (`eyJ...`)
   - Database Connection String (`postgresql://postgres:...`)

## 2. Vercel Projesi Kurulumu

1. [Vercel](https://vercel.com/) hesabınıza giriş yapın
2. "Add New Project" (Yeni Proje Ekle) butonuna tıklayın
3. GitHub reponuzu seçin veya içe aktarın
4. Temel yapılandırma ayarlarını yapın:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: dist

## 3. Vercel Çevre Değişkenleri

"Environment Variables" bölümüne aşağıdaki çevre değişkenlerini ekleyin:

```
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@your-project-id.supabase.co:5432/postgres
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-jwt-secret  # Güvenli bir rastgele anahtar
SESSION_SECRET=your-session-secret  # Güvenli bir rastgele anahtar
```

> **ÖNEMLİ**: `JWT_SECRET` ve `SESSION_SECRET` için güvenli, rastgele dizeler kullanın. Asla gerçek projelerde repo'ya kayıtlı değerlerle üretim ortamında çalışmayın.

## 4. İlk Dağıtım

1. "Deploy" butonuna tıklayın
2. Dağıtım tamamlandığında, projenizin URL'sine gidebilirsiniz

## 5. Veritabanı Şeması Oluşturma

Vercel Functions, ilk kez çağrıldığında "cold start" yaşar ve Drizzle ORM'den gelen `db.schema.sync()` işlemi gerçekleşir. Bu, gerekli tüm veritabanı tablolarını otomatik olarak oluşturur.

Alternatif olarak, şemayı manuel olarak oluşturmak için şu adımları izleyebilirsiniz:

1. Yerel ortamınızda, projenin kök dizininde şu komutu çalıştırın:
   ```
   npm run db:push
   ```

2. Bu, `drizzle-kit` kullanarak veritabanı şemanızı Supabase'e gönderecektir

## 6. Örnek Kullanıcılar

Uygulamanızda test kullanıcıları oluşturmak istiyorsanız, aşağıdaki komutu çalıştırabilirsiniz:

```sql
INSERT INTO users (username, password, name, role, department)
VALUES 
  ('1001', '$2a$10$xVqYLGUT8G8HjdNuPDI6Z.FRoOXjpR5h0XlUsesw1YnQnNh.rtwSm', 'Admin Kullanıcı', 'executive', 'Yönetim'),
  ('2001', '$2a$10$9KGjKYjlA6PsQbULq0efVOQhgD1ycojYOSPkb3zPxHPdJ/OFc3sUi', 'Yönetici Kullanıcı', 'manager', 'Üretim'),
  ('3001', '$2a$10$RLbM5K8X.RUP1/aSWlQAWeO1k0w6hRldwHkjnKoFAJk2e9gB0gJRi', 'Çalışan Kullanıcı', 'employee', 'Kalite');
```

Bu kullanıcılar sırasıyla aşağıdaki şifrelere sahip olacaktır:
- 1001: admin123
- 2001: manager123
- 3001: employee123

## 7. İpuçları ve Sorun Giderme

### API Rotaları
- API endpointleriniz `/api/*` şeklinde erişilebilir olacaktır
- Vercel Functions, sunucusuz bir ortam olduğu için, uzun süreli bağlantılar veya WebSocket gibi canlı bağlantılar desteklenmez

### Vercel CLI ile Yerel Test
Dağıtım öncesi projenizi yerel olarak test etmek için:

1. Vercel CLI'yi yükleyin: `npm i -g vercel`
2. Vercel hesabınıza giriş yapın: `vercel login`
3. Yerel olarak çalıştırın: `vercel dev`

### Logging ve Hata Ayıklama
- Uygulama hatalarını görmek için Vercel Dashboard'daki "Functions" sekmesini kullanabilirsiniz
- Daha ayrıntılı günlükler için `console.error()` kullanarak kritik hataları yakalayın

### Vercel Dağıtım Limitleri
- Ücretsiz planın belirli limitleri vardır (işlev boyutu, çalışma süresi vb.)
- Büyük ölçekli uygulamalar için ücretli planlara geçmeyi düşünün

## 8. Üretim Ortamına Geçiş

Uygulama tüm testleri geçtiğinde ve üretim için hazır olduğunda:

1. Özelleştirilmiş bir alan adına bağlayabilirsiniz
2. SSL sertifikaları otomatik olarak Vercel tarafından sağlanacaktır
3. Performans izleme ve analitikler için Vercel Analytics'i etkinleştirebilirsiniz

---

Bu kılavuzla ilgili sorularınız veya sorunlarınız varsa, lütfen proje ekibine başvurun.