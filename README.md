# Kaizen ve Kıvılcım Öneri Sistemi

Bu proje, şirket çalışanlarının Kaizen ve Kıvılcım adı verilen iki farklı türde iyileştirme önerilerini sunmaları, değerlendirmeleri ve ödüllendirmeleri için geliştirilmiş bir web uygulamasıdır.

## Genel Bakış

Bu uygulama, çalışanların iyileştirme önerilerini kolayca oluşturabilmesi, yöneticilerin bu önerileri değerlendirebilmesi ve süreç boyunca şeffaf bir iletişim sağlanması amacıyla tasarlanmıştır.

### Öneri Türleri

- **Kaizen**: Kapsamlı ve büyük ölçekli iyileştirme projeleri için kullanılır. Detaylı bir fizibilite değerlendirmesi, maliyet analizi ve üst yönetim onayı süreçlerini içerir.

- **Kıvılcım**: Daha küçük, hızlı uygulanabilir iyileştirme fikirleri için kullanılır. Basitleştirilmiş bir değerlendirme ve onay süreci içerir.

## Temel Özellikler

- JWT tabanlı kimlik doğrulama
- Rol bazlı erişim kontrolü (Çalışan, Bölüm Yöneticisi, Üst Yönetim)
- Öneri oluşturma ve takip sistemi 
- Fizibilite değerlendirme aracı (7 kritere göre otomatik puanlama)
- Detaylı maliyet ve fayda analizi
- Durum değişikliği bildirimleri
- İstatistikler ve ödül sistemi
- Vercel serverless mimarisi desteği

## Rol ve İzinler

- **Çalışan**: Öneri oluşturma, kendi önerilerini görüntüleme
- **Bölüm Yöneticisi**: Önerileri değerlendirme, durum güncelleme, departman değerlendirmesi yapma
- **Üst Yönetim**: Tüm önerilere erişim, nihai onay, ödül tahsisi

## Uygulama Mimarisi

Bu uygulama aşağıdaki teknolojileri kullanır:

- **Frontend**: TypeScript, React, TailwindCSS
- **Backend**: Node.js, Express, Next.js API Routes
- **Veritabanı**: PostgreSQL, Drizzle ORM
- **Kimlik Doğrulama**: JWT, bcrypt
- **Dağıtım**: Vercel Serverless Functions

## Dağıtım Seçenekleri

### Vercel Dağıtımı

Uygulama Vercel'in serverless mimarisinde çalışacak şekilde yapılandırılmıştır. Dağıtım için:

1. Vercel CLI'yı kullanarak: `vercel deploy`
2. GitHub entegrasyonu ile otomatik dağıtım

### Sunucu Dağıtımı

1. Node.js (v18+) yüklü bir sunucu hazırlayın
2. PostgreSQL veritabanı oluşturun
3. `.env.production` dosyasını düzenleyin
4. `npm run build` ve `npm start` komutlarını çalıştırın

## Bilinen Sorunlar ve Çözümleri

### ESM/CommonJS Uyumluluk Sorunları

**Sorun**: Proje ES Modules (ESM) formatında yapılandırılmış, ancak bazı dosyalarda CommonJS formatına özgü `__dirname` gibi referanslar kullanılıyor.

**Çözüm**: 

```javascript
// ESM uyumlu __dirname eklemek için:
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```

### API Yönlendirme Sorunları

**Sorun**: Vercel'de API yolları ve dynamik rotalar düzgün çalışmayabilir.

**Çözüm**: vercel.json dosyasında doğru yönlendirmeleri tanımlamak:

```json
{
  "routes": [
    { "src": "/api/suggestions/([0-9]+)", "dest": "/api/suggestions/[id].ts?id=$1" }
  ]
}
```

## Veritabanı Şeması

Sistem aşağıdaki ana tablolara sahiptir:

- **users**: Kullanıcı bilgileri ve kimlik doğrulama
- **suggestions**: Öneri detayları ve durum takibi
- **rewards**: Ödül kayıtları

## Test Hesapları

- **Üst Yönetici**: ID 1001
- **Bölüm Yöneticisi**: ID 2001 
- **Çalışan**: ID 3001