from django import forms
from django.contrib.auth.forms import UserCreationForm, PasswordChangeForm
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, MaxLengthValidator
from .models import PongUser


class SigninForm(forms.Form):
    username = forms.CharField(
        label='Username',
        required=True,
        min_length=3,
        max_length=30
    )
    password = forms.CharField(
        widget=forms.PasswordInput,
        label='Password',
        required=True,
        min_length=3,
        max_length=30
    )

    def __init__(self, *args, **kwargs):
        super(SigninForm, self).__init__(*args, **kwargs)

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean_username(self):
        invalid_endings = ['ecole', 'ecole42', 'ecole_42']
        username = self.cleaned_data.get('username')
        if username and username.endswith(tuple(invalid_endings)):
            raise ValidationError("The username must not end with ecole or ecole42.")
        return username

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class SignupForm(UserCreationForm):
    privacy_policy = forms.BooleanField(
        required=True,
        error_messages={'required': 'You have to accept our privacy policy.'}
    )

    class Meta(UserCreationForm.Meta):
        model = PongUser
        fields = ['username', 'password1', 'password2', 'display_name', 'first_name', 'last_name', 'avatar']

    def __init__(self, *args, **kwargs):
        super(SignupForm, self).__init__(*args, **kwargs)

        # Minimum ve Maximum karakter sayısı olsun
        self.fields['password1'].validators.extend([
            MinLengthValidator(3),
            MaxLengthValidator(30),
        ])

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean_username(self):
        invalid_endings = ['ecole', 'ecole42', 'ecole_42']
        username = super().clean_username()
        if username and username.endswith(tuple(invalid_endings)):
            raise ValidationError("The username must not end with ecole, ecole42 or ecole_42.")
        return username

    def clean_display_name(self):
        invalid_endings = ['ecole', 'ecole42', 'ecole_42']
        display_name = self.cleaned_data.get('display_name')
        if display_name and display_name.endswith(tuple(invalid_endings)):
            raise forms.ValidationError("The display name must not end with ecole, ecole42 or ecole_42.")
        return display_name

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class ProfileForm(forms.ModelForm):
    class Meta:
        model = PongUser
        fields = ['first_name', 'last_name', 'display_name', 'avatar']

    def __init__(self, *args, **kwargs):
        super(ProfileForm, self).__init__(*args, **kwargs)

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean_display_name(self):
        invalid_endings = ['ecole', 'ecole42', 'ecole_42']
        display_name = self.cleaned_data.get('display_name')
        username = self.instance.username

        if display_name.endswith(tuple(invalid_endings)) and not username.endswith('@ecole'):
            raise forms.ValidationError("The display name must not end with ecole or ecole42.")
        return display_name

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class PassChangeForm(PasswordChangeForm):
    def __init__(self, *args, **kwargs):
        super(PassChangeForm, self).__init__(*args, **kwargs)

        # Minimum ve Maximum karakter sayısı olsun
        self.fields['new_password1'].validators.extend([
            MinLengthValidator(3),
            MaxLengthValidator(30),
        ])

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class FriendshipRequestForm(forms.Form):
    to_username = forms.CharField(
        label='Username',
        required=True,
        min_length=3,
        max_length=30
    )

    def __init__(self, *args, **kwargs):
        super(FriendshipRequestForm, self).__init__(*args, **kwargs)

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class HistoryForm(forms.Form):
    username = forms.CharField(
        label='Username',
        required=True,
        min_length=3,
        max_length=30
    )

    def __init__(self, *args, **kwargs):
        super(HistoryForm, self).__init__(*args, **kwargs)

        # Tüm form alanlarına bootstrap classları veriyoruz
        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label
            # Autocapitalize özniteliğini kaldır, Chrome dışında desteklenmiyor
            if 'autocapitalize' in visible.field.widget.attrs:
                del visible.field.widget.attrs['autocapitalize']

        # Eğer hata varsa daha net görülmesi için bootstrap class'ı ekliyoruz
        if self.errors:
            for key in self.errors:
                self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean(self):
        cleaned_data = super().clean()

        for key, name in list(cleaned_data.items()):
            if not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")

        return cleaned_data


class DynamicPlayerForm(forms.Form):
    def __init__(self, *args, **kwargs):
        player1_name = kwargs.pop('player1_name', '')
        player_count = kwargs.pop('player_count', 2)
        super(DynamicPlayerForm, self).__init__(*args, **kwargs)

        self.fields['player1'] = forms.CharField(
            label='Player 1',
            required=True,
            min_length=3,
            max_length=30,
            initial=player1_name,
            widget=forms.TextInput(attrs={'readonly': 'readonly'})
        )

        for i in range(2, player_count + 1):
            self.fields[f'player{i}'] = forms.CharField(label=f'Player {i}', required=True, min_length=3,
                                                        max_length=30)

        for visible in self.visible_fields():
            visible.field.widget.attrs['class'] = 'form-control'
            visible.field.widget.attrs['placeholder'] = visible.field.label

        if self.errors:
            for key in self.errors:
                if key in self.fields:
                    self.fields[key].widget.attrs['class'] += ' is-invalid'

    def clean(self):
        cleaned_data = super().clean()
        player_names = [cleaned_data.get('player1')]
        existing_users = list(PongUser.objects.values_list('display_name', flat=True))

        for key, name in list(cleaned_data.items()):
            if key == "player1" or not isinstance(name, str):
                continue
            if any(c.isspace() for c in name):
                self.add_error(key, "This field cannot contain spaces.")
            elif name in player_names:
                self.add_error(key, "This field must be unique.")
            elif name in existing_users:
                self.add_error(key, "This value is already taken by a registered real user.")
            else:
                player_names.append(name)

        return cleaned_data
