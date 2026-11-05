# Admin girişi və paylaşılan qrafiklər

## Necə işləyir

| Kim | Giriş | Nə edə bilər |
|---|---|---|
| İşçi | Soyad Ad (Firebase anonim giriş, dəyişməyib) | Paylaşılan qrafikləri **yalnız oxuyur**; onlar tətbiqdə avtomatik görünür |
| Admin | "Admin girişi" → e-poçt + şifrə | Qrafik **yükləyir, yeniləyir, silir** |

- Admin hüququ **serverdə** saxlanılır: Firebase Auth Custom Claim `admin: true`.
  Bu claim yalnız Firebase Admin SDK ilə (aşağıdakı skript) təyin olunur. Tətbiq onu dəyişə bilmir.
- Tətbiq claim-i yalnız admin panelini göstərmək üçün oxuyur. **Əsl qoruma Firestore qaydalarındadır**
  (`firestore.rules`): claim olmayan heç kim, hətta tətbiqi dəyişdirsə belə, yaza və ya silə bilmir.
- Admin UID tətbiqin kodunda yoxlanılmır və saxlanılmır.
- Qrafiklər Firestore-da `schedules/{növ_başlanğıc_son}` sənədlərində saxlanılır
  (məs. `main_2026-10-27_2026-11-01`, `operator_2026-11-02_2026-11-08`). Eyni dövr təkrar yüklənəndə köhnəsi əvəzlənir.
- İşçinin tətbiqi qrafiki mövcud idxal məntiqi ilə tətbiq edir (versiya, tarixçə, operator əlavələri saxlanılır).
  Admin qrafiki silərsə, həmin qrafikdən gələn çəkilişlər işçilərdən də silinir.

## 1. Firebase Console-da bir dəfəlik hazırlıq

1. **Authentication → Sign-in method**: **Email/Password** aktiv olsun (Anonymous artıq aktivdir).
2. **Authentication → Users**: admin hesabı (UID `XnDKUJBTdvZN2lW5lnAD3cvDy7q1`) e-poçt/şifrə hesabı olmalıdır.
3. **Firestore Database → Create database**: istehsal rejimi (**Start in production mode**), region `eur3` və ya `europe-west`.
   İstehsal rejimində hər şey bağlıdır — qaydalar yayımlanana qədər heç kim yaza bilmir.

## 2. Admin hüququnu serverdə aktivləşdirmək

Skript: `admin-tools/set-admin.mjs`. **Yalnız etibarlı mühitdə** işlədin.

### Variant A — Google Cloud Shell (tövsiyə olunur, açar faylı lazım deyil)

1. https://console.cloud.google.com/ → yuxarıda layihə **cbc-sport-broadcast** → sağ yuxarıda **Activate Cloud Shell** (`>_`).
2. Cloud Shell-də:
   ```bash
   git clone https://github.com/Elekberoglu/cbc-sport-broadcast.git
   cd cbc-sport-broadcast/admin-tools
   npm install firebase-admin
   gcloud config set project cbc-sport-broadcast
   gcloud auth application-default login          # brauzerdə layihə sahibi hesabı ilə təsdiqləyin
   gcloud auth application-default set-quota-project cbc-sport-broadcast
   node set-admin.mjs show  XnDKUJBTdvZN2lW5lnAD3cvDy7q1
   node set-admin.mjs grant XnDKUJBTdvZN2lW5lnAD3cvDy7q1   # "bəli" yazıb təsdiqləyin
   ```
3. Nəticədə `Claim-lər: {"admin":true}` görünməlidir.

### Variant B — öz kompüteriniz (xidmət hesabı açarı ilə)

1. Firebase Console → ⚙️ Project settings → **Service accounts** → **Generate new private key**.
2. Faylı **layihə qovluğundan kənarda** saxlayın (məs. `C:\Users\<siz>\Documents\cbc-admin-key.json`).
   Bu faylı **heç vaxt** GitHub-a, WhatsApp-a, tətbiqə qoymayın. Skript açar layihə qovluğundadırsa, işləməkdən imtina edir.
3. Windows PowerShell:
   ```powershell
   cd cbc-sport-broadcast\admin-tools
   npm install firebase-admin
   $env:GOOGLE_APPLICATION_CREDENTIALS="C:\Users\<siz>\Documents\cbc-admin-key.json"
   node set-admin.mjs grant XnDKUJBTdvZN2lW5lnAD3cvDy7q1
   ```
4. İşiniz bitəndən sonra açar faylını silin və Google Cloud Console → IAM → Service accounts → açarlar
   bölməsindən həmin açarı da **Delete** edin.

### Sonra
- Tətbiqdə **Admin girişi** → e-poçt + şifrə ilə daxil olun. Profildə "Bulud: qoşulub (admin)" yazmalıdır.
- Hüququ geri almaq: `node set-admin.mjs revoke <UID>` (bütün sessiyalar da bağlanır).

## 3. Firestore qaydalarını yoxlamaq və yayımlamaq

Qaydalar avtomatik yayımlanmır. Əvvəl yoxlayın:

### Yoxlama (ən azı biri)
- **Rules Playground** (asan): Firebase Console → Firestore → **Rules** → `firestore.rules` faylının mətnini yapışdırın
  (hələ **Publish** etməyin) → **Rules Playground**:
  | Simulyasiya | Yol | Auth | Gözlənilən |
  |---|---|---|---|
  | get | `schedules/main_2026-11-02_2026-11-08` | Authenticated, provider `anonymous` | ✅ Allowed |
  | get | eyni | Unauthenticated | ❌ Denied |
  | create | eyni | Authenticated, provider `anonymous` | ❌ Denied |
  | delete | eyni | Authenticated, provider `password`, token-ə `{"admin": true}` | ✅ Allowed |
  | delete | eyni | Authenticated, provider `password`, claim yoxdur | ❌ Denied |
- **Avtomatik testlər (emulyator)**: Node.js 18+, Java 11+, `npm i -g firebase-tools`, sonra
  `cd admin-tools && npm install && npm run test:rules` — bütün testlər `✔` olmalıdır.

### Yayımlamaq (yoxlamadan sonra)
- **Console ilə**: Firestore → Rules → mətni yapışdırın → **Publish**.
- **CLI ilə**: layihə kökündə `firebase login` → `firebase deploy --only firestore:rules`.

## Təhlükəsizlik qeydləri
- Admin SDK açarı və şifrələr repoda və tətbiqdə yoxdur. `.gitignore` açar fayllarını bloklayır,
  amma GitHub-a veb interfeysdən (sürüşdürüb) yükləyəndə `.gitignore` işləmir — açarı layihə qovluğuna qoymayın.
- Admin şifrəsi güclü olsun. Mümkünsə Firebase-də e-poçt sahibliyini təsdiqləyin.
- İstəsəniz sonradan **App Check** əlavə etmək olar ki, Firestore-a yalnız rəsmi tətbiq qoşulsun.
