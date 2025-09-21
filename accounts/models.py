from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django_otp.models import Device
from django_otp.oath import hotp
import secrets
from multiselectfield import MultiSelectField

class Habilidades(models.Model):
    # user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='habilidades')
    nome = models.CharField(max_length=100, unique=True)
    descricao = models.TextField(blank=True)

    def __str__(self):
        return self.nome

class CustomUser(AbstractUser):
    username = models.CharField(max_length=150, unique=True, default='Não informado')
    data_nascimento = models.DateField(blank=True, null=True)
    genero = models.CharField(max_length=20, default='Não informado')
    email = models.EmailField(unique=True, default='Não informado')
    estado = models.CharField(max_length=100, default='Não informado')
    cidade = models.CharField(max_length=100, default='Não informado')
    universidade = models.CharField(max_length=100, default='Não informado')  
    universidade_nome = models.CharField(max_length=200, default='Não informado') 
    curso = models.CharField(max_length=100, default='Não informado')
    bio = models.TextField(blank=True, null=True)
    habilidades = models.ManyToManyField(Habilidades, blank=True)
    semestre = models.PositiveIntegerField(blank=True, null=True, default=1)
    celular = models.CharField(max_length=20, blank=True, default='Não informado')

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
    
    def get_foto_perfil(self):
        return self.fotos.filter(foto_perfil=True).first()
    
    def save(self, *args, **kwargs):
        # Handle empty phone number
        if not self.celular or self.celular.strip() == '':
            self.celular = 'Não Informado'
        super().save(*args, **kwargs)
    
    def get_formatted_phone(self):
        """Returns formatted phone or None if not provided"""
        if self.celular and self.celular != 'Não Informado':
            return self.celular
        return None
    
    def has_phone(self):
        """Check if user has provided a phone number"""
        return self.celular and self.celular != 'Não Informado'

class PreferenciasEstudo(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='preferencias_estudo')
    DIAS_DISPONIVEIS = [
        ('segunda','Segunda-feira'),
        ('terca','Terça-feira'),    
        ('quarta','Quarta-feira'),
        ('quinta','Quinta-feira'),
        ('sexta','Sexta-feira'),
        ('sabado','Sábado'),
        ('domingo','Domingo')]
    dia_semana = MultiSelectField(choices=DIAS_DISPONIVEIS, max_choices=7, blank=True)
    HORARIOS_DISPONIVEIS = [
        ('manha','Manhã - 06h-12h'),
        ('tarde', 'Tarde - 12h-18h'),
        ('noite', 'Noite - 18h-00h')]
    horario = MultiSelectField(choices=HORARIOS_DISPONIVEIS, max_choices=3, blank=True)
    METODOS_PREFERIDOS = [
        ('online','Estudo online'),
        ('presencial', 'Encontros presenciais'),
        ('grupo', 'Grupos de estudo')]
    metodo_preferido = MultiSelectField(choices=METODOS_PREFERIDOS, max_choices=3, blank=True)
    
    def __str__(self):
        return f"Preferências de estudo de {self.user.username}"
    

class Like(models.Model):
    de_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='like_dado')
    para_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='like_recebido')
    data_realizacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.de_usuario} curtiu {self.para_usuario}!"

class Superlike(models.Model):
    de_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='superlike_dado')
    para_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='superlike_recebido')
    mensagem = models.CharField(max_length=500)
    data_realizacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.de_usuario} curtiu e enviou uma mensagem para {self.para_usuario}!"

class Dislike(models.Model):
    de_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='dislike_dado')
    para_usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='dislike_recebido')
    data_realizacao = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.de_usuario} não curtiu {self.para_usuario}!"

class Linkeds(models.Model):
    usuario1 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='links_usuario1')
    usuario2 = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='links_usuario2')
    data_realizacao = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['usuario1','usuario2']
    
    def __str__(self):
        return f"{self.usuario1} se linkou com {self.usuario2}"


class GrupoDeEstudos(models.Model):
    nome = models.CharField(max_length=200)
    materia = models.CharField(max_length=200)
    descricao = models.TextField()
    usuario_criador = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='grupos_criados')
    data_criacao = models.DateTimeField(auto_now_add=True)
    
    # Meeting information
    dias_encontros = models.CharField(max_length=50, help_text="Comma-separated list of weekday numbers (0=Sunday, 6=Saturday)")
    horario_encontros = models.CharField(max_length=100)
    localizacao_encontros = models.CharField(max_length=300, blank=True)
    
    # Group settings
    ativo = models.BooleanField(default=True)
    maximo_membros = models.PositiveIntegerField(default=5)
    
    def __str__(self):
        return f"{self.nome} - {self.materia}"
    
    def get_members(self):
        return CustomUser.objects.filter(membros_grupos__grupo=self, membros_grupos__ativo=True)
    
    def get_member_count(self):
        return self.membros.filter(ativo=True).count()
    
    def can_join(self):
        return self.get_member_count() < self.maximo_membros

class MembroGrupoEstudos(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='membros_grupos')
    grupo = models.ForeignKey(GrupoDeEstudos, on_delete=models.CASCADE, related_name='membros')
    entrou_em = models.DateTimeField(auto_now_add=True)
    ativo = models.BooleanField(default=True)
    
    class Meta:
        unique_together = ['user', 'grupo']
    
    def __str__(self):
        return f"{self.user.username} em {self.grupo.nome}"

class ConfiguracoesUsuario(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='settings')
    
    # notificacoes
    notificacao_linkeds = models.BooleanField(default=True)
    notificacao_mensagens = models.BooleanField(default=True)
    notificacao_eventos = models.BooleanField(default=False)
    notificacao_sons = models.BooleanField(default=True)
    
    # privacidade
    mostrar_status_online = models.BooleanField(default=True)
    confirmacao_leitura = models.BooleanField(default=True)
    visibilidade_perfil = models.BooleanField(default=True)
    mostrar_curso = models.BooleanField(default=True)
    
    # preferencias de busca
    distancia_maxima = models.IntegerField(default=50)  # km
    
    # config da interface
    modo_escuro = models.BooleanField(default=False)
    tamanho_fonte = models.CharField(max_length=10, choices=[
        ('small', 'Pequena'),
        ('medium', 'Média'),
        ('large', 'Grande')
    ], default='medium')
    idioma = models.CharField(max_length=10, choices=[
        ('pt-br', 'Português (Brasil)'),
        ('en-us', 'English (US)'),
        ('es', 'Español')
    ], default='pt-br')
    
    # Data Settings
    backup_automatico = models.BooleanField(default=True)
    
    # Additional settings from the config page
    notificacao_matchs = models.BooleanField(default=True)  # Notificar novos matchs de estudo
    notificacao_eventos_grupos = models.BooleanField(default=False)  # Receber eventos de grupos
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Configurações de {self.user.username}"
    
class AparelhoSMS(Device):
    numero_celular = models.CharField(max_length=15, unique=True)
    token = models.CharField(max_length=6, blank=True, null=True)
    
    def gerar_desafio(self):
        token = str(secrets.randbelow(10**6)).zfill(6)
        
        # Store token in the device database field
        self.token = token
        self.save()
        
        # Send SMS with the token
        self.send_sms(token)
        
        return token

    def verificar_token(self, token):
        return self.token == token
    
    def send_sms(self, token):
        print(f"Enviando SMS para {self.numero_celular}: Seu código de verificação é {token}")
        # In production, this would integrate with an SMS service like Twilio
        
class FotosUsuario(models.Model):
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='fotos')
    imagem = models.ImageField(upload_to='fotos_usuario/')
    descricao = models.CharField(max_length=255, blank=True)
    foto_perfil = models.BooleanField(default=False)
    ordem = models.PositiveIntegerField(default=0)
    data_upload = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['ordem', '-data_upload']
    
    def __str__(self):
        return f"Foto de {self.user.username} - {self.descricao if self.descricao else 'Sem descrição'}"
    
    def save(self, *args, **kwargs):
        if not self.user.fotos.exists():
            self.foto_perfil = True
            self.ordem = 0
        elif self.ordem == 0:
            self.ordem = self.user.fotos.count()
        super().save(*args, **kwargs)


class RelatorioProblema(models.Model):
    TIPO_PROBLEMA_CHOICES = [
        ('bug', 'Bug / Erro no Sistema'),
        ('ui', 'Problema de Interface'),
        ('performance', 'Problema de Performance'),
        ('login', 'Problema de Login/Acesso'),
        ('notification', 'Problema com Notificações'),
        ('match', 'Problema com Matches'),
        ('profile', 'Problema com Perfil'),
        ('messaging', 'Problema com Mensagens'),
        ('other', 'Outro Problema'),
    ]
    
    FREQUENCIA_CHOICES = [
        ('always', 'Sempre acontece'),
        ('often', 'Acontece frequentemente'),
        ('sometimes', 'Acontece às vezes'),
        ('rare', 'Acontece raramente'),
        ('once', 'Aconteceu apenas uma vez'),
    ]
    
    PRIORIDADE_CHOICES = [
        ('critical', 'Crítica - Não consigo usar o app'),
        ('high', 'Alta - Afeta funcionalidades importantes'),
        ('medium', 'Média - Inconveniente mas posso contornar'),
        ('low', 'Baixa - Sugestão de melhoria'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='relatorios_problema')
    tipo_problema = models.CharField(max_length=20, choices=TIPO_PROBLEMA_CHOICES)
    titulo = models.CharField(max_length=100)
    descricao = models.TextField()
    dispositivo = models.CharField(max_length=150, blank=True)
    frequencia = models.CharField(max_length=20, choices=FREQUENCIA_CHOICES, blank=True)
    prioridade = models.CharField(max_length=20, choices=PRIORIDADE_CHOICES, blank=True)
    incluir_contato = models.BooleanField(default=False)
    email_usuario = models.EmailField(blank=True)
    nome_usuario = models.CharField(max_length=100, blank=True)
    arquivos_anexados = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=[
        ('aberto', 'Aberto'),
        ('em_analise', 'Em Análise'),
        ('resolvido', 'Resolvido'),
        ('fechado', 'Fechado'),
    ], default='aberto')
    
    data_criacao = models.DateTimeField(auto_now_add=True)
    data_atualizacao = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-data_criacao']
        verbose_name = 'Relatório de Problema'
        verbose_name_plural = 'Relatórios de Problema'
    
    def __str__(self):
        return f"#{self.id} - {self.titulo} ({self.get_tipo_problema_display()})"
    
    def get_short_description(self):
        return self.descricao[:100] + '...' if len(self.descricao) > 100 else self.descricao