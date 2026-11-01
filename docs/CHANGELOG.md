# Dəyişikliklər

## 2.1.0 — 01.11.2026
- **Tamamlanma:** çəkiliş başlama vaxtı çatan kimi avtomatik "Tamamlananlar"a keçir (məs. 15:00-da). Başlama saatı yoxdursa yığışma/növbə saatı, heç bir saat yoxdursa günün sonu götürülür.
- **Statistika:** "Ümumi çəkiliş" altında "X tamamlanıb · Y qarşıdadır"; ayın siyahısında tamamlananlar ✓, qarşıdakılar 🕐 ilə işarələnir.
- **36 saatlıq həftəlik iş saatı** bölməsi həm STS, həm operator hissəsindən çıxarıldı.

## 2.0.0 — 01.11.2026
- **Çıxış:** Profil pəncərəsində "Çıxış" düyməsi (Bəli/Xeyr təsdiqi). Profil və cədvəl bu telefondan silinir, giriş ekranına (komanda seçimi) qayıdılır. Görünüş rejimi saxlanılır.
- **Operator girişi:** əvvəlcə komanda seçilir; Operator üçün xana "Adınız" olur — ad operator cədvəlində yazıldığı kimi daxil edilir (məs. "Anar" və ya "Anar İs."). "Siz kimsiniz?" siyahısı çıxarıldı: cədvəl yüklənəndə girişdəki ad axtarılır; tapılmasa idxal edilmir və izah göstərilir.
- Profil pəncərəsində ayrıca "Operator cədvəlində adınız" sahəsi çıxarıldı — operator üçün "Ad" sahəsi istifadə olunur.
- Giriş xanasında telefonun avtomatik ad təklifi söndürüldü.
- "Bütün Komanda"da "(Siz)" işarəsi operator adına dəqiq uyğunluqla qoyulur ("Anar" ≠ "Anar İs.").

## 1.9.1 — 01.11.2026
- "Bütün Komanda" operator rejimində: saat (09:00, 14:00) və növbə nişanı (Studiya / Kənar / STS-N / Növbətçi) göstərilir, say "növbə" kimi yazılır.
- Operator komandası üçün redaktə və "Qrafik yarat" formalarında yalnız tarix və çəkilişin adı məcburidir; digər sahələr istəyə bağlıdır (qırmızı ulduz gizlədilir).
- Məlumat doldurulmuş operator növbəsi STS heyətinin kartı ilə eyni görünüşdədir (Bakı/Ezamiyyət, hava, matç öncəsi/sonrası, iki saat qutusu) + növbə nişanı və komanda.

## 1.9.0 — 01.11.2026
- Operator növbə kartına **toxunanda** redaktə pəncərəsi açılır: çəkiliş yeri, yığışma və başlama saatı, yığışma qeydi (BOS), idman növü, yayım (Canlı/Videoyazı), matç öncəsi/sonrası əlavə etmək olar. Operator üçün yığışma saatı istəyə bağlıdır.
- Məlumat əlavə edildikdən sonra kartda Bakı/Ezamiyyət nişanı, yayım növü, yer, flaş, başlama saatı və yerə görə hava proqnozu görünür.
- Eyni həftənin operator cədvəli yenidən yüklənəndə əlavə edilmiş məlumatlar saxlanılır.
- Redaktə formasına "Matç öncəsi / sonrası" sahəsi əlavə olundu.

## 1.8.0 — 01.11.2026
- **Komanda seçimi:** ilk girişdə "STS heyəti" və ya "Operator" seçilir (mütləq). Profil pəncərəsində "Komanda" ilə dəyişmək olar. Mövcud istifadəçilər avtomatik "STS heyəti" sayılır.
- **STS heyəti:** yalnız çəkiliş qrafiki; operator cədvəli yüklənsə idxal edilmir, izah göstərilir.
- **Operator:** yalnız operator cədvəli ("Həftəlik Növbə Cədvəli"); statistikada dairəvi qrafiklər, ezamiyyət və iş saatı gizlədilir — "Operator növbələri" və aylar üzrə saylar qalır. STS qrafiki yüklənsə idxal edilmir.
- "Bütün Komanda" bölməsi də seçilmiş komandanın cədvəlini göstərir.

## 1.7.0 — 01.11.2026
- **Operatorlar cədvəli** dəstəklənir: `Tarix | STUDIYA | Şirkətdən kənar çəkilişlər | STS-1 | STS-2 | STS-3 | Növbətçi`. Eyni "Qrafik yüklə" düyməsi ilə yüklənir, format avtomatik tanınır (nümunə: `sablon/Operator-qrafiki-02.11-08.11.2026.xlsx`).
- Adlar soyadsız yazıldığı üçün ilk yükləmədə "Bu cədvəldə siz kimsiniz?" siyahısı çıxır; seçim yadda qalır ("Anar" və "Anar İs." fərqli sayılır). Profil pəncərəsində "Operator cədvəlində adınız" sahəsindən dəyişmək olar.
- Operator növbəsi kartı: növ nişanı (Studiya / Şirkətdən kənar / STS-N / Növbətçi), oyun və ya idman adı, komanda yoldaşları, növbə saatı; STS üçün yer bilinmədiyindən hava göstərilmir.
- Çəkiliş qrafiki və operator qrafiki bir-birini əvəz etmir — ikisi də eyni vaxtda "Cədvəlim"də görünür, versiyalar ayrıca saxlanılır.
- Statistikada "Operator növbələri" bölməsi; operator növbələri həftəlik iş saatına daxil edilmir.

## 1.6.1 — 31.10.2026
- Qrafik təsdiqlənəndən sonra pəncərə avtomatik bağlanır; nəticə (versiya, çəkiliş sayı, dəyişikliklər) qısa bildirişlə göstərilir. Xəta və ya ad tapılmadıqda pəncərə açıq qalır.

## 1.6.0 — 31.10.2026
- İlk giriş ekranı yalnız **Soyad Ad** soruşur.
- Vəzifəyə toxunanda profil pəncərəsi vəzifə sahəsi aktiv halda açılır; vəzifə əl ilə yazılır, hazır seçim siyahısı yoxdur.
- "Yüklə" və "Əllə əlavə et" iki böyük kartla əvəzləndi: **Qrafik yüklə** (Excel faylından avtomatik) və **Qrafik yarat** (məlumatları özün daxil et).
- iPhone üçün veb-tətbiq GitHub Pages-də (`static.yml`): https://elekberoglu.github.io/cbc-sport-broadcast/www/

## 1.5.2 — 31.10.2026
- **iPhone üçün veb-tətbiq:** GitHub Pages ilə yerləşdirmə (`.github/workflows/pages.yml`). Safari → Paylaş → "Ana ekrana əlavə et".
- iPhone ana ekranı üçün 180×180 ikon; veb rejimində bildirişlər service worker vasitəsilə göstərilir (iOS 16.4+), bildirişə toxunanda tətbiq açılır.

## 1.5.1 — 31.10.2026
- "Hesablama ayarları" paneli çıxarıldı; iş saatı sabit qaydalarla hesablanır (Futbol/Basketbol/Voleybol/Digər 2 saat, Futzal/Həndbol 1.5 saat, norma 36 saat). Əvvəl dəyişdirilmiş dəyərlər sıfırlanır.
- Tətbiq ikonasında "CBC" yazısının altına "SPORT" əlavə olundu.

## 1.5.0 — 31.10.2026
- **Həftəlik iş saatı** (Statistika): həftə bazar ertəsindən bazara qədər; həftənin saatları dairəvi göstəricidə normaya nisbətlə (%), "normaya X qalıb" və ya "normadan X artıq" (⚠). Ayın həftələri zolaqlarla, boz xətt — norma; həftəyə toxunanda seçilir. Ay üzrə cəmi saat.
- **Hesablama:** iş vaxtı = yığışma saatından oyunun sonuna qədər; oyunun sonu = başlama saatı + idman növünün müddəti. Saatı olmayan çəkiliş üçün yalnız oyun müddəti götürülür və "təxmini" (~) işarələnir.
- **Hesablama ayarları:** idman növlərinin müddəti (standart: Futbol 2, Basketbol 2, Voleybol 2, Futzal 1.5, Həndbol 1.5, Digər 2 saat) və həftəlik norma (standart 36 saat) dəyişdirilə bilər.
- "Bu ayın çəkilişləri" siyahısında hər çəkilişin iş saatı göstərilir.

## 1.4.0 — 31.10.2026
- **Statistika:** seçilmiş ay üçün iki dairəvi (donut) qrafik — "Yer" (Bakı daxili / Ezamiyyət) və "Yayım" (Canlı / Videoyazı), faiz və sayla; seqmentə toxunanda mərkəzdə onun dəyəri görünür.
- **Aylar üzrə çəkilişlər:** son 12 ayın sayları zolaq şəklində; aya toxunanda həmin ayın statistikası açılır. Ay seçimində hər ayın yanında çəkiliş sayı göstərilir.
- Qrafik rəngləri rəng korluğu və kontrast üzrə yoxlanılıb, işıqlı və qaranlıq rejim üçün ayrıca seçilib.
- İlk giriş yalnız bir dəfə soruşulur (ad telefonda yadda saxlanılır; "Cədvəli təmizlə" profili silmir).

## 1.3.0 — 31.10.2026
- **İlk giriş ekranı:** tətbiq ilk dəfə açılanda istifadəçi Soyad Ad (mütləq, ən azı iki söz) və Vəzifə daxil edir. Standart ad yoxdur; qrafik yüklənəndə yalnız həmin ada uyğun çəkilişlər göstərilir.
- **Ad tapılmasa:** qrafik idxal olunmur, əvəzində qrafikdəki əməkdaşların siyahısı çıxır — istifadəçi özünü seçir, təsdiqdən sonra öz çəkilişləri yüklənir.
- **Matç öncəsi/sonrası:** hər kartda göstərilir; qrafikdə yoxdursa "yoxdur" yazılır.
- **Yükləmə tarixçəsi:** vəzifənin altındakı "Qrafik vN · tarixçə" pəncərəsində hər yükləməni silmək olar (Bəli/Xeyr təsdiqi); silinən versiyanın çəkilişləri də cədvəldən çıxır.
- **Cədvəli təmizlə:** Ağıllı Xatırlatmanın altında; "Həftəlik cədvəli silmək istədiyinizə əminsiniz?" — Bəli bütün çəkilişləri və tarixçəni silir, Xeyr heç nəyi dəyişmir.
- **Başlıq:** profil şəkli ad-soyad və vəzifə ilə eyni səviyyədədir.

## 1.2.0 — 31.10.2026

### Real qrafik formatı
- Komandaya göndərilən qrafikin formatı tam dəstəklənir: `STS | Tarix | Yığışma Saatı | Başlama Saatı | Çəkiliş | Çəkiliş yeri | İdman növü | Yayım | Matç önc+flaş` və altında `Vəzifə | Soyad + Ad | 27 oktyabr | 27 oktyabr | …` heyət cədvəli.
- Heyət cədvəlində qısaldılmış adlar oyunlarla avtomatik tutuşdurulur ("A/K Kəpəz - Baku S", "U 15", "Basketbol", "Qəbələ-Qarabağ"). Eyni tarixli iki sütun həmin günün 1-ci və 2-ci oyunu sayılır. Qeyri-müəyyən xana təyin edilmir.
- "13.00 BOS", "30.10..2026" kimi yazılışlar və Excel-də rəqəm kimi saxlanmış saatlar (13.3 → 13:30) düzgün oxunur.
- STS və "Matç önc+flaş" məlumatı kartda göstərilir.

### İnterfeys
- Ad və soyad başlıqda **bir sətirdə** yan-yana; yer çatmasa şrift kiçilir, kəsilmir. Görünüş rejimi düyməsi başlıqdan Profil pəncərəsinə keçdi.
- **Başlama saatı istəyə bağlıdır.** Saat yoxdursa, hava proqnozu gün ərzinə (15:00) görə göstərilir.
- Saatlar **24 saat formatında**: birbaşa yazmaq olar (`1530` → `15:30`, `930` → `09:30`) və ya saat ikonu ilə 00–23 / 00–59 təkərindən seçmək; AM/PM yoxdur.
- **Tarix**: müasir sahə və öz təqvimimiz — yuxarıda **X**, aşağıda **Təsdiq et**; Clear/Cancel/Set yoxdur; ay oxlarla və ya sürüşdürməklə dəyişir.

## 1.1.0 — 31.10.2026

### Başlıq
- CBC SPORT BROADCAST loqosu, ikonu və mətni başlıqda mərkəzə düzləndi; adla arasında boşluq artırıldı.
- İstifadəçinin tam adı kəsilmədən (ellipsis olmadan) göstərilir, lazım olduqda sətir keçir.
- Qrafik versiyası adın altında "Qrafik vN · tarixçə" kimi göstərilir və tarixçəni açır.

### Qrafik yükləmə
- "Yüklə" birbaşa fayl seçimini açır; seçimdən sonra fayl adı ilə **Təsdiq et / Ləğv et** pəncərəsi çıxır. Təsdiqə qədər idxal edilmir.
- Yalnız profil adına uyğun çəkilişlər idxal olunur; uyğunluq yoxdursa, fayl idxal edilmir və mesaj göstərilir.
- Eyni dövr üçün yeni versiya köhnəni əvəz edir, əvvəlki versiya tarixçədə saxlanılır, fərqlər göstərilir.
- Şəkil faylları üçün avtomatik oxumanın hələ mövcud olmadığı açıq bildirilir.
- İlk açılışda göstərilən nümunə (saxta) çəkilişlər silindi.
- Excel oxuyucusunda düzəlişlər: `№` sütunu tanınır; heyət matrisi bir boş sətirlə ayrıldıqda belə oyunlar cədvəlinə qarışmır.

### Əllə əlavə et
- Tarix: `GG/AA/İİİİ`, mütləq, maska + təqvim, etibarsız tarix rədd edilir.
- Yığışma və Başlama saatı: təkər tipli 12 saatlıq (AM/PM) seçici, X düyməsi və Təsdiq et; mütləq.
- Yığışma qeydi: boş, mütləq, xəta mesajı.
- "Çəkiliş (məs: Sabah-Qarabağ)" etiketi; sahə boşdur.
- Çəkiliş yeri: placeholder silindi.
- Hava sahəsi və Heyət bölməsi formadan çıxarıldı.

### Hava proqnozu
- Yığışma və başlama saatları üçün ayrıca: temperatur, vəziyyət, yağıntı ehtimalı/miqdarı (yağış, qar), külək və külək zərbəsi.
- Proqnoz olmadıqda səbəbi göstərilir; əl ilə daxil edilmiş hava dəyərləri artıq göstərilmir.
