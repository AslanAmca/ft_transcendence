#!/bin/bash

# Veritabanı için migration oluştur
python manage.py makemigrations pong

# Veritabanı migrationlarını uygula
python manage.py migrate

# Statik dosyaları topla
python manage.py collectstatic --noinput

# Uygulamayı başlat
exec gunicorn pong.wsgi:application --bind 0.0.0.0:8000
