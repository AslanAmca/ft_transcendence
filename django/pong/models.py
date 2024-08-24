from django.contrib.auth.models import AbstractUser
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.core.validators import MinLengthValidator
from django.utils import timezone
from django.db import models


class PongUser(AbstractUser):
    username = models.CharField(max_length=30, unique=True,
                                validators=[UnicodeUsernameValidator(), MinLengthValidator(3)])
    first_name = models.CharField(max_length=30, validators=[MinLengthValidator(3)])
    last_name = models.CharField(max_length=30, validators=[MinLengthValidator(3)])

    # Yeni alanlar
    display_name = models.CharField(max_length=30, unique=True, validators=[MinLengthValidator(3)])
    avatar = models.ImageField(upload_to='avatars/', blank=True)
    is_ecole = models.BooleanField(default=False, blank=False)
    friends = models.ManyToManyField("self", through="Friendship", symmetrical=False, blank=True)

    # Arkadaşları ve durumlarını çek
    def get_all_friends(self):
        friendships = Friendship.objects.filter(
            (models.Q(from_user=self) | models.Q(to_user=self)) & models.Q(status=Friendship.STATUS_ACCEPTED)
        ).select_related('from_user', 'to_user').order_by('-id')

        friends_info = []
        for friendship in friendships:
            if friendship.from_user == self:
                friend_user = friendship.to_user
            else:
                friend_user = friendship.from_user

            # Kullanıcının son giriş zamanını kontrol et
            if friend_user.last_login and (timezone.now() - friend_user.last_login).total_seconds() >= 20:
                status = 'offline'
            else:
                status = 'online'

            # Arkadaşın bilgilerini ve durumunu friends_info listesine ekle
            friends_info.append({
                'friendship_id': friendship.id,
                'username': friend_user.username,
                'display_name': friend_user.display_name,
                'first_name': friend_user.first_name,
                'last_name': friend_user.last_name,
                'status': status
            })

        return friends_info

    # Kullanıcının gönderdiği bekleyen arkadaşlık isteklerini çek
    def get_sent_friend_requests(self):
        sent_requests = Friendship.objects.filter(
            from_user=self,
            status=Friendship.STATUS_PENDING
        ).select_related('to_user').order_by('-id')

        sent_requests_info = []
        for friendship in sent_requests:
            sent_requests_info.append({
                'friendship_id': friendship.id,
                'username': friendship.to_user.username,
                'display_name': friendship.to_user.display_name,
                'first_name': friendship.to_user.first_name,
                'last_name': friendship.to_user.last_name,
            })
        return sent_requests_info

    # Kullanıcının aldığı bekleyen arkadaşlık isteklerini çek
    def get_received_friend_requests(self):
        received_requests = Friendship.objects.filter(
            to_user=self,
            status=Friendship.STATUS_PENDING
        ).select_related('from_user').order_by('-id')

        received_requests_info = []
        for friendship in received_requests:
            received_requests_info.append({
                'friendship_id': friendship.id,
                'username': friendship.from_user.username,
                'display_name': friendship.from_user.display_name,
                'first_name': friendship.from_user.first_name,
                'last_name': friendship.from_user.last_name,
            })
        return received_requests_info

    # Arkadaşlık isteği gönder, hataları ele al.
    def send_friend_request(self, to_username):
        try:
            to_user = PongUser.objects.get(username=to_username)
            if self == to_user:
                raise ValueError(": You cannot send a friend request to yourself.")

            existing_friendship = Friendship.objects.filter(
                (models.Q(from_user=self, to_user=to_user) | models.Q(from_user=to_user, to_user=self))
            ).first()

            if existing_friendship:
                if existing_friendship.status == Friendship.STATUS_ACCEPTED:
                    raise ValueError(f"{existing_friendship.id}: You are already friends with '{to_username}'.")
                elif existing_friendship.status == Friendship.STATUS_PENDING:
                    if existing_friendship.from_user == self:
                        raise ValueError(f": You have already sent a friend request to '{to_username}'.")
                    elif existing_friendship.to_user == self:
                        raise ValueError(f": '{to_username}' has already sent you a friend request. You can accept it.")
                elif existing_friendship.status == Friendship.STATUS_REJECTED:
                    if existing_friendship.from_user == self:
                        raise ValueError(
                            f"{existing_friendship.id}: Your previous friend request sent to '{to_username}' has been rejected. You cannot send it again.")
                    elif existing_friendship.to_user == self:
                        existing_friendship.delete()

            Friendship.objects.create(from_user=self, to_user=to_user)
            return to_user

        except PongUser.DoesNotExist:
            raise ValueError(f": '{to_username}' does not exist.")
        except ValueError as ve:
            raise ve
        except Exception:
            raise ValueError(": An unexpected error occurred.")


class Friendship(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_ACCEPTED = 'accepted'
    STATUS_REJECTED = 'rejected'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_ACCEPTED, 'Accepted'),
        (STATUS_REJECTED, 'Rejected'),
    ]
    from_user = models.ForeignKey(PongUser, on_delete=models.CASCADE, related_name='sent_friendships')
    to_user = models.ForeignKey(PongUser, on_delete=models.CASCADE, related_name='received_friendships')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default=STATUS_PENDING)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['from_user', 'to_user'], name='unique_friendship')
        ]

    def accept(self):
        self.status = self.STATUS_ACCEPTED
        self.save()

    def reject(self):
        self.status = self.STATUS_REJECTED
        self.save()


class GameHistory(models.Model):
    STATUS_WIN = 'Win'
    STATUS_LOSE = 'Lose'

    STATUS_CHOICES = [
        (STATUS_WIN, 'Win'),
        (STATUS_LOSE, 'Lose'),
    ]

    user = models.ForeignKey(PongUser, on_delete=models.CASCADE, related_name='game_histories')
    user_display_name = models.CharField(max_length=30, validators=[MinLengthValidator(3)])
    rival_display_name = models.CharField(max_length=30, validators=[MinLengthValidator(3)])
    status = models.CharField(max_length=10, choices=STATUS_CHOICES)
    datetime = models.DateTimeField(auto_now_add=True)
