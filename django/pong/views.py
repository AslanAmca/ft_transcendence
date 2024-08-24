import json
import os
import requests
from datetime import datetime
from django.contrib.auth import login, logout, authenticate, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.core.files.base import ContentFile
from django.db.models import Count, Q
from django.db import transaction
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.utils import timezone
from django.contrib import messages
from django.views.decorators.cache import never_cache
from .forms import SignupForm, SigninForm, ProfileForm, PassChangeForm, FriendshipRequestForm, DynamicPlayerForm, \
    HistoryForm
from .models import PongUser, Friendship, GameHistory


@never_cache
def oauth_login(request):
    if request.user.is_authenticated:
        return redirect("game")

    authorize_url = "https://api.intra.42.fr/oauth/authorize"
    client_id = os.getenv('OAUTH_CLIENT_ID')
    redirect_uri = os.getenv('OAUTH_REDIRECT_URI')

    oauth_url = f"{authorize_url}?client_id={client_id}&redirect_uri={redirect_uri}&response_type=code&scope=public"

    return JsonResponse({'success': True, 'redirect_url': f"{oauth_url}"})


@never_cache
def oauth_callback(request):
    if request.user.is_authenticated:
        return redirect('game')

    error = request.GET.get('error')
    if error == 'access_denied':
        return redirect('signin')

    message = "There was an error caused by the OAuth provider. Try again or sign in with a local account."
    code = request.GET.get('code')
    if not code:
        messages.error(request, message)
        return redirect('signin')

    token_response = requests.post(
        url="https://api.intra.42.fr/oauth/token",
        data={
            'grant_type': 'authorization_code',
            'client_id': os.getenv('OAUTH_CLIENT_ID'),
            'client_secret': os.getenv('OAUTH_CLIENT_SECRET'),
            'code': code,
            'redirect_uri': os.getenv('OAUTH_REDIRECT_URI'),
        })

    if token_response.status_code != 200:
        messages.error(request, message)
        return redirect('signin')

    access_token = token_response.json().get('access_token')
    if not access_token:
        messages.error(request, message)
        return redirect('signin')

    user_info_response = requests.get(
        url="https://api.intra.42.fr/v2/me",
        headers={'Authorization': f'Bearer {access_token}'}
    )

    if user_info_response.status_code != 200:
        messages.error(request, message)
        return redirect('signin')

    user_info = user_info_response.json()
    login_info = user_info.get('login')
    username = f"{login_info}@ecole"
    display_name = f"{login_info}@ecole"
    first_name = user_info.get('first_name')
    last_name = user_info.get('last_name')
    avatar_url = user_info.get('image').get('link')

    # Kullanıcıyı get_or_create ile oluştur
    user, created = PongUser.objects.get_or_create(
        username=username,
        defaults={
            'display_name': display_name,
            'first_name': first_name,
            'last_name': last_name,
            'is_ecole': True,
        }
    )

    if created:
        user.set_unusable_password()
        avatar_response = requests.get(avatar_url)
        if avatar_response.status_code == 200:
            user.avatar.save(f"{user.username}.jpg", ContentFile(avatar_response.content), save=True)

    login(request, user)
    return redirect('game')


@never_cache
def signup(request):
    if request.user.is_authenticated:
        return redirect("game")

    if request.method != 'POST':
        return render(request, 'signup.html', {'form': SignupForm()})

    form = SignupForm(request.POST, request.FILES)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    try:
        form.save()
        return JsonResponse({'success': True})
    except Exception:
        return JsonResponse({'success': False, 'message': 'An unexpected error occurred.'})


@never_cache
def signin(request):
    next_url = request.GET.get('next') or request.POST.get('next')

    # Kullanıcı zaten oturum açtıysa, gitmesi gereken yere yönlendirilsin.
    # Tabi gitmek istediği yer bizim sitemizdeyse ve güvenliyse, yoksa ana sayfaya gitsin.
    if request.user.is_authenticated:
        if next_url and is_safe_next_url(next_url):
            return redirect(next_url)
        else:
            return redirect("game")

    if request.method != "POST":
        return render(request, 'singin.html', {'form': SigninForm()})

    form = SigninForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    username = form.cleaned_data.get('username')
    password = form.cleaned_data.get('password')
    user = authenticate(request, username=username, password=password)
    if not user:
        return JsonResponse({'success': False, 'message': "Username or password incorrect."})

    login(request, user)

    if next_url and is_safe_next_url(next_url):
        return JsonResponse({'success': True, 'redirect_url': f"{next_url}"})
    else:
        return JsonResponse({'success': True, 'redirect_url': "/"})


@never_cache
def signout(request):
    if request.user.is_authenticated:
        logout(request)

    return redirect('signin')


@never_cache
@login_required
def game(request):
    return render(request, 'game.html')


@never_cache
@login_required
def game_normal(request):
    player_name = request.user.display_name

    if request.method != "POST":
        form = DynamicPlayerForm(player1_name=player_name, player_count=2)
        return render(request, 'game_normal.html', {'form': form, 'timestamp': datetime.now().timestamp()})

    form = DynamicPlayerForm(request.POST, player1_name=player_name, player_count=2)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    # Tüm player isimlerini geri dön.
    players = list(form.cleaned_data.values())
    return JsonResponse({'success': True, 'players': players})


@never_cache
@login_required
def game_tournament_4(request):
    player_name = request.user.display_name

    if request.method != "POST":
        form = DynamicPlayerForm(player1_name=player_name, player_count=4)
        return render(request, 'game_tournament_4.html', {'form': form, 'timestamp': datetime.now().timestamp()})

    form = DynamicPlayerForm(request.POST, player1_name=player_name, player_count=4)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    # Tüm player isimlerini geri dön.
    players = list(form.cleaned_data.values())
    return JsonResponse({'success': True, 'players': players})


@never_cache
@login_required
def game_tournament_8(request):
    player_name = request.user.display_name

    if request.method != "POST":
        form = DynamicPlayerForm(player1_name=player_name, player_count=8)
        return render(request, 'game_tournament_8.html', {'form': form, 'timestamp': datetime.now().timestamp()})

    form = DynamicPlayerForm(request.POST, player1_name=player_name, player_count=8)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    # Tüm player isimlerini geri dön.
    players = list(form.cleaned_data.values())
    return JsonResponse({'success': True, 'players': players})


@never_cache
@login_required
def game_save(request):
    if request.method != "POST":
        return redirect("game")

    user = request.user

    try:
        data = json.loads(request.body)
        player1 = data.get('player1')
        player2 = data.get('player2')
        winner = data.get('winner')

        # Verilerde hata varsa geri dön
        if not player1 or not player2 or not winner:
            return JsonResponse({'success': False, "message": "Invalid player data"})

        # Eğer playerlardan birisi giriş yapan kullanıcı değilse kaydetme
        if user.display_name != player1 and user.display_name != player2:
            return JsonResponse({'success': True})

        # Buraya geldiyse oyunu giriş yapan kullanıcı oynamış demektir.
        # Giriş yapan kullanıcı her zaman sol tarafta olacak, yani player 1 olacak.
        if winner == player1:
            status = GameHistory.STATUS_WIN
        else:
            status = GameHistory.STATUS_LOSE

        new_game_history = GameHistory(user=user, user_display_name=player1, rival_display_name=player2, status=status)
        new_game_history.save()
        return JsonResponse({'success': True})

    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON."})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
@login_required
def game_history(request):
    if request.method != "POST":
        return render(request, 'game_history.html', {'form': HistoryForm()})

    form = HistoryForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    username = form.cleaned_data['username']
    try:
        user = PongUser.objects.get(username=username)
        matchs = GameHistory.objects.filter(user=user).order_by('-id')
        history = []

        for match in matchs:
            history.append({
                'user_name': user.username,
                'user_display_name': match.user_display_name,
                'rival_display_name': match.rival_display_name,
                'status': match.status,
                'datetime': match.datetime.strftime("%Y-%m-%d %H:%M:%S")
            })

        return JsonResponse({'success': True, 'history': history})

    except PongUser.DoesNotExist:
        return JsonResponse({'success': False, "message": "User not found"})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON format"})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
@login_required
def profile(request):
    user = request.user

    # Kullanıcı avatar değiştirebilir veya manuel olarak silebilir
    # Güvenlik nedeniyle varsa eski avatarını yakalayalım.
    old_avatar_url = user.avatar.url if user.avatar else ""
    old_avatar_path = user.avatar.path if user.avatar else ""

    # Eğer kullanıcının veritabanında kayıtlı olan avatarı dosya olarak yoksa veritabanından da kaldır
    if old_avatar_path and not os.path.isfile(old_avatar_path):
        user.avatar.delete()

    # Gelen istek POST değilse bilgileri ve istatistikleri dön
    if request.method != "POST":
        # Kullanıcının kazandığı ve kaybettiği oyunların toplam sayısını al
        stats = GameHistory.objects.filter(user=user).aggregate(
            win_count=Count('status', filter=Q(status=GameHistory.STATUS_WIN)),
            lose_count=Count('status', filter=Q(status=GameHistory.STATUS_LOSE))
        )

        return render(request, 'profile.html', {
            'form': ProfileForm(instance=user),
            'win_count': stats['win_count'],
            'lose_count': stats['lose_count']
        })

    form = ProfileForm(request.POST, request.FILES, instance=user)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    if not form.has_changed():
        return JsonResponse({
            'success': True,
            'type': "info",
            'message': "No changes were made to your profile information."
        })

    try:
        # Kullanıcı form da yeni avatar seçtiyse, eski avatarını sil (varsa)
        if "avatar" in request.FILES and old_avatar_url and os.path.isfile(old_avatar_path):
            os.remove(old_avatar_path)

        form.save()

        # Avatar değişmiş olabilir, bu nedenle her ihtimale karşı avatar'ın urlini gönder.
        new_avatar_url = user.avatar.url if user.avatar else ""

        # Yanıt nesnesi oluştur
        response_data = {
            'success': True,
            'message': "Profile information has been successfully updated."
        }

        # Eski ve yeni avatarı karşılaştır, farklılık varsa yanıt nesnesine avatar URL'sini ekle.
        if old_avatar_url != new_avatar_url:
            response_data['new_avatar_url'] = new_avatar_url

        return JsonResponse(response_data)

    except Exception:
        return JsonResponse({'success': False, 'message': 'An unexpected error occurred.'})


@never_cache
@login_required
def change_password(request):
    # Ecole üzerinden giriş yapan birisinin şifresi olmayacak.
    # Bu nedenle ana sayfaya yönlendirmek güvenli olur.
    if request.user.is_ecole:
        return redirect("game")

    if request.method != "POST":
        return render(request, 'change_password.html', {'form': PassChangeForm(user=request.user)})

    form = PassChangeForm(user=request.user, data=request.POST)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    new_password = form.cleaned_data.get('new_password1')
    if check_password(new_password, request.user.password):
        return JsonResponse({
            'success': False,
            'message': "The new password cannot be the same as the current password."
        })

    try:
        form.save()
        update_session_auth_hash(request, form.user)  # Şifre değişikliği sonrası oturumu güncelle
        return JsonResponse({'success': True, 'message': "Your password has been successfully updated."})
    except Exception:
        return JsonResponse({'success': False, 'message': 'An unexpected error occurred.'})


@never_cache
@login_required
def account_data(request):
    return render(request, 'account_data.html')


@never_cache
@login_required
def download_account(request):
    user = request.user

    # Kullanıcı temel bilgileri
    data = {
        'username': user.username,
        'display_name': user.display_name,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_ecole': user.is_ecole,
        'avatar': user.avatar.name if user.avatar else None,
        'date_joined': user.date_joined.strftime("%Y-%m-%d %H:%M:%S"),
        'last_login': user.last_login.strftime("%Y-%m-%d %H:%M:%S")
    }

    # Oyun geçmişi
    matchs = GameHistory.objects.filter(user=user).order_by('-id')
    history = []
    for match in matchs:
        history.append({
            'user_display_name': match.user_display_name,
            'rival_display_name': match.rival_display_name,
            'status': match.status,
            'datetime': match.datetime.strftime("%Y-%m-%d %H:%M:%S")
        })
    data['game_history'] = history

    # Arkadaş listesi
    friendships = Friendship.objects.filter((Q(from_user=user) | Q(to_user=user)), status=Friendship.STATUS_ACCEPTED)
    friends = []
    for friendship in friendships:
        if friendship.from_user == user:
            friends.append(friendship.to_user.username)
        else:
            friends.append(friendship.from_user.username)
    data['friends'] = friends

    # Veriyi JSON formatınd çevir ve indirilebilecek formata çevir
    response = HttpResponse(json.dumps(data, indent=4), content_type='application/json')
    response['Content-Disposition'] = f'attachment; filename="{user.username}_data.json"'
    return response


@never_cache
@login_required
@transaction.atomic
def delete_account(request):
    if request.method != "POST":
        return redirect("profile")

    user = request.user
    avatar_path = user.avatar.path if user.avatar else ""

    try:
        # Oyun geçmişini sil
        GameHistory.objects.filter(user=user).delete()

        # Arkadaşlıkları sil
        Friendship.objects.filter(Q(from_user=user) | Q(to_user=user)).delete()

        # Hesabı sil
        user.delete()

        # Eğer avatarı varsa ve dosya kaydedilmişse onu da sil.
        if avatar_path and os.path.isfile(avatar_path):
            os.remove(avatar_path)

        # Çıkış yap
        logout(request)

        return JsonResponse({'success': True})

    except Exception:
        # Hata durumunda geri almayı sağlamak için
        transaction.set_rollback(True)

        return JsonResponse({'success': False, 'message': "An unexpected error occurred."})


@never_cache
@login_required
def friends(request):
    user_friends = request.user.get_all_friends()
    return render(request, 'friends.html', {'user_friends': user_friends})


@never_cache
@login_required
def friend_delete(request):
    if request.method != "POST":
        return redirect("friends")

    try:
        data = json.loads(request.body)
        friendship_id = data.get('friendship_id')
        if not friendship_id:
            return JsonResponse({'success': False, "message": "Invalid friendship id."})

        friend = Friendship.objects.get(id=friendship_id)
        friend.delete()
        return JsonResponse({'success': True})

    except Friendship.DoesNotExist:
        return JsonResponse({'success': False, "message": "Friendship not found or already deleted."})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON."})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
@login_required
def friend_requests(request):
    if request.method != "POST":
        return render(request, 'friend_requests.html', {
            'form': FriendshipRequestForm(),
            'sent_requests': request.user.get_sent_friend_requests(),
            'received_requests': request.user.get_received_friend_requests(),
        })

    form = FriendshipRequestForm(request.POST)
    if not form.is_valid():
        return JsonResponse({'success': False, 'form_errors': form.errors})

    to_username = form.cleaned_data['to_username']
    try:
        to_user = request.user.send_friend_request(to_username)
        return JsonResponse({
            'success': True,
            'friend': {
                'username': to_user.username,
                'display_name': to_user.display_name,
                'first_name': to_user.first_name,
                'last_name': to_user.last_name,
                'friendship_id': Friendship.objects.latest('id').id
            }
        })
    except ValueError as e:
        error_message = str(e)
        friendship_id, message = error_message.split(': ', 1)
        response_data = {'success': False, 'message': message}

        if friendship_id:
            response_data['friendship_id'] = friendship_id
            response_data['username'] = to_username

        return JsonResponse(response_data)


@never_cache
@login_required
def friend_request_accept(request):
    if request.method != "POST":
        return redirect("friend-requests")

    try:
        data = json.loads(request.body)
        friendship_id = data.get('friendship_id')
        if not friendship_id:
            return JsonResponse({'success': False, "message": "Invalid friendship id."})

        friendship = Friendship.objects.get(id=friendship_id, status=Friendship.STATUS_PENDING)
        friendship.accept()
        return JsonResponse({'success': True})

    except Friendship.DoesNotExist:
        return JsonResponse({'success': False, "message": "Friend request not found or already accepted."})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON."})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
@login_required
def friend_request_reject(request):
    if request.method != "POST":
        return redirect("friend-requests")

    try:
        data = json.loads(request.body)
        friendship_id = data.get('friendship_id')
        if not friendship_id:
            return JsonResponse({'success': False, "message": "Invalid friendship id."})

        friendship = Friendship.objects.get(id=friendship_id, status=Friendship.STATUS_PENDING)
        friendship.reject()
        return JsonResponse({'success': True})

    except Friendship.DoesNotExist:
        return JsonResponse({'success': False, "message": "Friend request not found or already rejected."})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON."})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
@login_required
def friend_request_delete(request):
    if request.method != "POST":
        return redirect("friend-requests")

    try:
        data = json.loads(request.body)
        friendship_id = data.get('friendship_id')
        if not friendship_id:
            return JsonResponse({'success': False, "message": "Invalid friendship id."})

        friend = Friendship.objects.get(id=friendship_id)
        if friend.status == Friendship.STATUS_ACCEPTED:
            return JsonResponse({'success': False, "message": "This friend request has already been accepted."})
        elif friend.status == Friendship.STATUS_REJECTED:
            return JsonResponse({'success': False, "message": "This friend request has already been rejected."})

        friend.delete()
        return JsonResponse({'success': True})

    except Friendship.DoesNotExist:
        return JsonResponse({'success': False, "message": "Friendship not found or already deleted."})
    except json.JSONDecodeError:
        return JsonResponse({'success': False, "message": "Invalid JSON."})
    except KeyError as e:
        return JsonResponse({'success': False, "message": f"Missing data: {str(e)}"})
    except Exception:
        return JsonResponse({'success': False, "message": "An unexpected error occurred."})


@never_cache
def update_last_login(request):
    if request.user.is_authenticated:
        request.user.last_login = timezone.now()
        request.user.save()
        return JsonResponse({'authenticated': True})
    else:
        return JsonResponse({'authenticated': False})


@never_cache
def privacy_policy(request):
    return render(request, 'privacy_policy.html')


# Helper, not view
def is_safe_next_url(next_url):
    # Gidilebilecek sayfaların listesi
    allowed_urls = [
        '/',
        '/game/normal/',
        '/game/tournament-4/',
        '/game/tournament-8/',
        '/game/history/',
        '/privacy-policy/',
        '/friends/',
        '/friend-requests/',
        '/profile/',
        '/change-password/',
        '/account-data/',
        '/signin/',
        '/signup/'
    ]
    return next_url in allowed_urls
