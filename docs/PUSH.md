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

## Pulsuz variant (tövsiyə olunur): GitHub Actions server rolunda

Blaze planı və kart **lazım deyil**. `.github/workflows/notify.yml` hər ~5 dəqiqədən bir `notifier/notify.mjs` skriptini işlədir:
son 24 saatda dərc olunmuş və hələ bildirişi göndərilməmiş versiyalar üçün yuxarıdakı qaydalarla **bir** bildiriş göndərir.
- Gecikmə: adətən 5–15 dəqiqə (GitHub planlaşdırılmış işləri bəzən gecikdirir).
- Açar faylı yoxdur: GitHub OIDC → Google **Workload Identity Federation** → `cbc-notifier` xidmət hesabı.
  Giriş yalnız `Elekberoglu/cbc-sport-broadcast` reposunun `main` budağından mümkündür.
- Xidmət hesabının hüquqları: Firestore (oxuma/yazma), FCM göndərmə, istifadəçi siyahısını oxuma.
- GitHub 60 gün fəaliyyəti olmayan repoda planlaşdırılmış işləri dayandırır — belə olsa, Actions → "Cədvəl bildirişi" → **Enable workflow**.

### Bir dəfəlik quraşdırma (Google Cloud Shell)
```bash
PROJECT=cbc-sport-broadcast; SA=cbc-notifier@$PROJECT.iam.gserviceaccount.com
gcloud config set project $PROJECT
gcloud services enable iamcredentials.googleapis.com sts.googleapis.com fcm.googleapis.com
gcloud iam service-accounts create cbc-notifier --display-name="CBC push (GitHub Actions)"
for R in roles/datastore.user roles/firebasecloudmessaging.admin roles/firebaseauth.viewer; do
  gcloud projects add-iam-policy-binding $PROJECT --member="serviceAccount:$SA" --role=$R --condition=None -q >/dev/null; done
gcloud iam workload-identity-pools create github --location=global --display-name="GitHub Actions"
gcloud iam workload-identity-pools providers create-oidc github --location=global --workload-identity-pool=github \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" \
  --attribute-condition="assertion.repository=='Elekberoglu/cbc-sport-broadcast' && assertion.ref=='refs/heads/main'"
gcloud iam service-accounts add-iam-policy-binding $SA --role=roles/iam.workloadIdentityUser \
  --member="principalSet://iam.googleapis.com/projects/722958292611/locations/global/workloadIdentityPools/github/attribute.repository/Elekberoglu/cbc-sport-broadcast"
```
Sonra Firestore qaydalarını yeniləyin (`devices` bölməsi əlavə olunub) və GitHub → Actions → "Cədvəl bildirişi" → **Run workflow** ilə yoxlayın.

## Alternativ: Cloud Function (Blaze planı)

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
