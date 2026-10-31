# Dəyişikliklər

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
