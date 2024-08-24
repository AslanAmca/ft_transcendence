FROM python

# Çalışma dizinini ayarla
WORKDIR /home/app

# Gereksinimleri kopyala
COPY ./requirements.txt .

# Gereksinimleri yükle
RUN pip install --no-cache-dir -r requirements.txt

# Uygulama dosyalarını kopyala
COPY . .

# Yetkisini ayarla
RUN chmod +x ./entrypoint.sh

# entrypoint.sh betiğini çalıştır
ENTRYPOINT ["./entrypoint.sh"]