## Kurulum

Projeyi klonladıktan sonra, proje dizininde `.env` dosyasını oluşturmanız gerekmektedir. `.env` dosyası aşağıdaki formatta olmalıdır:

### Örnek .env Dosyası İçeriği

```bash
# Django
SECRET_KEY=django-insecure-=i!rw*37#o=!y70%hbaq!=9e+m3*(+jo=@$#ki!gws=3p5oikr

# OAuth With Ecole
OAUTH_CLIENT_ID=u-s4t2ud-602dc098a2c0f7801f677bbfb7b21398d8b9d28925bb3a4af2f15f0e120fa407
OAUTH_CLIENT_SECRET=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
OAUTH_REDIRECT_URI=https://localhost/oauth/callback/

# PostgreSQL Environment Variables
POSTGRES_DB=pong
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pass123
