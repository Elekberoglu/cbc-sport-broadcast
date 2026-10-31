# Dəyişikliklər

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
