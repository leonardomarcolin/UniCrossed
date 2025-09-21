# projeto/urls.py
from django.contrib import admin
from django.urls import path, include
from accounts.views import MySignupView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("accounts/signup/", MySignupView.as_view(), name="account_signup"),
    path("accounts/", include("allauth.urls")),
    path('', include('accounts.urls')),
    path('accounts/', include('accounts.urls'))
]
