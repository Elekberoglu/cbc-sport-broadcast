# Dəyişikliklər

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
