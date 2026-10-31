# CBC Sport Broadcast

Yayım heyəti (rejissor, texniki direktor, təkrar operator, səs mühəndisi və s.) üçün həftəlik iş qrafiki tətbiqi. Bir kod bazası — **Android** və **iOS**. Veb hissə HTML + Tailwind + JS ilə yazılıb, Capacitor ilə yerli tətbiqə çevrilir.

## İmkanlar
- **Cədvəlim** — yalnız sizin adınıza düşən çəkilişlər. Bitənlər avtomatik aşağıya düşür və "Tamamlandı" olur, növbəti çəkiliş yuxarıda "Növbəti" nişanı ilə görünür.
- Yığışma və başlama saatları ayrıca qutularda göstərilir, yığışmaya qeyd yazmaq olar (məs. `07:00 BOS`).
- Ezamiyyət (avtobus ikonu ilə) və ya Bakı. Yer sütununda region şəhəri yoxdursa, avtomatik **Bakı** sayılır.
- Hər kartda real **hava proqnozu** (Open-Meteo, açar tələb etmir, 16 günə qədər irəli).
- Hər kartda `⋮` menyusu: **Redaktə et** / **Sil**; **Əllə əlavə et**.
- **Bütün Komanda** — ada, vəzifəyə və ya oyuna görə canlı axtarış.
- **Statistika** pəncərəsi: aylar üzrə ümumi çəkiliş, ezamiyyət günləri, Bakı daxili, canlı yayım, videoyazı.
- **Ağıllı xatırlatma** — yığışmadan 1 saat əvvəl telefona bildiriş (tətbiq bağlı olsa da gəlir).
- **Qrafik yükləmə** — yeni Excel faylı əvvəlki versiyanı tam əvəz edir; keçmiş günlər statistika üçün arxivdə qalır.
- Profil: ad, vəzifə, şəkil (ad qrafikdəki yazılışla uyğunlaşdırılır, söz sırası və ə/e fərqi nəzərə alınır).

## Excel formatı
`sablon/CBC-qrafik-sablonu.xlsx` faylına baxın:
1. **Yuxarıda oyunlar:** `№ | Tarix | Gün | Yığışma saatı | Başlama saatı | Oyun | Yer | İdman növü | Yayım`
2. **Aşağıda heyət matrisi:** `Soyad Ad | Vəzifə | 1 | 2 | 3 …` — xanaya `x` yazmaq kifayətdir. Sütun başlığı oyun nömrəsi, oyun adı və ya tarix ola bilər.

Sütunların sırası vacib deyil — başlıqlar adlarına görə tapılır. Köhnə `.xls` formatını Excel-də `.xlsx` kimi saxlayın.

## Telefona quraşdırma

### Ən asan yol — GitHub Actions (kompüterə heç nə qurmadan)
1. Bu qovluğu yeni GitHub repozitoriyasına yükləyin.
2. **Actions** bölməsində "Build CBC Sport Broadcast" avtomatik işə düşəcək (~10 dəq).
3. Bitəndə **Artifacts** bölməsindən yükləyin:
   - `CBC-Sport-Broadcast-android` → `.apk` — telefona atıb quraşdırın ("naməlum mənbələrə" icazə verin).
   - `CBC-Sport-Broadcast-ios` → imzasız `.ipa` — **Sideloadly** və ya **AltStore** ilə öz Apple ID-nizlə quraşdırın.

### Öz kompüterinizdə
Tələblər: Node.js 20+, Android Studio (Android üçün), Mac + Xcode (iOS üçün).
```bash
npm install
npm run android:init      # android/ qovluğunu yaradır, ikonları və icazələri əlavə edir
npm run android:open      # Android Studio-da açır → Run
npm run ios:init          # (yalnız Mac) ios/ qovluğunu yaradır
npm run ios:open          # Xcode-da açır → Signing seçin → Run
```
`www/` daxilində dəyişiklik etdikdən sonra: `npm run sync`. Tailwind siniflərini dəyişsəniz: `npm run css`.

### App Store / Google Play
- Google Play: Developer hesabı (birdəfəlik $25). Android Studio → *Build → Generate Signed Bundle*.
- App Store: Apple Developer Program (illik $99). Xcode → *Product → Archive*.

## Qeydlər
- Məlumatlar telefonun özündə saxlanılır (serversiz). Hər əməkdaş qrafiki öz telefonuna yükləyir.
- Şəkil formatında qrafik yadda saxlanılır və tətbiqdə baxıla bilir, lakin şəkildən avtomatik oxuma hələ yoxdur — Excel istifadə edin.
- Tətbiq ikonası `resources/` qovluğundadır; rəsmi loqonu `icon-only.png` (1024×1024) kimi əvəz edib `npm run android:init` / `ios:init` işə salın.
