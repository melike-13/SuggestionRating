# Kaizen Öneri Sistemi

## Genel Bakış

Kaizen ve Kıvılcım önerilerini yönetmek için geliştirilmiş bir sistem.

## Teknoloji Yığını

- Frontend: React + Vite
- Backend: Express.js + Next.js API Routes (Vercel deployment için)
- Veritabanı: PostgreSQL (Neon.tech üzerinden)
- ORM: Drizzle
- Kimlik Doğrulama: JWT tabanlı oturum yönetimi

## Proje Yapısı

```
├── api/                  # Vercel Serverless Functions
│   ├── auth/             # Kimlik doğrulama endpointleri
│   ├── suggestions/      # Öneri yönetim endpointleri
│   └── stats/            # İstatistik endpointleri
├── client/               # React istemci uygulaması
├── server/               # Express.js sunucu (geliştirme ortamı için)
└── shared/               # Paylaşılan kod ve şema tanımları
```

## Geliştirme

Projeyi geliştirme ortamında çalıştırmak için:

```bash
# Bağımlılıkları yükle
npm install

# Veritabanı şemasını güncelle
npm run db:push

# Geliştirme sunucusunu başlat
npm run dev
```

Sunucu varsayılan olarak http://localhost:3000 adresinde çalışır.

## Dağıtım (Deployment)

### Vercel Üzerinde Deployment

Projeyi Vercel'e deploy etmek için:

1. GitHub repo'sunu Vercel'e bağlayın
2. Aşağıdaki ortam değişkenlerini ayarlayın:
   - `DATABASE_URL`: PostgreSQL veritabanı bağlantı URL'si
   - `JWT_SECRET`: JWT token'ları için gizli anahtar
   - `NODE_ENV`: `production` olarak ayarlayın
3. Vercel projesinde Framework Preset ayarını "Other" olarak belirleyin
4. Deploy düğmesine tıklayın

### Kendi Sunucunuzda Deployment

1. Projeyi derleyin:
   ```bash
   npm run build
   ```

2. Uygulamayı çalıştırın:
   ```bash
   npm start
   ```

## API Endpointleri

### Kimlik Doğrulama

- `POST /api/auth/login`: Kullanıcı girişi
- `POST /api/auth/logout`: Çıkış yapma
- `GET /api/auth/user`: Mevcut kullanıcı bilgilerini alma

### Öneriler

- `GET /api/suggestions`: Tüm önerileri listeleme
- `POST /api/suggestions`: Yeni öneri oluşturma
- `GET /api/suggestions/:id`: Belirli bir öneriyi getirme
- `PATCH /api/suggestions/:id`: Öneri güncelleme
- `GET /api/suggestions/user`: Kullanıcının önerilerini getirme

### İstatistikler

- `GET /api/stats/suggestions`: Öneri istatistiklerini getirme
- `GET /api/stats/top-contributors`: En çok katkıda bulunanları getirme

## Lisans

Tüm hakları saklıdır. Bu proje LAV için özel olarak geliştirilmiştir.