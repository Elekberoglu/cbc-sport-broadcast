# CBC Sport Broadcast

Yayım heyəti (rejissor, texniki direktor, təkrar operator, səs mühəndisi və s.) üçün həftəlik iş qrafiki tətbiqi. Bir kod bazası — **Android** və **iOS**. Veb hissə HTML + Tailwind + JS ilə yazılıb, Capacitor ilə yerli tətbiqə çevrilir.

## İmkanlar
- **Cədvəlim** — yalnız profil adınıza (Soyad Ad) uyğun çəkilişlər. Bitənlər avtomatik aşağıya düşür və "Tamamlandı" olur, növbəti çəkiliş "Növbəti" nişanı ilə yuxarıda görünür.
- Başlıqda **CBC SPORT BROADCAST** loqosu mərkəzdədir; istifadəçinin tam adı kəsilmədən (lazım olsa iki sətrə keçərək) göstərilir.
- Yığışma və başlama saatları ayrıca qutularda, yığışma qeydi ilə (məs. `BOS`). Kartlarda saat 24 saat formatındadır.
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
| Tarix * | `GG/AA/İİİİ` formatı, avtomatik `/` maskası, təqvim düyməsi; boş və ya səhv tarix (məs. 31/02) qəbul olunmur |
| Yığışma saatı * / Başlama saatı * | Təkər tipli seçici (saat · dəqiqə · AM/PM), yuxarıda **X** bağlama, **Təsdiq et** ilə tətbiq; siçan (təkərcik, sürüşdürmə, klik), toxunma və klaviatura (↑/↓) ilə işləyir; daxildə 24 saat (`HH:MM`) saxlanılır |
| Yığışma qeydi * | Boş başlayır, mütləqdir |
| Çəkiliş (məs: Sabah-Qarabağ) * | Boş başlayır, mütləqdir |
| Çəkiliş yeri | Boş başlayır; boş qalsa Bakı sayılır; hava proqnozu buna görə tapılır |
| İdman növü, Yayım (Canlı / Videoyazı) | Dəyişməyib |

Hava və Heyət sahələri formadan çıxarılıb.

## Excel formatı
`sablon/CBC-qrafik-sablonu.xlsx` faylına baxın:
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
