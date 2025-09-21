from allauth.account.views import SignupView
from accounts.forms import CustomSignupForm, EditarPerfilForm, EditarPreferenciasForm
from .models import CustomUser, Habilidades, Like, Superlike, Dislike, Linkeds, PreferenciasEstudo, AparelhoSMS, FotosUsuario, GrupoDeEstudos, MembroGrupoEstudos, ConfiguracoesUsuario, RelatorioProblema
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from django.contrib.auth.decorators import login_required
from django.shortcuts import redirect
from django.conf import settings
from django.db import transaction, models
from django.views.decorators.http import require_http_methods
from django.db.models import Exists, OuterRef
from django_otp.decorators import otp_required
from django_otp import match_token
from django_otp.plugins.otp_totp.models import TOTPDevice
from django.contrib.auth import login, authenticate
import re



# FORMULARIO CUSTOM
class MySignupView(SignupView):
    # define a classe do formulario
    form_class = CustomSignupForm

    # se o formulario for valido, printa que é valido e chama o metodo pai (SignupView) que faz o resto do trabalho
    def form_valid(self, form):
        print(">>> FORMULÁRIO VÁLIDO")
        return super().form_valid(form)

    # se o formulario for invalido, printa os erros e chama o metodo pai (SignupView) que faz o resto do trabalho
    def form_invalid(self, form):
        print(">>> FORMULÁRIO INVÁLIDO")
        print(form.errors)
        return super().form_invalid(form)

def buscar_proximo_perfil(usuario):
    # vai criar subqueries pra ver se o usuario ja curtiu, descurtiu ou supercurtiu o outro usuario
    # se ja tiver feito alguma dessas interacoes, o usuario nao aparece mais pra ele
    # resumindo = historico de interacoes
    likes_subquery = Like.objects.filter(de_usuario=usuario, para_usuario=OuterRef('pk'))
    dislikes_subquery = Dislike.objects.filter(de_usuario=usuario, para_usuario=OuterRef('pk'))
    superlikes_subquery = Superlike.objects.filter(de_usuario=usuario, para_usuario=OuterRef('pk'))
        

    # gera informacoes sobre as interacoes. pega todas elas, ve se existe, e filtra pra trazer só os usuarios que nao tiveram interacao ainda
    return CustomUser.objects.annotate(
        ja_curtiu=Exists(likes_subquery),
        ja_descurtiu=Exists(dislikes_subquery),
        ja_supercurtiu=Exists(superlikes_subquery)).filter(
            ja_curtiu=False,
            ja_descurtiu=False,
            ja_supercurtiu=False,
            is_staff=False).exclude(
                # exclui o proprio usuario logado e traz apenas as informacoes relevantes com o return
                id=usuario.id).only('id','username','cidade','estado','bio').prefetch_related('habilidades').first()

def tratamento_dados_request(request):
    # pega os dados do request e transforma num json para poder ser trabalho no resto das funções
    try:
        return json.loads(request.body.decode('utf-8'))
    # retorna vazio só se der algum erro no JSON ou no encoding, caso contrario mostra o erro (facilita p debugar)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return {}

def criar_resposta_erro(message, status_code=400):
    # autoexplicativo o nome, cria resposta pros erros
    return JsonResponse({'status':'error','message':message}, status=status_code)

def validar_interacoes(usuario_atual, usuario_alvo):
    # checa se o usuário está tentando interagir com ele mesmo
    if usuario_atual == usuario_alvo:
        return JsonResponse({'status':'error','message':'Você não pode interagir consigo mesmo!'}, status=400)
    
    # checa se o usuario mostrado e o usuario logado já interagiram anteriormente
    interacao_existe = (
        Like.objects.filter(de_usuario=usuario_atual, para_usuario=usuario_alvo).exists() or
        Dislike.objects.filter(de_usuario=usuario_atual, para_usuario=usuario_alvo).exists() or
        Superlike.objects.filter(de_usuario=usuario_atual, para_usuario=usuario_alvo).exists())
    
    # se ja interagiram, retorna a mensagem de info
    if interacao_existe:
        return JsonResponse({'status':'info','message':'Você já interagiu com esse usuário anteriormente.'})

    return None # sem erro ou interacao anterior

def processar_interacao_mutua(usuario_atual, usuario_alvo):
    # inverte a ordem do usuario que curtiu e o que foi curtido com o like
    like_inverso = Like.objects.filter(
        de_usuario=usuario_alvo,
        para_usuario=usuario_atual).first()

    # inverte a ordem do usuario que curtiu e o que foi curtido com o superlike
    superlike_inverso = Superlike.objects.filter(
        de_usuario=usuario_alvo,
        para_usuario=usuario_atual).first()

    # caso haja uma interação mutua (os dois usuarios curtiram um ao outro), realiza link entre eles
    if like_inverso or superlike_inverso:
        usuario1, usuario2 = sorted([usuario_atual, usuario_alvo], key=lambda u:u.id)
        Linkeds.objects.get_or_create(
            usuario1=usuario_atual,
            usuario2=usuario_alvo)
        return True # link criado

    return False # sem interação mutua

def verificar_link_ou_criar(usuario_atual, usuario_alvo):
    # verifica se ja existe interacao mutua (os dois usuarios se curtiram) e cria o link caso positivo, tanto com like quanto superlike
    interacao_mutua = (
        Like.objects.filter(de_usuario=usuario_alvo, para_usuario=usuario_atual).exists() or
        Superlike.objects.filter(de_usuario=usuario_alvo, para_usuario=usuario_atual).exists())
    
    # se houver interacao mutua, cria o link (se ja existir, nao cria de novo por causa do unique_together)
    if interacao_mutua:
        Linkeds.objects.get_or_create(
            usuario1=min(usuario_atual, usuario_alvo, key=lambda u: u.id), # minimo pra garantir que o usuario1 seja sempre o de menor id, evitando bugs ou uma ordem trocada de interacoes, tipo joao e maria e maria e joao
            # assim gera menos possibilidades de erro e menos carga pro servidor etc
            usuario2=max(usuario_atual, usuario_alvo, key=lambda u: u.id))
        return True # link criado

    return False # sem interação mutua, ou seja, so envia a interacao, sem criar nd

@login_required(login_url='landingpage/')
def home(request):
    # busca o proximo perfil disponivel
    proximo_perfil = buscar_proximo_perfil(request.user)
    
    # se nao tiver mais perfis disponiveis, renderiza a home com o perfil como None e fim como True, pra mostrar a tela de "sem mais perfis disponiveis"
    if not proximo_perfil:
        return render(request, 'home.html', {'perfil':None, 'fim':True})

    # se nao, renderiza a home com o perfil encontrado
    return render(request, 'home.html', {'perfil': proximo_perfil})

@require_http_methods(["GET"])
@login_required(login_url='/accounts/login/')
def pegar_proximo_perfil(request): # Endpoint AJAX pra pegar o proximo usuario disponivel
    # se o metodo for diferente de get, da erro
    if request.method != 'GET':
        return JsonResponse({'status':'error','message':'Método não permitido.'}, status=405)
    
    # busca o proximo perfil disponivel
    proximo_perfil = buscar_proximo_perfil(request.user)
    
    # se nao tiver mais perfis disponiveis, retorna a mensagem pro front, que depois vai mostrar a tela de "sem mais perfis disponiveis"
    if not proximo_perfil:
        return JsonResponse({'status': 'no_more_profiles','message': 'Não há mais perfis para mostrar no momento.','perfil': None})
    
    # pega as habilidades do perfil
    habilidades = [str(hab) for hab in proximo_perfil.habilidades.all()]
    
    # retorna os dados do perfil pro front
    return JsonResponse({
        'status': 'success',
        'perfil': {
            'id': proximo_perfil.id,
            'username': proximo_perfil.username,
            'cidade': proximo_perfil.cidade or 'Localização não informada',
            'estado': proximo_perfil.estado or '',
            'bio': proximo_perfil.bio or 'Biografia não informada',
            'habilidades': habilidades
        }
    })

@transaction.atomic
@require_http_methods(["POST"])
@login_required(login_url='/accounts/login/')
def like(request, user_id):
    # se o método da requisição for diferente de post, vai dar erro
    if request.method != 'POST':
        return JsonResponse({'status':'error','message':'Método não permitido.'}, status=405)

    # pega os dados do request (q é transformado em JSON pela funcao de tratamento_dados_request), o usuario atual (logado) e o usuario alvo (o que recebeu o like)
    data = tratamento_dados_request(request)
    usuario_atual = request.user
    usuario_alvo = get_object_or_404(CustomUser, id=user_id)

    # checagem de interação, seja pra ver se o usuario interagiu com ele mesmo ou se ja interagiu com o usuario alvo
    resposta_erro = validar_interacoes(usuario_atual, usuario_alvo)
    # se der erro, retorna a resposta de erro
    if resposta_erro:
        return resposta_erro

    # cria o like, ou pega o like ja existente (o que nunca vai acontecer pq a validação acima já checa isso)
    like, criado = Like.objects.get_or_create( # esse criado aí so Deus sabe pq ta aqui e pra que serve
        de_usuario=usuario_atual,
        para_usuario=usuario_alvo)

    # checa se houve interação mutua (os dois usuarios se curtiram) e cria o link caso positivo
    if processar_interacao_mutua(usuario_atual, usuario_alvo):
        return JsonResponse({'status':'success','message':'Linked!'})
        
    # se nao deu linked, retorna q o like foi enviado e manda pro front    
    return JsonResponse({'status':'success', 'message':'Like enviado!'})

@transaction.atomic
@require_http_methods(["POST"])
@login_required(login_url='/accounts/login/')
def superlike(request, user_id):
    # se for diferente de post, da erro
    if request.method != 'POST':
        return JsonResponse({'status':'error','message':'Método não permitido.'}, status=405)

    # pega os dados do request (q é transformado em JSON pela funcao de tratamento_dados_request), o usuario atual (logado) e o usuario alvo (o que recebeu o superlike) alem da msg
    data = tratamento_dados_request(request)
    usuario_atual = request.user
    usuario_alvo = get_object_or_404(CustomUser, id=user_id)
    msg = data.get('mensagem', '').strip()

    # checagem de interação, seja pra ver se o usuario interagiu com ele mesmo ou se ja interagiu com o usuario alvo
    resposta_erro = validar_interacoes(usuario_atual, usuario_alvo)
    # se der erro, retorna a resposta de erro
    if resposta_erro:
        return resposta_erro
    
    # se a mensagem tiver menos que 10 caracteres ou mais que 500, apresenta o respectivo erro
    if len(msg) < 10:
        return JsonResponse({'status':'error','message':'Limite mínimo de caracteres não atingido! Você precisa adicionar no mínimo 10.'}, status=400)
    
    if len(msg) > 500:
        return JsonResponse({'status':'error','message':'Limite máximo de caracteres alcançado! Você pode adicionar no máximo 500.'}, status=400)

    # cria o superlike, ou pega o superlike ja existente (o que nunca vai acontecer pq a validação acima já checa isso) 
    superlike, criado = Superlike.objects.get_or_create( # novo, esse criado aí so Deus sabe pq ta aqui e pra que serve
        de_usuario=usuario_atual,
        para_usuario=usuario_alvo,
        mensagem=msg)
    
    # checa se houve interação mutua (os dois usuarios se curtiram) e cria o link caso positivo
    if processar_interacao_mutua(usuario_atual, usuario_alvo):
        return JsonResponse({'status':'success','message':'Linked!'})    

    # se nao deu linked, retorna q o superlike foi enviado e manda pro front
    return JsonResponse({'status':'success','message':'Superlike enviado!'})


@require_http_methods(["POST"])
@login_required(login_url='/accounts/login/')
def dislike(request, user_id):
    # se o metodo for diferente de post, da erro
    if request.method != 'POST':
        return JsonResponse({'status':'error','message':'Método não permitido.'}, status=405)

    # pega os dados necessarios, no caso o JSON com as informações do request, o usuario atual (logado) e o usuario alvo (o que recebeu o dislike)
    data = tratamento_dados_request(request)
    usuario_atual = request.user
    # ou pega o usuario alvo, ou dá 404, ou seja, nao achou
    usuario_alvo = get_object_or_404(CustomUser, id=user_id)

    # checagem de interação, seja pra ver se o usuario interagiu com ele mesmo ou se ja interagiu com o usuario alvo
    resposta_erro = validar_interacoes(usuario_atual, usuario_alvo)
    # se der erro, retorna a resposta de erro
    if resposta_erro:
        return resposta_erro
    
    # cria o dislike, ou pega o dislike ja existente (o que nunca vai acontecer pq a validação acima já checa isso)
    dislike, criado = Dislike.objects.get_or_create( # esse criado aí so Deus sabe pq ta aqui e pra que serve
        de_usuario=usuario_atual,
        para_usuario=usuario_alvo)

    # retorna sucesso se deu certo pro front
    return JsonResponse({'status': 'success', 'message': 'Dislike enviado!'})

@login_required(login_url='/accounts/login/')
def linkeds(request):
    # usuario atual é o user logado
    usuario_atual = request.user
    
    # pega todos os linkeds do usuario atual, ordenados pela data de criacao (mais recentes primeiro)
    meus_linkeds = Linkeds.objects.filter(
        models.Q(usuario1=usuario_atual) | models.Q(usuario2=usuario_atual)).order_by('-data_realizacao')

    # cria uma lista de dicionarios com o usuario linkado e a data do link
    usuarios_linkados = []
    # loop, pra cada link nos linkeds do usuario
    for link in meus_linkeds:
        # ve se o usuario1 do link é o usuario atual, se sim, adiciona o usuario2 na lista
        if link.usuario1 == usuario_atual:
            usuarios_linkados.append({
                'usuario': link.usuario2,
                'data_link': link.data_realizacao
            })
        # senao, adiciona o usuario1            
        else:
            usuarios_linkados.append({
                'usuario': link.usuario1,
                'data_link': link.data_realizacao
            })
    # renderiza a pagina de linkeds, passando a lista de usuarios linkados
    return render(request, 'linkeds.html', {'linkeds': usuarios_linkados})

def setup_2fatores(request):
    # se for post, pega o numero do celular
    if request.method == 'POST':
        try:
            phone = request.POST.get('phone_number')
            print(f"Setting up 2FA for user {request.user.username} with phone {phone}")
            
            # Remove existing unconfirmed devices for this user
            AparelhoSMS.objects.filter(user=request.user, confirmed=False).delete()
            
            # cria o aparelho SMS (2FA) com o numero do celular
            device = AparelhoSMS.objects.create(
                user=request.user,
                name='SMS',
                numero_celular=phone,
                confirmed=False
            )
            
            # gera o token e envia o SMS
            token = device.gerar_desafio()
            print(f"Generated token: {token} for device {device.id}")
            
            # retorna o ID do aparelho pro frontend
            return JsonResponse({'status': 'code_sent', 'device_id': device.id})
        except Exception as e:
            print(f"Error setting up 2FA: {e}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Método não permitido'}, status=405)

def verificar_2fatores(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    try:
        # pega o ID do aparelho e o token
        device_id = request.POST.get('device_id')
        token = request.POST.get('verification_code')
        
        print(f"Verifying 2FA for device {device_id} with token {token}")
        
        if not device_id or not token:
            return JsonResponse({'error': 'Dados incompletos'}, status=400)
        
        # tenta pegar o APARELHO, c o id sendo o fornecido acima e o user sendo o user logado
        try:
            device = AparelhoSMS.objects.get(id=device_id, user=request.user)
            print(f"Found device {device.id} with stored token: {device.token}")
            
            # se o token for verificado e validado, confirma o aparelho e salva
            if device.verificar_token(token):
                device.confirmed = True
                device.save()
                print(f"2FA verified successfully for device {device.id}")
                return JsonResponse({'status': 'success'})
            # se nao, da erro
            else:
                print(f"Token verification failed for device {device.id}")
                return JsonResponse({'error': 'Código inválido'}, status=400)
        
        # se nao achar o aparelho, da erro
        except AparelhoSMS.DoesNotExist:
            print(f"Device {device_id} not found for user {request.user.username}")
            return JsonResponse({'error': 'Aparelho não encontrado'}, status=404)
    except Exception as e:
        print(f"Error verifying 2FA: {e}")
        return JsonResponse({'error': str(e)}, status=500)

@otp_required
def view_protegida(request):
    # Exemplo de view protegida por 2FA (so Deus sabe o que isso faz)
    return render(request, 'protegida.html')

def login_2fatores(request):
    # pega os dados do usuario
    username = request.POST.get('username')
    password = request.POST.get('password')
    token = request.POST.get('token')
    
    # autentica o usuario
    user = authenticate(username=username, password=password)
    
    # se o usuario existir e foi autenticado corretamente
    if user:
        # checa se o usuario tem 2 fatores habilitado
        if user.smsdevice_set.filter(confirmed=True).exists():
            # se tiver, faz a verificacao do token
            aparelho = match_token(user, token)
            # se o token for invalido, retorna erro
            if not aparelho:
                return JsonResponse({'error': 'Autenticação de dois fatores inválida.'})

        # se tudo der certo, loga o usuario
        login(request, user)
        return JsonResponse({'status': 'success'})
    # se nao, da erro
    else:
        return JsonResponse({'error': 'Credenciais inválidas.'})
    
def desabilitar_2fatores(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    # se for post, ve se o usuario tem 2 fatores habilitado, se sim, desativa e retorna sucesso
    try:
        device = AparelhoSMS.objects.get(user=request.user, confirmed=True)
        device.delete()
        return JsonResponse({'status': 'success'})
    except AparelhoSMS.DoesNotExist:
        return JsonResponse({'error': 'Autenticação de dois fatores não está habilitada'}, status=400)
    
def status_2fatores(request):
    if request.method != 'GET':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    # verifica se o usuario tem 2 fatores habilitado
    try:
        device = AparelhoSMS.objects.get(user=request.user, confirmed=True)
        # se der certo, retorna q o usuario tem habilitado e traz os 4 ultimos digitos do celular
        return JsonResponse({'enabled': True, 'phone_number': device.numero_celular[-4:]})
    except AparelhoSMS.DoesNotExist:
        # se nao, retorna q tá desabilitado
        return JsonResponse({'enabled': False})
    
def enviar_foto(request):
    # se o metodo for post e o request pedir um arquivo imagem
    if request.method == 'POST' and request.FILES.get('imagem'):
        # dai ele ve se o usuario ja tem 6 fotos, se sim, nao deixa adicionar mais
        if request.user.fotos.count() >= 6:
            return JsonResponse({'error': 'Máximo de 6 fotos permitidas'})

        # se nao, cria a foto e adiciona na conta do usuario
        foto = FotosUsuario.objects.create(
            user=request.user, # relaciona a foto com o usuario logado
            imagem=request.FILES['imagem'], # pega a imagem do request
            ordem=request.user.photos.count() # define a ordem da foto como a quantidade atual de fotos (adiciona no final
        )

        # retorna a url da foto e o id dela pro frontend
        return JsonResponse({'status': 'success','foto_url': foto.image.url,'foto_id': foto.id})

def remove_foto(request, foto_id):
    # se o metodo for delete
    if request.method == 'DELETE':
        # tenta pegar a foto com o id passado e que pertença ao usuario logado
        try:
            foto = FotosUsuario.objects.get(id=foto_id, user=request.user)
            # se der, deleta e retorna sucesso
            foto.delete()
            return JsonResponse({'status': 'success'})
        # se nao der, retorna erro
        except FotosUsuario.DoesNotExist:
            return JsonResponse({'error': 'Foto não encontrada'})

def landingpage(request):
    return render(request, 'landingPage.html')

def configuracoes(request):
    return render(request, 'configuracoes/config.html')

def termos(request):
    return render(request, 'informacoes/termos.html')

def cookies(request):
    return render(request, 'informacoes/cookies.html')

def sobre_nos(request):
    return render(request, 'informacoes/sobre-nos.html')

def privacidade(request):
    return render(request, 'informacoes/privacidade.html')

def login(request):
    return render(request, 'account/login.html')

def fale_conosco(request):
    return render(request, 'informacoes/fale-conosco.html')

def duvidas_frequentes(request):
    return render(request, 'informacoes/duvidas-frequentes.html')

def blog(request):
    return render(request, 'informacoes/blog.html')

def como_funciona(request):
    return render(request, 'informacoes/como-funciona.html')

@login_required(login_url='/accounts/login/')
def logout_view(request):
    """View para fazer logout do usuário"""
    from django.contrib.auth import logout
    from django.contrib import messages
    
    if request.method == 'POST':
        # Faz o logout do usuário
        logout(request)
        # Adiciona mensagem de sucesso (opcional)
        messages.success(request, 'Você foi desconectado com sucesso!')
        # Redireciona para a landing page
        return redirect('landingpage')
    
    # Se for GET, redireciona para a página de configurações
    return redirect('configuracoes')

def user_profile(request):
    if not request.user.is_authenticated:
        return redirect('/accounts/login/')

    return render(request, 'configuracoes/user-profile.html')

def config_profile(request):
    return render(request, 'configuracoes/config-profile.html')

@login_required(login_url='/accounts/login/')
def api_perfil_usuario(request):
    # api pra pegar informacoes do usuario, incluindo o nome da universidade
    user = request.user
    
    # pega as habilidades do usuario
    habilidades = [str(hab) for hab in user.habilidades.all()]
    
    # pega as preferencias do usuario se elas existirem
    try:
        preferencias = user.preferencias_estudo
        dias_preferidos = list(preferencias.dia_semana) if preferencias.dia_semana else []
        horarios_preferidos = list(preferencias.horario) if preferencias.horario else []
        metodos_preferidos = list(preferencias.metodo_preferido) if preferencias.metodo_preferido else []
    except:
        dias_preferidos = []
        horarios_preferidos = []
        metodos_preferidos = []
    
    # pega a foto de perfil
    foto_perfil = user.get_foto_perfil()
    foto_url = foto_perfil.imagem.url if foto_perfil else None
    
    profile_data = {
        'id': user.id,
        'username': user.username,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'bio': user.bio or 'Biografia não informada',
        'curso': user.curso,
        'universidade_nome': user.universidade_nome or 'Universidade não informada',  # nome da universidade
        'universidade_id': user.universidade,  # envia o ID ainda se precisar
        'semestre': user.semestre,
        'cidade': user.cidade,
        'estado': user.estado,
        'habilidades': habilidades,
        'foto_perfil': foto_url,
        'preferencias': {
            'dias_disponiveis': dias_preferidos,
            'horarios_preferidos': horarios_preferidos,
            'metodos_preferidos': metodos_preferidos
        }
    }
    
    return JsonResponse({
        'status': 'success',
        'profile': profile_data
    })


    user = request.user
    # Also get preferences for the template
    preferencias, criado = PreferenciasEstudo.objects.get_or_create(user=user)
    
    if request.method == 'POST':
        # Handle phone number
        celular = request.POST.get('celular', '').strip()
        if not celular:
            user.celular = 'Não Informado'
        else:
            # Validate phone format
            phone_pattern = r'^\(\d{2}\)\s\d{4,5}-\d{4}$'
            if re.match(phone_pattern, celular):
                user.celular = celular
            else:
                return JsonResponse({'status': 'error', 'message': 'Formato de telefone inválido.'})
        
        form = EditarPerfilForm(request.POST, request.FILES, instance=user)
        
        senha_atual = request.POST.get('current_password')
        nova_senha = request.POST.get('new_password')
        confirmar_senha = request.POST.get('confirm_password')
        
        # Handle preferences data in the same request
        post_data = request.POST.copy()
        
        # Convert checkbox arrays to lists for MultiSelectField
        if 'dia_semana' in post_data:
            post_data['dia_semana'] = post_data.getlist('dia_semana')
        if 'horario' in post_data:
            post_data['horario'] = post_data.getlist('horario')
        if 'metodo_preferido' in post_data:
            post_data['metodo_preferido'] = post_data.getlist('metodo_preferido')
        
        preferences_form = EditarPreferenciasForm(post_data, instance=preferencias)
        
        # Validate both forms
        if form.is_valid() and preferences_form.is_valid():
            form.save()
            preferences_form.save()
            
            # Handle password change if provided
            if senha_atual and nova_senha:
                if request.user.check_password(senha_atual):
                    if nova_senha == confirmar_senha:
                        # Validate password strength
                        import re
                        password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$'
                        if not re.match(password_pattern, nova_senha):
                            return JsonResponse({'status': 'error', 'message': 'A nova senha não atende aos requisitos de segurança.'})
                        
                        request.user.set_password(nova_senha)
                        request.user.save()
                        update_session_auth_hash(request, request.user)  # Keep user logged in
                    else:
                        return JsonResponse({'status':'error','message':'O primeiro e o segundo campo de nova senha não coincidem.'})
                else:
                    return JsonResponse({'status':'error','message':'Senha atual incorreta.'})
            
            return redirect('config_profile') 
        else:
            # Handle form errors
            errors = []
            if not form.is_valid():
                errors.extend([str(error) for error_list in form.errors.values() for error in error_list])
            if not preferences_form.is_valid():
                errors.extend([str(error) for error_list in preferences_form.errors.values() for error in error_list])
            
            return JsonResponse({'status': 'error', 'message': '; '.join(errors)})
    else:
        form = EditarPerfilForm(instance=user)
        preferences_form = EditarPreferenciasForm(instance=preferencias)
    
    return render(request, 'configuracoes/user-profile.html', {
        'form_perfil': form,
        'form_preferencias': preferences_form
    })


    # pega o usuario logado
    user = request.user
    # pega ou cria as preferencias de estudo do usuario
    preferencias, criado = PreferenciasEstudo.objects.get_or_create(user=user)
    
    # se for post, pega os dados do formulario
    if request.method == 'POST':
        # cuida manualmente do checkbox ja que o MultiSelectField espera um formato específico
        post_data = request.POST.copy()
        
        # converte arrays do checkbox pra strings separadas por comma pro multiselectfield
        if 'dia_semana' in post_data:
            post_data['dia_semana'] = post_data.getlist('dia_semana')
        if 'horario' in post_data:
            post_data['horario'] = post_data.getlist('horario')
        if 'metodo_preferido' in post_data:
            post_data['metodo_preferido'] = post_data.getlist('metodo_preferido')
        
        form = EditarPreferenciasForm(post_data, instance=preferencias)
        
        # se o formulario for valido, salva e redireciona pra pagina de perfil do usuario
        if form.is_valid():
            form.save()
            return redirect('user_profile')
    # se nao for post, cria o formulario com os dados das preferencias
    else:
        form = EditarPreferenciasForm(instance=preferencias)
    
    # no fim, retorna as informacoes pro front e redireciona o usuario pra pagina do perfil dele
    return render(request, 'configuracoes/user-profile.html', {'form_preferencias': form})


    """Combined view to handle both profile and preferences editing"""
    user = request.user
    # Get or create preferences
    preferencias, criado = PreferenciasEstudo.objects.get_or_create(user=user)
    
    if request.method == 'POST':
        # Check if it's an AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Handle profile form
            profile_form = EditarPerfilForm(request.POST, request.FILES, instance=user)
            
            # Handle phone number
            celular = request.POST.get('celular', '').strip()
            if not celular:
                user.celular = 'Não Informado'
            else:
                # Validate phone format
                phone_pattern = r'^\(\d{2}\)\s\d{4,5}-\d{4}$'
                if re.match(phone_pattern, celular):
                    user.celular = celular
                else:
                    error_msg = 'Formato de telefone inválido.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
            
            # Handle password change (only if fields are provided)
            senha_atual = request.POST.get('current_password')
            nova_senha = request.POST.get('new_password')
            confirmar_senha = request.POST.get('confirm_password')
            
            # If any password field is filled, validate all
            if senha_atual or nova_senha or confirmar_senha:
                if not all([senha_atual, nova_senha, confirmar_senha]):
                    error_msg = 'Todos os campos de senha são obrigatórios quando alterando a senha.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                if not user.check_password(senha_atual):
                    error_msg = 'Senha atual incorreta.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                if nova_senha != confirmar_senha:
                    error_msg = 'O primeiro e o segundo campo de nova senha não coincidem.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                # Validate password strength
                password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$'
                if not re.match(password_pattern, nova_senha):
                    error_msg = 'A nova senha não atende aos requisitos de segurança.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                # Set new password
                user.set_password(nova_senha)
                # Keep user logged in after password change
                update_session_auth_hash(request, user)
            
            # Handle preferences form
            post_data = request.POST.copy()
            
            # Convert checkbox arrays to lists for MultiSelectField
            if 'dia_semana' in post_data:
                post_data['dia_semana'] = post_data.getlist('dia_semana')
            if 'horario' in post_data:
                post_data['horario'] = post_data.getlist('horario')
            if 'metodo_preferido' in post_data:
                post_data['metodo_preferido'] = post_data.getlist('metodo_preferido')
            
            preferences_form = EditarPreferenciasForm(post_data, instance=preferencias)
            
            # Validate both forms
            if profile_form.is_valid() and preferences_form.is_valid():
                # Save profile
                profile_form.save()
                # Save user (for phone number)
                user.save()
                # Save preferences
                preferences_form.save()
                
                success_msg = 'Perfil atualizado com sucesso!'
                if is_ajax:
                    return JsonResponse({'status': 'success', 'message': success_msg})
                else:
                    messages.success(request, success_msg)
                    return redirect('configurar_profile')
            else:
                # Collect all form errors
                errors = []
                if not profile_form.is_valid():
                    for field, error_list in profile_form.errors.items():
                        for error in error_list:
                            errors.append(f"{field}: {error}")
                if not preferences_form.is_valid():
                    for field, error_list in preferences_form.errors.items():
                        for error in error_list:
                            errors.append(f"{field}: {error}")
                
                error_msg = '; '.join(errors)
                if is_ajax:
                    return JsonResponse({'status': 'error', 'message': error_msg})
                else:
                    messages.error(request, error_msg)
                    return redirect('configurar_profile')
                    
        except Exception as e:
            error_msg = f'Erro inesperado: {str(e)}'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': error_msg})
            else:
                messages.error(request, error_msg)
                return redirect('configurar_profile')
    
    else:
        # GET request - create forms with current data
        profile_form = EditarPerfilForm(instance=user)
        preferences_form = EditarPreferenciasForm(instance=preferencias)
    
    context = {
        'form_perfil': profile_form,
        'form_preferencias': preferences_form,
        'user': user,
        'preferencias': preferencias
    }
    
    return render(request, 'configuracoes/user-profile.html', context)


def configurar_profile(request):
    """Combined view to handle both profile and preferences editing"""
    user = request.user
    # Get or create preferences
    preferencias, criado = PreferenciasEstudo.objects.get_or_create(user=user)
    
    if request.method == 'POST':
        # Check if it's an AJAX request
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
        
        try:
            # Handle profile form
            profile_form = EditarPerfilForm(request.POST, request.FILES, instance=user)
            
            # Handle phone number
            celular = request.POST.get('celular', '').strip()
            if not celular:
                user.celular = 'Não Informado'
            else:
                # Validate phone format
                phone_pattern = r'^\(\d{2}\)\s\d{4,5}-\d{4}$'
                if re.match(phone_pattern, celular):
                    user.celular = celular
                else:
                    error_msg = 'Formato de telefone inválido.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
            
            # Handle password change (only if ALL fields are provided)
            senha_atual = request.POST.get('current_password', '').strip()
            nova_senha = request.POST.get('new_password', '').strip()
            confirmar_senha = request.POST.get('confirm_password', '').strip()
            
            # Only process password change if ALL fields have content
            if senha_atual and nova_senha and confirmar_senha:
                if not all([senha_atual, nova_senha, confirmar_senha]):
                    error_msg = 'Para alterar a senha, preencha todos os campos: senha atual, nova senha e confirmação.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                if not user.check_password(senha_atual):
                    error_msg = 'Senha atual incorreta.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                if nova_senha != confirmar_senha:
                    error_msg = 'O primeiro e o segundo campo de nova senha não coincidem.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                # Validate password strength
                password_pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$'
                if not re.match(password_pattern, nova_senha):
                    error_msg = 'A nova senha não atende aos requisitos de segurança.'
                    if is_ajax:
                        return JsonResponse({'status': 'error', 'message': error_msg})
                    else:
                        messages.error(request, error_msg)
                        return redirect('configurar_profile')
                
                # Set new password
                user.set_password(nova_senha)
                # Keep user logged in after password change
                update_session_auth_hash(request, user)
            
            # Handle preferences form
            post_data = request.POST.copy()
            
            # Convert checkbox arrays to lists for MultiSelectField
            if 'dia_semana' in post_data:
                post_data['dia_semana'] = post_data.getlist('dia_semana')
            if 'horario' in post_data:
                post_data['horario'] = post_data.getlist('horario')
            if 'metodo_preferido' in post_data:
                post_data['metodo_preferido'] = post_data.getlist('metodo_preferido')
            
            preferences_form = EditarPreferenciasForm(post_data, instance=preferencias)
            
            # Validate both forms
            if profile_form.is_valid() and preferences_form.is_valid():
                # Save profile
                profile_form.save()
                # Save user (for phone number)
                user.save()
                # Save preferences
                preferences_form.save()
                
                success_msg = 'Perfil atualizado com sucesso!'
                if is_ajax:
                    return JsonResponse({'status': 'success', 'message': success_msg})
                else:
                    messages.success(request, success_msg)
                    return redirect('configurar_profile')
            else:
                # Collect all form errors
                errors = []
                if not profile_form.is_valid():
                    for field, error_list in profile_form.errors.items():
                        for error in error_list:
                            errors.append(f"{field}: {error}")
                if not preferences_form.is_valid():
                    for field, error_list in preferences_form.errors.items():
                        for error in error_list:
                            errors.append(f"{field}: {error}")
                
                error_msg = '; '.join(errors)
                if is_ajax:
                    return JsonResponse({'status': 'error', 'message': error_msg})
                else:
                    messages.error(request, error_msg)
                    return redirect('configurar_profile')
                    
        except Exception as e:
            error_msg = f'Erro inesperado: {str(e)}'
            if is_ajax:
                return JsonResponse({'status': 'error', 'message': error_msg})
            else:
                messages.error(request, error_msg)
                return redirect('configurar_profile')
    
    else:
        # GET request - create forms with current data
        profile_form = EditarPerfilForm(instance=user)
        preferences_form = EditarPreferenciasForm(instance=preferencias)
    
    context = {
        'form_perfil': profile_form,
        'form_preferencias': preferences_form,
        'user': user,
        'preferencias': preferencias
    }
    
    return render(request, 'configuracoes/user-profile.html', context)


def definir_foto_perfil(request, foto_id):
    # se o metodo for post
    if request.method == 'POST':
        try:
            # remove a foto de perfil atual
            request.user.fotos.update(foto_perfil=False)
            
            # define a nova foto de perfil e salva
            foto = request.user.fotos.get(id=foto_id)
            foto.foto_perfil = True
            foto.save()
            
            return JsonResponse({'status': 'success'})
        except FotosUsuario.DoesNotExist:
            return JsonResponse({'error': 'Foto não encontrada'})


@login_required(login_url='/accounts/login/')
@require_http_methods(["GET"])
def api_linkeds(request):
    """API endpoint para obter usuários linkados"""
    usuario_atual = request.user
    
    # pega todos os linkeds do usuario atual, ordenados pela data de criacao (mais recentes primeiro)
    meus_linkeds = Linkeds.objects.filter(
        models.Q(usuario1=usuario_atual) | models.Q(usuario2=usuario_atual)
    ).select_related('usuario1', 'usuario2').order_by('-data_realizacao')

    # cria uma lista de dicionarios com o usuario linkado e seus dados
    usuarios_linkados = []
    for link in meus_linkeds:
        # determina qual usuario é o linkado (não o usuario atual)
        if link.usuario1 == usuario_atual:
            linked_user = link.usuario2
        else:
            linked_user = link.usuario1
            
        # pega foto de perfil
        foto_perfil = linked_user.get_foto_perfil()
        foto_url = foto_perfil.imagem.url if foto_perfil else 'https://randomuser.me/api/portraits/men/32.jpg'
        
        usuarios_linkados.append({
            'id': linked_user.id,
            'name': linked_user.username,
            'course': linked_user.curso,
            'university': linked_user.universidade_nome,
            'semester': f"{linked_user.semestre}º Semestre" if linked_user.semestre else "Semestre não informado",
            'image': foto_url,
            'data_link': link.data_realizacao.isoformat()
        })
    
    return JsonResponse({
        'status': 'success',
        'linkeds': usuarios_linkados
    })


@login_required(login_url='/accounts/login/')
@require_http_methods(["GET"])
def api_grupos_estudo(request):
    """API endpoint para obter grupos de estudo do usuário"""
    usuario_atual = request.user
    
    # pega todos os grupos onde o usuario é membro ativo
    grupos_do_usuario = GrupoDeEstudos.objects.filter(
        membros__user=usuario_atual,
        membros__ativo=True,
        ativo=True
    ).prefetch_related('membros__user').order_by('-data_criacao')
    
    grupos_data = []
    for grupo in grupos_do_usuario:
        # pega os membros ativos do grupo
        membros_ativos = grupo.membros.filter(ativo=True).select_related('user')
        
        membros_info = []
        for membro in membros_ativos:
            foto_perfil = membro.user.get_foto_perfil()
            foto_url = foto_perfil.imagem.url if foto_perfil else 'https://randomuser.me/api/portraits/men/32.jpg'
            
            membros_info.append({
                'name': membro.user.username,
                'image': foto_url,
                'course': f"{membro.user.curso} - {membro.user.semestre}º semestre" if membro.user.semestre != 'Não informado' else 'Semestre não informado',
                'status': 'online'  # Por enquanto todos como online, depois pode implementar status real
            })
        
        # converte dias de encontros de string para lista
        try:
            dias_encontros = [int(d) for d in grupo.dias_encontros.split(',')] if grupo.dias_encontros else []
        except:
            dias_encontros = []
        
        grupos_data.append({
            'id': grupo.id,
            'name': grupo.nome,
            'subject': grupo.materia,
            'description': grupo.descricao,
            'meetings': grupo.horario_encontros,
            'location': grupo.localizacao_encontros or 'Local não definido',
            'members': membros_info,
            'meeting_days': dias_encontros,
            'member_count': len(membros_info)
        })
    
    return JsonResponse({
        'status': 'success',
        'groups': grupos_data
    })


@login_required(login_url='/accounts/login/')
@require_http_methods(["GET"])
def api_detalhes_grupo(request, grupo_id):
    """API endpoint para obter detalhes específicos de um grupo"""
    try:
        grupo = GrupoDeEstudos.objects.get(
            id=grupo_id,
            membros__user=request.user,
            membros__ativo=True
        )
    except GrupoDeEstudos.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Grupo não encontrado'}, status=404)
    
    # pega os membros ativos do grupo
    membros_ativos = grupo.membros.filter(ativo=True).select_related('user')
    
    membros_detalhados = []
    for membro in membros_ativos:
        foto_perfil = membro.user.get_foto_perfil()
        foto_url = foto_perfil.imagem.url if foto_perfil else 'https://randomuser.me/api/portraits/men/32.jpg'
        
        membros_detalhados.append({
            'id': membro.user.id,
            'name': membro.user.username,
            'image': foto_url,
            'course': f"{membro.user.curso} - {membro.user.semestre}º semestre",
            'university': membro.user.universidade_nome,
            'status': 'online',  # implementar status real depois
            'joined_at': membro.entrou_em.isoformat()
        })
    
    try:
        dias_encontros = [int(d) for d in grupo.dias_encontros.split(',')] if grupo.dias_encontros else []
    except:
        dias_encontros = []
    
    grupo_detalhes = {
        'id': grupo.id,
        'name': grupo.nome,
        'subject': grupo.materia,
        'description': grupo.descricao,
        'meetings': grupo.horario_encontros,
        'location': grupo.localizacao_encontros or 'Local não definido',
        'created_by': grupo.usuario_criador.username,
        'created_at': grupo.data_criacao.isoformat(),
        'members': membros_detalhados,
        'meeting_days': dias_encontros,
        'member_count': len(membros_detalhados),
        'max_members': grupo.maximo_membros
    }
    
    return JsonResponse({
        'status': 'success',
        'group': grupo_detalhes
    })


@login_required(login_url='/accounts/login/')
@require_http_methods(["GET", "POST"])
def api_configuracoes_usuario(request):
    """API endpoint para gerenciar configurações do usuário"""
    if request.method == "GET":
        # Buscar configurações existentes ou criar novas
        config, created = ConfiguracoesUsuario.objects.get_or_create(user=request.user)
        
        return JsonResponse({
            'status': 'success',
            'config': {
                'notificacao_linkeds': config.notificacao_linkeds,
                'notificacao_mensagens': config.notificacao_mensagens,
                'notificacao_eventos': config.notificacao_eventos,
                'notificacao_sons': config.notificacao_sons,
                'mostrar_status_online': config.mostrar_status_online,
                'confirmacao_leitura': config.confirmacao_leitura,
                'visibilidade_perfil': config.visibilidade_perfil,
                'mostrar_curso': config.mostrar_curso,
                'distancia_maxima': config.distancia_maxima,
                'modo_escuro': config.modo_escuro,
                'tamanho_fonte': config.tamanho_fonte,
                'idioma': config.idioma,
                'backup_automatico': config.backup_automatico,
                'notificacao_matchs': config.notificacao_matchs,
                'notificacao_eventos_grupos': config.notificacao_eventos_grupos,
            }
        })
    
    elif request.method == "POST":
        try:
            data = tratamento_dados_request(request)
            if not data:
                return criar_resposta_erro("Dados inválidos")
            
            # Buscar ou criar configurações
            config, created = ConfiguracoesUsuario.objects.get_or_create(user=request.user)
            
            # Atualizar campos
            boolean_fields = [
                'notificacao_linkeds', 'notificacao_mensagens', 'notificacao_eventos', 
                'notificacao_sons', 'mostrar_status_online', 'confirmacao_leitura',
                'visibilidade_perfil', 'mostrar_curso', 'modo_escuro', 'backup_automatico',
                'notificacao_matchs', 'notificacao_eventos_grupos'
            ]
            
            for field in boolean_fields:
                if field in data:
                    setattr(config, field, bool(data[field]))
            
            # Campos específicos
            if 'distancia_maxima' in data:
                config.distancia_maxima = int(data['distancia_maxima'])
            
            if 'tamanho_fonte' in data and data['tamanho_fonte'] in ['small', 'medium', 'large']:
                config.tamanho_fonte = data['tamanho_fonte']
            
            if 'idioma' in data and data['idioma'] in ['pt-br', 'en-us', 'es']:
                config.idioma = data['idioma']
            
            config.save()
            
            return JsonResponse({
                'status': 'success',
                'message': 'Configurações salvas com sucesso!',
                'config_id': config.id
            })
            
        except Exception as e:
            return criar_resposta_erro(f"Erro ao salvar configurações: {str(e)}")


@login_required(login_url='/accounts/login/')
@require_http_methods(["POST"])
def api_relatorio_problema(request):
    """API endpoint para enviar relatórios de problema"""
    try:
        data = tratamento_dados_request(request)
        if not data:
            return criar_resposta_erro("Dados inválidos")
        
        # Validar campos obrigatórios
        required_fields = ['tipo_problema', 'titulo', 'descricao']
        for field in required_fields:
            if not data.get(field):
                return criar_resposta_erro(f"Campo obrigatório: {field}")
        
        # Criar relatório
        relatorio = RelatorioProblema.objects.create(
            user=request.user if data.get('incluir_contato') else None,
            tipo_problema=data['tipo_problema'],
            titulo=data['titulo'],
            descricao=data['descricao'],
            dispositivo=data.get('dispositivo', ''),
            frequencia=data.get('frequencia', ''),
            prioridade=data.get('prioridade', ''),
            incluir_contato=data.get('incluir_contato', False),
            email_usuario=request.user.email if data.get('incluir_contato') else '',
            nome_usuario=request.user.username if data.get('incluir_contato') else '',
            arquivos_anexados=data.get('filesCount', 0)
        )
        
        return JsonResponse({
            'status': 'success',
            'message': f'Relatório #{relatorio.id} enviado com sucesso!',
            'report_id': relatorio.id
        })
        
    except Exception as e:
        return criar_resposta_erro(f"Erro ao enviar relatório: {str(e)}")


@login_required(login_url='/accounts/login/')
@require_http_methods(["GET"])
def api_exportar_dados(request):
    """API endpoint para exportar dados do usuário"""
    try:
        user = request.user
        
        # Buscar dados relacionados
        config = ConfiguracoesUsuario.objects.filter(user=user).first()
        preferencias = PreferenciasEstudo.objects.filter(user=user).first()
        fotos = FotosUsuario.objects.filter(user=user)
        grupos = MembroGrupoEstudos.objects.filter(user=user, ativo=True)
        
        # Preparar dados para exportação
        dados_exportacao = {
            'perfil': {
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'data_nascimento': user.data_nascimento.isoformat() if user.data_nascimento else None,
                'genero': user.genero,
                'estado': user.estado,
                'cidade': user.cidade,
                'universidade': user.universidade,
                'universidade_nome': user.universidade_nome,
                'curso': user.curso,
                'semestre': user.semestre,
                'celular': user.celular,
                'bio': user.bio,
                'data_cadastro': user.date_joined.isoformat(),
                'ultimo_login': user.last_login.isoformat() if user.last_login else None,
            },
            'configuracoes': {
                'notificacoes': {
                    'linkeds': config.notificacao_linkeds if config else True,
                    'mensagens': config.notificacao_mensagens if config else True,
                    'eventos': config.notificacao_eventos if config else False,
                    'sons': config.notificacao_sons if config else True,
                    'matchs': config.notificacao_matchs if config else True,
                    'eventos_grupos': config.notificacao_eventos_grupos if config else False,
                },
                'privacidade': {
                    'mostrar_status_online': config.mostrar_status_online if config else True,
                    'confirmacao_leitura': config.confirmacao_leitura if config else True,
                    'visibilidade_perfil': config.visibilidade_perfil if config else True,
                    'mostrar_curso': config.mostrar_curso if config else True,
                },
                'interface': {
                    'modo_escuro': config.modo_escuro if config else False,
                    'tamanho_fonte': config.tamanho_fonte if config else 'medium',
                    'idioma': config.idioma if config else 'pt-br',
                },
                'sistema': {
                    'backup_automatico': config.backup_automatico if config else True,
                    'distancia_maxima': config.distancia_maxima if config else 50,
                }
            },
            'preferencias_estudo': {
                'dias_semana': preferencias.dia_semana if preferencias else [],
                'horarios': preferencias.horario if preferencias else [],
                'metodos': preferencias.metodo_preferido if preferencias else [],
            },
            'grupos_estudo': [
                {
                    'nome': membro.grupo.nome,
                    'materia': membro.grupo.materia,
                    'entrou_em': membro.entrou_em.isoformat(),
                    'ativo': membro.ativo
                }
                for membro in grupos
            ],
            'fotos': [
                {
                    'descricao': foto.descricao,
                    'foto_perfil': foto.foto_perfil,
                    'ordem': foto.ordem,
                    'data_upload': foto.data_upload.isoformat()
                }
                for foto in fotos
            ],
            'data_exportacao': user.date_joined.isoformat(),
            'versao_exportacao': '1.0'
        }
        
        return JsonResponse({
            'status': 'success',
            'data': dados_exportacao
        })
        
    except Exception as e:
        return criar_resposta_erro(f"Erro ao exportar dados: {str(e)}")
