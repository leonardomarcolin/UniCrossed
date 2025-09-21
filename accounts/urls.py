from django.conf.global_settings import LOGOUT_REDIRECT_URL
from django.urls import path, include
from accounts.views import MySignupView
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('signup/', MySignupView.as_view(), name="account_signup"),
    path('accounts/', include('allauth.urls')),
    path('linkeds/', views.linkeds, name='linkeds'),  # Altera
    path('landingpage/', views.landingpage, name='landingpage'),
    path('configuracoes/', views.configuracoes, name='configuracoes'),
    path('like/<int:user_id>/', views.like, name='like'),
    path('dislike/<int:user_id>/', views.dislike, name='dislike'),
    path('superlike/<int:user_id>/', views.superlike, name='superlike'),
    path('pegar-proximo-perfil/', views.pegar_proximo_perfil, name='pegar_proximo_perfil'),
    path('configuracoes/user-profile/', views.user_profile, name='user_profile'),
    path('configuracoes/config-profile/', views.config_profile, name='config-profile'),
    path('configuracoes/editar-perfil/', views.configurar_profile, name='configurar_profile'),
    path('api/perfil-usuario/', views.api_perfil_usuario, name='api_perfil_usuario'),
    path('api/linkeds/', views.api_linkeds, name='api_linkeds'),
    path('api/grupos-estudo/', views.api_grupos_estudo, name='api_grupos_estudo'),
    path('api/grupos-estudo/<int:grupo_id>/', views.api_detalhes_grupo, name='api_detalhes_grupo'),
    path('logout/', views.logout_view, name='logout'),
    path('termos/', views.termos, name='termos'),
    path('sobre/', views.sobre_nos, name='sobre_nos'),
    path('privacidade/', views.privacidade, name='privacidade'),
    path('cookies/', views.cookies, name='cookies'),
    path('fale-conosco', views.fale_conosco, name='fale_conosco'),
    path('duvidas-frequentes', views.duvidas_frequentes, name='duvidas_frequentes'),
    path('blog', views.blog, name='blog'),
    path('como-funciona', views.como_funciona, name='como_funciona'),
    path('2fa/setup/', views.setup_2fatores, name='setup_2fatores'),
    path('2fa/verificar/', views.verificar_2fatores, name='verificar_2fatores'),
    path('2fa/desabilitar/', views.desabilitar_2fatores, name='desabilitar_2fatores'),
    path('2fa/status/', views.status_2fatores, name='status_2fatores'),
    path('api/configuracoes/', views.api_configuracoes_usuario, name='api_configuracoes_usuario'),
    path('api/relatorio-problema/', views.api_relatorio_problema, name='api_relatorio_problema'),
    path('api/exportar-dados/', views.api_exportar_dados, name='api_exportar_dados'),
]
