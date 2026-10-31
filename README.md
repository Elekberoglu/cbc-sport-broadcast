# CBC Sport Broadcast

Yayım heyəti (rejissor, texniki direktor, təkrar operator, səs mühəndisi və s.) üçün həftəlik iş qrafiki tətbiqi. Bir kod bazası — **Android** və **iOS**. Veb hissə HTML + Tailwind + JS ilə yazılıb, Capacitor ilə yerli tətbiqə çevrilir.

## İmkanlar
- **Cədvəlim** — yalnız profil adınıza (Soyad Ad) uyğun çəkilişlər. Bitənlər avtomatik aşağıya düşür və "Tamamlandı" olur, növbəti çəkiliş "Növbəti" nişanı ilə yuxarıda görünür.
- Başlıqda **CBC SPORT BROADCAST** loqosu mərkəzdədir; ad və soyad bir sətirdə, kəsilmədən göstərilir.
- Yığışma və başlama saatları ayrıca qutularda, yığışma qeydi ilə (məs. `BOS`); STS və matçönü+flaş məlumatı. Bütün saatlar 24 saat formatındadır.
- Ezamiyyət (avtobus ikonu) və ya Bakı — yer sütununda region şəhəri yoxdursa, avtomatik **Bakı**.
- **Avtomatik hava proqnozu** (Open-Meteo, açarsız): çəkiliş yerinə və tarixinə görə, **yığışma** və **başlama** saatları üçün ayrıca — temperatur, vəziyyət (yağış/qar/külək), yağıntı ehtimalı və miqdarı, külək sürəti və zərbəsi. Proqnoz yoxdursa (16 gündən uzaq, keçmiş tarix, internet yoxdur) bu açıq yazılır; hava heç vaxt əl ilə daxil edilmir və uydurulmur.
- `⋮` menyusu: **Redaktə et** / **Sil**.
- **Bütün Komanda** — ad, vəzifə və ya oyuna görə canlı axtarış.
- **Statistika** — aylar üzrə ümumi çəkiliş, ezamiyyət günləri, Bakı daxili, canlı yayım, videoyazı.
- **Ağıllı xatırlatma** — yığışmadan 1 saat əvvəl telefona bildiriş.
- **Görünüş rejimi** — Aydın / Qaranlıq / Sistem.

### Qrafik yükləmə (Yüklə)
1. **Yüklə** → fayl seçimi açılır (Excel `.xlsx`, `.csv` və ya şəkil).
2. Seçimdən sonra **təsdiq pəncərəsi** fayl adı ilə açılır: **Təsdiq et** / **Ləğv et**. Təsdiqə qədər heç nə idxal olunmur.
3. Təsdiqdən sonra fayl oxunur və **yalnız profil adınıza uyğun** çəkilişlər əsas səhifəyə düşür.
4. Faylda adınız tapılmasa, qrafik **idxal edilmir** və izahlı mesaj göstərilir.
5. **Eyni dövr** üçün yeni versiya yüklənsə: son təsdiqlənmiş versiya əsas götürülür, həmin tarix aralığındakı köhnə idxal edilmiş çəkilişlər əvəzlənir, əvvəlki versiya **tarixçədə** saxlanılır və fərqlər (yeni / dəyişən / silinən, saat dəyişiklikləri) göstərilir. Əllə əlavə edilən çəkilişlərə toxunulmur. Tarixçəyə başlıqdakı "Qrafik vN · tarixçə" yazısından baxmaq olar.
6. **Şəkil** faylları: avtomatik oxuma (OCR) **hələ mövcud deyil** — şəkil yalnız baxmaq üçün saxlanılır, çəkiliş idxal olunmur və bu açıq bildirilir.

### Əllə əlavə et
| Sahə | Qayda |
|---|---|
| Tarix * | `GG/AA/İİİİ`; sahəyə toxunanda təqvim açılır (yuxarıda X, aşağıda Təsdiq et) |
| Yığışma saatı * / Başlama saatı (istəyə bağlı) | 24 saat: yazmaq (`1530` → `15:30`) və ya saat ikonu ilə təkər seçici (00–23 · 00–59), yuxarıda **X**, aşağıda **Təsdiq et**; siçan, toxunma və klaviatura ilə işləyir |
| Yığışma qeydi * | Boş başlayır, mütləqdir |
| Çəkiliş (məs: Sabah-Qarabağ) * | Boş başlayır, mütləqdir |
| Çəkiliş yeri | Boş başlayır; boş qalsa Bakı sayılır; hava proqnozu buna görə tapılır |
| İdman növü, Yayım (Canlı / Videoyazı) | Dəyişməyib |

Hava və Heyət sahələri formadan çıxarılıb.

## Excel formatı
Komandaya göndərilən qrafik formatı birbaşa dəstəklənir (nümunə: `sablon/Qrafik-27.10-01.11.2026.xlsx`):
1. **Yuxarıda:** `STS | Tarix | Yığışma Saatı | Başlama Saatı | Çəkiliş | Çəkiliş yeri | İdman növü | Yayım | Matç önc+flaş`
2. **Aşağıda:** `Vəzifə | Soyad + Ad | 27 oktyabr | 27 oktyabr | 28 oktyabr | …` — xanada oyunun (qısaldılmış) adı yazılır.

Alternativ sadə format — `sablon/CBC-qrafik-sablonu.xlsx`:
1. **Yuxarıda oyunlar:** `№ | Tarix | Gün | Yığışma saatı | Başlama saatı | Oyun | Yer | İdman növü | Yayım`
2. **Aşağıda heyət matrisi:** `Soyad Ad | Vəzifə | 1 | 2 | 3 …` — xanaya `x` yazmaq kifayətdir. Sütun başlığı oyunun `№`-si, oyun adı və ya tarix ola bilər.

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
- Şəkil formatında qrafik yalnız baxmaq üçün saxlanılır; şəkildən avtomatik oxuma hələ yoxdur — Excel istifadə edin.
- Hava proqnozu internet tələb edir və 16 günə qədər irəli mövcuddur.
- Sənədləşmə: dəyişikliklərin siyahısı `docs/CHANGELOG.md` faylındadır.
- Tətbiq ikonası `resources/` qovluğundadır; rəsmi loqonu `icon-only.png` (1024×1024) kimi əvəz edib `npm run android:init` / `ios:init` işə salın.
