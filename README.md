# 🤠 Sheriff Games - Mobil Uygulama

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)

**Sheriff Games**, bağımsız oyun geliştiricileri ve dijital içerik (asset) üreticilerini oyuncularla buluşturan çapraz platform (cross-platform) destekli bir dijital ekosistemdir. Bu depo, projenin **React Native** ve **Expo** kullanılarak geliştirilen mobil arayüzünü (frontend) içermektedir.

Sistemin web sürümü ve Node.js/MySQL tabanlı merkezi API'si ile tam senkronize çalışan bu uygulama, kullanıcılara mobil cihazları üzerinden pazar yerine erişme, kütüphanelerini yönetme ve test süreçlerine katılma imkanı sunar.

---

## 🚀 Öne Çıkan Özellikler

- **Karanlık Tema (Dark Mode) UI/UX:** Projenin "Western" konseptine uygun, `#161625` arkaplan, `#E94560` (kırmızı) ve `#5b5bfe` (mavi) vurgularla tasarlanmış modern arayüz.
- **Dinamik Vitrin ve Filtreleme:** Oyun ve asset'lerin kategorilere (Aksiyon, Macera, 3D Model vb.) göre anlık olarak filtrelenmesi.
- **Dijital Kütüphane Yönetimi:** Kullanıcıların hesaplarındaki içeriklere ulaşıp platformlar arası erişim yetkilerini kontrol edebildikleri modül.
- **📸 Yenilikçi Test Merkezi:** Oyuncuların mobil cihazlarının kamerası veya galerisi aracılığıyla ekran kaydı ve fotoğrafları (bug raporları) detaylı açıklamalarıyla birlikte doğrudan oyun geliştiricisine iletebildiği interaktif test modülü.
- **Geliştirici Paneli:** Satış istatistiklerinin, toplam indirmelerin ve geri bildirimlerin mobil üzerinden anlık takibi.

---

## 🛠 Kullanılan Teknolojiler

| Teknoloji | Açıklama |
|---|---|
| React Native | Mobil uygulama çerçevesi |
| Expo | Geliştirme platformu |
| Axios | Node.js REST API ile asenkron haberleşme |
| React Navigation | Ekranlar arası navigasyon |
| Expo Image Picker | Test Merkezi için kamera ve galeri erişimi |

> **Not:** Sistemin arka yüzü Node.js, Express.js ve MySQL ile geliştirilmiş olup farklı bir depoda barındırılmaktadır.

---

## ⚙️ Kurulum ve Çalıştırma

### Ön Koşullar

- [Node.js](https://nodejs.org/) bilgisayarınızda kurulu olmalıdır.
- [Expo CLI](https://docs.expo.dev/get-started/installation/) yüklü olmalıdır.
- **Önemli:** Uygulamanın verileri çekebilmesi için *Sheriff Games Backend* sunucusunun yerel ağınızda (localhost) veya bir sunucuda çalışıyor olması gerekir.

### Adımlar

**1. Depoyu Klonlayın**
```bash
git clone https://github.com/omer-serif/SheriffGamesMobileApp.git
cd SheriffGamesMobileApp
```

**2. Gerekli Paketleri Yükleyin**
```bash
npm install
```

**3. API Bağlantısını Ayarlayın**

Backend sunucunuzun IP adresini uygulamanın API yapılandırma dosyasına tanımlayın. Yerel testler için bilgisayarınızın yerel IPv4 adresini kullanın


**4. Uygulamayı Başlatın**
```bash
npx expo start
```

**5. Test Edin**

- 📱 **Fiziksel Cihaz:** QR kodu [Expo Go](https://expo.dev/client) uygulamasıyla okutun.
- 🍎 **iOS Simulator:** `i` tuşuna basın.
- 🤖 **Android Emulator:** `a` tuşuna basın.

---

## 👨‍💻 Geliştirici

**Ömer Şerif YAPICIOĞLU**  
Bilişim Sistemleri Mühendisliği — Kocaeli Üniversitesi  
🐙 GitHub: [@omer-serif](https://github.com/omer-serif)
