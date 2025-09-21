from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from accounts.models import (
    CustomUser, Habilidades, PreferenciasEstudo, Like, Superlike, 
    Dislike, Linkeds, GrupoDeEstudos, MembroGrupoEstudos, 
    ConfiguracoesUsuario, AparelhoSMS, FotosUsuario, RelatorioProblema
)

# Custom User Admin
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'universidade', 'curso', 'semestre', 'is_active', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'universidade', 'curso', 'genero', 'estado', 'date_joined')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'universidade', 'curso')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Informações Pessoais', {'fields': ('first_name', 'last_name', 'email', 'data_nascimento', 'genero', 'bio')}),
        ('Localização', {'fields': ('estado', 'cidade')}),
        ('Acadêmico', {'fields': ('universidade', 'universidade_nome', 'curso', 'semestre')}),
        ('Contato', {'fields': ('celular',)}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas importantes', {'fields': ('last_login', 'date_joined')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2'),
        }),
    )

# Habilidades Admin
@admin.register(Habilidades)
class HabilidadesAdmin(admin.ModelAdmin):
    list_display = ('nome', 'descricao')
    search_fields = ('nome', 'descricao')
    ordering = ('nome',)

# Preferencias de Estudo Admin
@admin.register(PreferenciasEstudo)
class PreferenciasEstudoAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_dias_display', 'get_horarios_display', 'get_metodos_display')
    list_filter = ('dia_semana', 'horario', 'metodo_preferido')
    search_fields = ('user__username', 'user__email')
    
    def get_dias_display(self, obj):
        return ', '.join([dict(obj.DIAS_DISPONIVEIS)[dia] for dia in obj.dia_semana])
    get_dias_display.short_description = 'Dias Disponíveis'
    
    def get_horarios_display(self, obj):
        return ', '.join([dict(obj.HORARIOS_DISPONIVEIS)[horario] for horario in obj.horario])
    get_horarios_display.short_description = 'Horários Disponíveis'
    
    def get_metodos_display(self, obj):
        return ', '.join([dict(obj.METODOS_PREFERIDOS)[metodo] for metodo in obj.metodo_preferido])
    get_metodos_display.short_description = 'Métodos Preferidos'

# Interações Admin
@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ('de_usuario', 'para_usuario', 'data_realizacao')
    list_filter = ('data_realizacao',)
    search_fields = ('de_usuario__username', 'para_usuario__username')
    date_hierarchy = 'data_realizacao'

@admin.register(Superlike)
class SuperlikeAdmin(admin.ModelAdmin):
    list_display = ('de_usuario', 'para_usuario', 'mensagem', 'data_realizacao')
    list_filter = ('data_realizacao',)
    search_fields = ('de_usuario__username', 'para_usuario__username', 'mensagem')
    date_hierarchy = 'data_realizacao'

@admin.register(Dislike)
class DislikeAdmin(admin.ModelAdmin):
    list_display = ('de_usuario', 'para_usuario', 'data_realizacao')
    list_filter = ('data_realizacao',)
    search_fields = ('de_usuario__username', 'para_usuario__username')
    date_hierarchy = 'data_realizacao'

# Linkeds Admin
@admin.register(Linkeds)
class LinkedsAdmin(admin.ModelAdmin):
    list_display = ('usuario1', 'usuario2', 'data_realizacao')
    list_filter = ('data_realizacao',)
    search_fields = ('usuario1__username', 'usuario2__username')
    date_hierarchy = 'data_realizacao'

# Grupos de Estudo Admin
class MembroGrupoEstudosInline(admin.TabularInline):
    model = MembroGrupoEstudos
    extra = 1
    fields = ('user', 'ativo', 'entrou_em')

@admin.register(GrupoDeEstudos)
class GrupoDeEstudosAdmin(admin.ModelAdmin):
    list_display = ('nome', 'materia', 'usuario_criador', 'get_member_count', 'maximo_membros', 'ativo', 'data_criacao')
    list_filter = ('ativo', 'materia', 'data_criacao')
    search_fields = ('nome', 'materia', 'usuario_criador__username')
    date_hierarchy = 'data_criacao'
    inlines = [MembroGrupoEstudosInline]
    
    def get_member_count(self, obj):
        return obj.get_member_count()
    get_member_count.short_description = 'Membros Ativos'

@admin.register(MembroGrupoEstudos)
class MembroGrupoEstudosAdmin(admin.ModelAdmin):
    list_display = ('user', 'grupo', 'ativo', 'entrou_em')
    list_filter = ('ativo', 'grupo', 'entrou_em')
    search_fields = ('user__username', 'grupo__nome')
    date_hierarchy = 'entrou_em'

# Configurações do Usuário Admin
@admin.register(ConfiguracoesUsuario)
class ConfiguracoesUsuarioAdmin(admin.ModelAdmin):
    list_display = ('user', 'notificacao_linkeds', 'notificacao_mensagens', 'modo_escuro', 'idioma', 'data_atualizacao')
    list_filter = ('notificacao_linkeds', 'notificacao_mensagens', 'modo_escuro', 'idioma', 'backup_automatico')
    search_fields = ('user__username', 'user__email')
    date_hierarchy = 'data_atualizacao'
    
    fieldsets = (
        ('Usuário', {'fields': ('user',)}),
        ('Notificações', {'fields': ('notificacao_linkeds', 'notificacao_mensagens', 'notificacao_eventos', 'notificacao_sons')}),
        ('Privacidade', {'fields': ('mostrar_status_online', 'confirmacao_leitura', 'visibilidade_perfil', 'mostrar_curso')}),
        ('Preferências de Busca', {'fields': ('distancia_maxima',)}),
        ('Interface', {'fields': ('modo_escuro', 'tamanho_fonte', 'idioma')}),
        ('Sistema', {'fields': ('backup_automatico',)}),
    )

# Aparelho SMS Admin
@admin.register(AparelhoSMS)
class AparelhoSMSAdmin(admin.ModelAdmin):
    list_display = ('numero_celular', 'get_user', 'token')
    list_filter = ('token',)
    search_fields = ('numero_celular',)
    
    def get_user(self, obj):
        # Try to find the user associated with this device
        # This might need adjustment based on how the relationship is set up
        return 'N/A'  # Placeholder - adjust based on actual relationship
    get_user.short_description = 'Usuário'

# Fotos do Usuário Admin
@admin.register(FotosUsuario)
class FotosUsuarioAdmin(admin.ModelAdmin):
    list_display = ('user', 'descricao', 'foto_perfil', 'ordem', 'data_upload')
    list_filter = ('foto_perfil', 'data_upload')
    search_fields = ('user__username', 'descricao')
    date_hierarchy = 'data_upload'
    ordering = ('user', 'ordem', '-data_upload')

# Relatórios de Problema Admin
@admin.register(RelatorioProblema)
class RelatorioProblemaAdmin(admin.ModelAdmin):
    list_display = ('id', 'tipo_problema', 'titulo', 'user', 'status', 'prioridade', 'data_criacao')
    list_filter = ('tipo_problema', 'status', 'prioridade', 'frequencia', 'data_criacao')
    search_fields = ('titulo', 'descricao', 'user__username', 'user__email')
    date_hierarchy = 'data_criacao'
    readonly_fields = ('data_criacao', 'data_atualizacao')
    
    fieldsets = (
        ('Informações Básicas', {'fields': ('user', 'tipo_problema', 'titulo', 'descricao')}),
        ('Detalhes Técnicos', {'fields': ('dispositivo', 'frequencia', 'prioridade')}),
        ('Contato', {'fields': ('incluir_contato', 'email_usuario', 'nome_usuario')}),
        ('Status', {'fields': ('status', 'arquivos_anexados')}),
        ('Datas', {'fields': ('data_criacao', 'data_atualizacao')}),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')

# Register the models
admin.site.register(CustomUser, CustomUserAdmin)

# Customize admin site
admin.site.site_header = "UniCrossed - Administração"
admin.site.site_title = "UniCrossed Admin"
admin.site.index_title = "Bem-vindo ao painel de administração do UniCrossed"
