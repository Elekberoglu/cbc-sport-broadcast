# Push bildirişi: "📅 Həftəlik çəkiliş cədvəli yeniləndi"

## Necə işləyir

1. Admin tətbiqdə qrafiki yükləyir və **təsdiqləyir** → Firestore `schedules/{id}` sənədi yazılır.
2. Firestore yazısı uğurlu olduqdan sonra **Cloud Function** `notifyScheduleUpdate` işə düşür (`functions/index.js`).
   - Yazanın serverdə `admin: true` claim-i yoxlanılır.
   - Hər versiya (`id + uploadedAt`) üçün **yalnız bir** bildiriş: `notifications/{versiya}` sənədi kilid rolunu oynayır.
   - Bildiriş yalnız həmin komandanın (STS və ya Operator) cihazlarına gedir.
   - 60 gündən çox aktiv olmayan, silinmiş və ya bloklanmış istifadəçilərin, eləcə də etibarsız tokenlər silinir.
   - Qrafikin silinməsi, təsdiqlənməmiş və ya uğursuz yükləmə bildiriş göndərmir.
3. İşçinin telefonu bildirişi göstərir. Toxunanda tətbiq **Cədvəlim → həftəlik cədvəl** ekranında açılır, ən son qrafik Firestore-dan avtomatik gəlir.
4. Tətbiq açıq olanda gələn bildiriş yerli bildiriş kimi göstərilir.
5. İşçi tətbiqdən **Çıxış** edəndə həmin telefonun tokeni silinir və o, artıq bildiriş almır.
6. Mövcud "yığışmaya 1 saat qaldı" xatırlatmaları dəyişməyib.

Cihaz tokenləri `devices/{uid}` sənədlərindədir. Hər istifadəçi yalnız öz sənədini yaza və silə bilir, tokenləri isə heç kim oxuya bilmir (yalnız server).

## Əl ilə edilməli addımlar

### 1. Blaze planı (məcburi)
Cloud Functions yalnız **Blaze** (istifadəyə görə ödəniş) planında işləyir. Layihə hazırda **Spark** planındadır.
- Firebase Console → sol aşağıda **Upgrade** → **Blaze** → ödəniş kartı.
- Pulsuz limitlər (ayda 2 milyon funksiya çağırışı, FCM tamamilə pulsuz) bu tətbiq üçün kifayətdir. Ehtiyat üçün
  Google Cloud → Billing → **Budgets & alerts** bölməsində, məsələn, 1 $ büdcə xəbərdarlığı qurun.

### 2. Region
`functions/index.js` faylındakı `REGION` dəyəri Firestore bazasının yerinə uyğun olmalıdır
(Firestore → Database → "Location"): `eur3` → `europe-west1` (standart), `nam5` → `us-central1`.

### 3. Yayımlama (Google Cloud Shell)
```bash
cd ~/cbc-sport-broadcast && git pull
cd functions && npm install && cd ..
firebase deploy --only functions,firestore:rules --project cbc-sport-broadcast
```
`firestore.rules` faylına `devices` bölməsi əlavə olunub, ona görə qaydalar da yenilənməlidir.
Yayımlamazdan əvvəl qaydaları Rules Playground-da yoxlayın (bax `docs/ADMIN.md`).

### 4. iPhone (veb-tətbiq) üçün — istəyə bağlı
iPhone-da tətbiq PWA kimi işləyir. Web Push iOS 16.4+ versiyalarında, tətbiq ana ekrana əlavə olunubsa işləyir.
- Firebase Console → Project settings → **Cloud Messaging** → **Web Push certificates** → **Generate key pair**.
- Alınan açarı `www/js/firebase-config.js` faylındakı `CBC_FCM_VAPID_KEY` dəyərinə yazın.
- İşçi iPhone-da tətbiqdə **Ağıllı xatırlatma** açarını yandırmalıdır: iOS icazəni yalnız düyməyə toxunanda soruşur.

Doğma (native) iOS tətbiqi üçün Apple Developer hesabı və APNs açarı lazımdır; hazırda bu, tətbiqə aid deyil.

## Yoxlama
Bildirişlər **real telefonlarda yoxlanmayıb**. Yayımlamadan sonra:
1. İki Android telefonda yeni APK-nı quraşdırın, giriş edin və bildiriş icazəsini verin.
2. Admin yeni qrafik yükləsin → hər telefona **bir** bildiriş gəlməlidir.
3. Bildirişə toxunun → həftəlik cədvəl açılmalıdır.
4. Eyni faylı yenidən yükləyin → yeni versiya olduğu üçün yenə bir bildiriş gəlir. Ləğv edilmiş yükləmə bildiriş göndərmir.
5. Tətbiq bağlı, fonda və açıq olanda ayrı-ayrılıqda yoxlayın.
6. Firebase Console → Functions → **Logs** bölməsində "Cədvəl bildirişi göndərildi" yazısına və rəqəmlərə baxın.
