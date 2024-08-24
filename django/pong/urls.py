from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from pong import views

urlpatterns = [
    path('', views.game, name='game'),
    path('game/normal/', views.game_normal, name='game_normal'),
    path('game/tournament-4/', views.game_tournament_4, name='game_tournament_4'),
    path('game/tournament-8/', views.game_tournament_8, name='game_tournament_8'),
    path('game/save/', views.game_save, name='game_save'),
    path('game/history/', views.game_history, name='game_history'),
    path('friends/', views.friends, name='friends'),
    path('friend-delete/', views.friend_delete, name='friend_delete'),
    path('friend-requests/', views.friend_requests, name='friend_requests'),
    path('friend-request-accept/', views.friend_request_accept, name='friend_request_accept'),
    path('friend-request-reject/', views.friend_request_reject, name='friend_request_reject'),
    path('friend-request-delete/', views.friend_request_delete, name='friend_request_delete'),
    path('update-last-login/', views.update_last_login, name='update_last_login'),
    path('profile/', views.profile, name='profile'),
    path('change-password/', views.change_password, name='change_password'),
    path('account-data/', views.account_data, name='account_data'),
    path('download-account/', views.download_account, name='download_account'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('signin/', views.signin, name='signin'),
    path('signup/', views.signup, name='signup'),
    path('signout/', views.signout, name='signout'),
    path('oauth/login/', views.oauth_login, name='oauth_login'),
    path('oauth/callback/', views.oauth_callback, name='oauth_callback'),
    path('privacy-policy/', views.privacy_policy, name='privacy_policy')
]
