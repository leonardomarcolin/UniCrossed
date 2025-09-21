from allauth.account.forms import SignupForm
from django import forms
from django.core.exceptions import ValidationError

from accounts.models import CustomUser, PreferenciasEstudo


class CustomSignupForm(SignupForm):
    username = forms.CharField(widget=forms.HiddenInput(), required=False)  # mantém o campo, mas oculto
    primeiro_nome = forms.CharField(max_length=30, required=True)
    ultimo_nome = forms.CharField(max_length=30, required=True)
    data_nascimento = forms.DateField(required=True)
    genero = forms.CharField(max_length=20, required=True)
    estado = forms.CharField(max_length=100, required=True)
    cidade = forms.CharField(max_length=100, required=True)
    universidade = forms.CharField(max_length=100, required=True)
    curso = forms.CharField(max_length=100, required=True)

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and CustomUser.objects.filter(email__iexact=email).exists():
            raise ValidationError("Este email já está cadastrado.")
        return email
    
    def clean(self):
        cleaned_data = super().clean()
        genero = cleaned_data.get('genero')
        
        # Se genero for "outro", pega o valor customizado do request
        if genero == 'outro':
            genero_customizado = self.data.get('genero_customizado', '').strip()
            if genero_customizado:
                cleaned_data['genero'] = genero_customizado
        
        return cleaned_data

    def save(self, request):
        user = super().save(request)

        # Preenche username se estiver vazio (ou no caso, sempre preencher)
        if not user.username:
            user.username = user.email.split('@')[0]  # ou outro gerador único
            user.save()

        user.first_name = self.cleaned_data['primeiro_nome']
        user.last_name = self.cleaned_data['ultimo_nome']
        user.data_nascimento = self.cleaned_data['data_nascimento']
        user.genero = self.cleaned_data['genero']  # Agora isso já terá o valor customizado se foi fornecido
        user.estado = self.cleaned_data['estado']
        user.cidade = self.cleaned_data['cidade']
        user.universidade = self.cleaned_data['universidade']  # This is the ID
        
        # Get the university name from the request data
        # The frontend should send this as a hidden field or we can extract it
        user.universidade_nome = request.POST.get('universidade_nome', 'Nome não informado')
        
        user.curso = self.cleaned_data['curso']
        user.save()

        return user

class EditarPerfilForm(forms.ModelForm):
    universidade_nome = forms.CharField(
        max_length=200,
        required=True,
        label="Nome da Universidade",
        help_text="Digite o nome completo da sua universidade"
    )
    
    class Meta:
        model = CustomUser
        fields = ['first_name', 'last_name', 'universidade', 'universidade_nome', 'curso', 'bio', 'habilidades', 'semestre']
        labels = {
            'first_name': 'Nome',
            'last_name': 'Sobrenome',
            'universidade': 'ID da Universidade (somente leitura)',
            'curso': 'Curso',
            'bio': 'Biografia',
            'habilidades': 'Habilidades',
            'semestre': 'Semestre'
        }
        widgets = {
            'universidade': forms.TextInput(attrs={'readonly': True, 'class': 'form-control-readonly'}),
            'bio': forms.Textarea(attrs={'rows': 4}),
        }
    
        
class EditarPreferenciasForm(forms.ModelForm):
    class Meta:
        model = PreferenciasEstudo
        fields = ['dia_semana','metodo_preferido','horario']