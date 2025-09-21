document.addEventListener("DOMContentLoaded", () => {
    const aceitarCheckbox = document.querySelector("#termo");
    const botaoCadastrar = document.querySelector("#btnCadastrar");
    const botaoTermos = document.querySelector(".botaoTermos");
    const modalTermos = document.getElementById("modalTermos");
    const fecharModal = document.getElementById("fecharModal");

    // Elementos para o gênero customizado
    const generoSelect = document.getElementById("genero");
    const generoCustomizadoContainer = document.getElementById("genero-customizado-container");
    const generoCustomizadoInput = document.getElementById("genero-customizado");

    // Funcionalidade do gênero customizado
    if (generoSelect && generoCustomizadoContainer) {
        generoSelect.addEventListener("change", () => {
            if (generoSelect.value === "outro") {
                generoCustomizadoContainer.style.display = "block";
                if (generoCustomizadoInput) {
                    generoCustomizadoInput.setAttribute("required", "required");
                }
            } else {
                generoCustomizadoContainer.style.display = "none";
                if (generoCustomizadoInput) {
                    generoCustomizadoInput.removeAttribute("required");
                    generoCustomizadoInput.value = ""; // Limpa o campo quando escondido
                }
            }
        });
    }

    if (botaoCadastrar) botaoCadastrar.disabled = true;

    if (aceitarCheckbox && botaoCadastrar) {
        aceitarCheckbox.addEventListener("change", () => {
            botaoCadastrar.disabled = !aceitarCheckbox.checked;
        });
    }

    if (botaoTermos && modalTermos) {
        botaoTermos.addEventListener("click", () => {
            modalTermos.style.display = "block";
        });

        botaoTermos.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                modalTermos.style.display = "block";
            }
        });
    }

    if (fecharModal && modalTermos) {
        fecharModal.addEventListener("click", () => {
            modalTermos.style.display = "none";
        });
    }

    if (modalTermos) {
        window.addEventListener("click", (e) => {
            if (e.target === modalTermos) {
                modalTermos.style.display = "none";
            }
        });
    }

    // const abrirTermos = document.querySelector(".abrirTermos");
    // if (abrirTermos) {
    //     abrirTermos.addEventListener("click", (e) => {
    //         e.preventDefault();
    //         if (modalTermos) modalTermos.style.display = "block";
    //     });
    // }

    // cadastro das universidades

    function mostrarStep(step) {
        document.querySelectorAll('.step').forEach(s => {
            s.classList.remove('active');
        });
        step.classList.add('active');
    }


    const $ = id => document.getElementById(id);
    const step1 = $("step-1");
    const step2 = $("step-2");
    const btnContinuar = $("btn-continuar")
    const formError = $("form-error")
    const signupForm = $("signup-form")
    const estado = $("estado")
    const cidade = $("cidade")
    const universidade = $("universidade")
    const curso = $("curso")
    const formErrorsDjango = document.querySelector(".form-errors");
    // const [estado, cidade, universidade, curso] = ["estado", "cidade", "universidade", "curso"].map($);
    // const [step1, step2] = [$("step-1"), $("step-2")];
    // const [btnContinuar, formError, signupForm] = [document.querySelector("#btn-continuar"), $("form-error"), $("signup-form")];

    let universidades = [];

    const mostrarErro = (msg) => {
        if (formError) {
            formError.textContent = msg;
            formError.style.display = "block";
        }
    };

    const ocultarErro = () => {
        if (formError) formError.style.display = "none";
    };

    const preencherSelect = (element, valores, placeholder) => {
        if (element) {
            element.innerHTML = `<option value="">${placeholder}</option>` +
                valores.map(v => `<option value="${v.value || v}">${v.label || v}</option>`).join("");
        }
    };

    // tratamento de erros na proxima secao
    if (formErrorsDjango) {
        if (formErrorsDjango.children.length > 0) {
            formErrorsDjango.style.display = "block";
            if (step1) step1.classList.add("active");
            if (step2) step2.classList.remove("active");
        } else {
            formErrorsDjango.style.display = "none";
        }
    }

    // evento do botao continuar
    if (btnContinuar && step1 && step2 && signupForm) {
        btnContinuar.addEventListener("click", () => {

            // Coleta todos os campos obrigatórios
            const camposObrigatorios = step1.querySelectorAll("input[required], select[required], input[type='checkbox'][required]");

            const todosPreenchidos = [...camposObrigatorios].every(f => {
                if (f.type === 'checkbox') {
                    return f.checked;
                }
                return f.value.trim();
            });

            // Validação específica para gênero customizado
            if (generoSelect?.value === "outro" && !generoCustomizadoInput?.value.trim()) {
                mostrarErro("Por favor, especifique seu gênero.");
                return;
            }
            const senha = signupForm.querySelector("input[name='password1']")?.value;
            const senhaConfirm = signupForm.querySelector("input[name='password2']")?.value;

            if (formErrorsDjango) formErrorsDjango.style.display = "none";

            if (!todosPreenchidos) {
                mostrarErro("Por favor, preencha todos os campos obrigatórios.");
                return;
            }

            if (senha !== senhaConfirm) {
                mostrarErro("As senhas não coincidem!");
                return;
            }

            ocultarErro();

            mostrarStep(step2);

            fetch("http://localhost:3000/universidades")
                .then(res => {
                    if (!res.ok) throw new Error("Erro na resposta");
                    return res.json();
                })
                .then(data => {
                    universidades = data;
                    const estados = [...new Set(data.map(u => u.estado))];
                    if (estado) preencherSelect(estado, estados, "Selecione o estado");
                })
                .catch(error => {
                    console.error("Erro ao carregar universidades:", error);
                    mostrarErro("Erro ao carregar dados. Tente novamente.");
                });
        });
    }

    const btnVoltar = document.createElement("span");
    btnVoltar.textContent = "Voltar";
    btnVoltar.className = "ja-tenho-conta-link";
    btnVoltar.style.cursor = "pointer";
    btnVoltar.style.fontSize = "14px";
    btnVoltar.style.color = "rgb(221, 213, 213)";
    btnVoltar.style.textDecoration = "underline";
    btnVoltar.style.display = "inline-block";
    btnVoltar.addEventListener("click", () => {
        mostrarStep(step1);
    });
    
    // Add hover effect to match CSS
    btnVoltar.addEventListener("mouseenter", () => {
        btnVoltar.style.color = "#347cfc";
    });
    
    btnVoltar.addEventListener("mouseleave", () => {
        btnVoltar.style.color = "rgb(221, 213, 213)";
    });

    const formFooter = document.querySelector(".form-footer");
    formFooter.insertBefore(btnVoltar, btnContinuar);
    btnVoltar.style.display = "none";

    function atualizarBotoes() {
        if (step2.classList.contains("active")) {
            btnContinuar.style.display = "none";
            btnVoltar.style.display = "inline-block";
            document.getElementById("btnCadastrar").style.display = "block";
        } else {
            btnContinuar.style.display = "block";
            btnVoltar.style.display = "none";
            document.getElementById("btnCadastrar").style.display = "none";
        }
    }
    const observer = new MutationObserver(atualizarBotoes);
    observer.observe(step1, { attributes: true, attributeFilter: ['class'] });
    observer.observe(step2, { attributes: true, attributeFilter: ['class'] });

    // Eventos para selects dinâmicos
    if (estado) {
        estado.addEventListener("change", () => {
            const cidades = [...new Set(universidades
                .filter(u => u.estado === estado.value)
                .map(u => u.cidade))];
            if (cidade) preencherSelect(cidade, cidades, "Selecione a cidade");
            if (universidade) preencherSelect(universidade, [], "Selecione uma cidade primeiro");
            if (curso) preencherSelect(curso, [], "Selecione uma universidade primeiro");
        });
    }

    if (cidade) {
        cidade.addEventListener("change", () => {
            const unis = universidades.filter(u =>
                u.estado === estado?.value &&
                u.cidade === cidade.value
            );
            if (universidade) preencherSelect(universidade,
                unis.map(u => ({ value: u.id, label: u.nome })),
                "Selecione a universidade"
            );
            if (curso) preencherSelect(curso, [], "Selecione um curso primeiro");
        });
    }

    if (universidade) {
        universidade.addEventListener("change", () => {
            const uni = universidades.find(u => u.id === universidade.value);
            if (curso) preencherSelect(curso, (uni?.cursos || []), "Selecione o curso");
        });
    }

    if (signupForm) {
        signupForm.addEventListener("submit", e => {
            const obrigatorios = document.querySelectorAll("input[required], select[required]");
            const preenchidos = [...obrigatorios].every(f => {
                if (f.type === 'checkbox') {
                    return f.checked;
                }
                return f.value.trim();
            });

            // Validação específica para gênero customizado na submissão final
            if (generoSelect?.value === "outro" && !generoCustomizadoInput?.value.trim()) {
                e.preventDefault();
                mostrarErro("Por favor, especifique seu gênero.");
                if (step1) step1.classList.add("active");
                if (step2) step2.classList.remove("active");
                return;
            }

            // Before submitting, if "outro" is selected, set a hidden field or modify the genero value
            if (generoSelect?.value === "outro" && generoCustomizadoInput?.value.trim()) {
                // We'll handle this in the backend by checking both fields
                // The form will submit both genero="outro" and genero_customizado with the custom value
            }

            // Add university name to the form before submitting
            if (universidade && universidade.value) {
                // Find the selected university name
                const selectedUniversityText = universidade.options[universidade.selectedIndex]?.text;
                if (selectedUniversityText && selectedUniversityText !== "Selecione a universidade") {
                    // Create or update hidden field with university name
                    let hiddenUniversidadeNome = document.querySelector('input[name="universidade_nome"]');
                    if (!hiddenUniversidadeNome) {
                        hiddenUniversidadeNome = document.createElement('input');
                        hiddenUniversidadeNome.type = 'hidden';
                        hiddenUniversidadeNome.name = 'universidade_nome';
                        signupForm.appendChild(hiddenUniversidadeNome);
                    }
                    hiddenUniversidadeNome.value = selectedUniversityText;
                }
            }

            if (!preenchidos) {
                e.preventDefault();
                mostrarErro("Por favor, preencha todos os campos obrigatórios.");
                if (step1) step1.classList.add("active");
                if (step2) step2.classList.remove("active");
            }
        });
    }
});
