def cookie_policy(request):
    return {'cookie_policy': request.COOKIES.get('cookiepolicy')}
