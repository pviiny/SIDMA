    document.addEventListener("DOMContentLoaded", () => {

        // ================= 1. MENU ATIVO CONFORME O SCROLL =================
        const navbarLinks = document.querySelectorAll(".navbar a:not(.nav-btn)");
        const sections = document.querySelectorAll("section");

        function activateMenuOnScroll() {
            let currentSectionId = "";

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                // Detecta se a seção passou da metade superior da tela
                if (window.scrollY >= sectionTop - 200) {
                    currentSectionId = section.getAttribute("id");
                }
            });

            navbarLinks.forEach(link => {
                link.classList.remove("active");
                if (currentSectionId && link.getAttribute("href").includes(currentSectionId)) {
                    link.classList.add("active");
                }
            });
        }

        window.addEventListener("scroll", activateMenuOnScroll);


        // ================= 2. ANIMAÇÃO SUAVE AO ROLAR A PÁGINA (SCROLL REVEAL) =================
        const animationStyles = {
            'fade-up': { transform: 'translateY(40px)', opacity: '0' },
            'fade-left': { transform: 'translateX(-50px)', opacity: '0' },
            'fade-right': { transform: 'translateX(50px)', opacity: '0' },
            'fade-in': { opacity: '0' }
        };

        const animatedElements = document.querySelectorAll('.fade-up, .fade-left, .fade-right, .fade-in');

        animatedElements.forEach(element => {
            element.style.transition = "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)";

            for (const [className, styles] of Object.entries(animationStyles)) {
                if (element.classList.contains(className)) {
                    Object.assign(element.style, styles);
                }
            }
        });

        const appearanceObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target;

                    target.style.opacity = '1';
                    target.style.transform = 'translate(0, 0)';

                    observer.unobserve(target);
                }
            });
        }, {
            root: null,
            threshold: 0.10
        });

        animatedElements.forEach(element => appearanceObserver.observe(element));


        // ================= 3. EFEITO GLASSMORPHISM DINÂMICO NO MENU OTIMIZADO =================
        const header = document.querySelector(".header");

        function toggleHeaderBackground() {
            if (!header) return;

            if (window.scrollY > 50) {
                header.style.boxShadow = "0 10px 30px rgba(0, 0, 0, 0.5)";
                header.style.background = "rgba(10, 12, 10, 0.9)";
            } else {
                header.style.boxShadow = "none";
                header.style.background = "rgba(10, 12, 10, 0.75)";
            }
        }

        window.addEventListener("scroll", toggleHeaderBackground);

        toggleHeaderBackground();
        activateMenuOnScroll();
    });


    // ================= 4. SISTEMA GLOBAL DE NOTIFICAÇÕES (TOAST) =================
    function triggerNotice(message) {
        const toast = document.getElementById("globalToast");
        const toastMsg = document.getElementById("toastMessage");

        if (!toast || !toastMsg) return;

        toastMsg.textContent = message;
        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 4000);
    }

    // Configuração da URL global apontando para o seu backend oficial hospedado na Render
    const SIDMA_API_BASE = "https://sidma.onrender.com/api";

    function getSidmaToken() {
        return localStorage.getItem("sidma_token");
    }

    async function sidmaRequest(path, options = {}) {
        const headers = {
            "Content-Type": "application/json",
            ...(options.headers || {})
        };

        const token = getSidmaToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${SIDMA_API_BASE}${path}`, {
            ...options,
            headers
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(data.error || "Falha na comunicação com a API SIDMA.");
        }

        return data;
    }

    // ==========================================================================
    // CONTROLADORES DA TELA DE DENÚNCIA (DADOS DINÂMICOS, GPS E PREVIEW)
    // ==========================================================================
    let map;
    let marker;
    let damageCircle;
    let selectedCoordinates = null;

    function initMap() {
        const defaultLocation = { lat: -3.119027, lng: -60.021731 };

        const darkMapStyle = [
            { "elementType": "geometry", "stylers": [{ "color": "#121512" }] },
            { "elementType": "labels.text.fill", "stylers": [{ "color": "#747a74" }] },
            { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121512" }] },
            { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c332c" }] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1c221c" }] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#070a07" }] }
        ];

        map = new google.maps.Map(document.getElementById("googleMapContainer"), {
            center: defaultLocation,
            zoom: 14,
            styles: darkMapStyle,
            disableDefaultUI: true,
            zoomControl: true
        });

        marker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            draggable: true,
            title: "Foco da Ocorrência"
        });

        damageCircle = new google.maps.Circle({
            map: map,
            radius: 100,
            fillColor: "#00e676",
            fillOpacity: 0.15,
            strokeColor: "#00e676",
            strokeOpacity: 0.5,
            widgetWeight: 1
        });

        damageCircle.bindTo("center", marker, "position");

        google.maps.event.addListener(marker, 'dragend', function () {
            selectedCoordinates = marker.getPosition();
        });

    }
// Execução de binds dos componentes de tela
if (document.getElementById("formDenunciaAmbiental")) {
    
    const optAnonimo = document.getElementById("optAnonimo");
    const optIdentificado = document.getElementById("optIdentificado");
    const dadosIdentificacao = document.getElementById("dadosIdentificacao");
    const campoNome = document.getElementById("nomeCompleto");
    const campoCpf = document.getElementById("cpfUsuario");

    // Controle de Privacidade (Anônimo/Identificado)
    optAnonimo.addEventListener("click", () => {
        optAnonimo.classList.add("active");
        optIdentificado.classList.remove("active");
        dadosIdentificacao.classList.add("hidden");
        campoNome.required = false; 
        campoCpf.required = false;
        campoNome.value = ""; 
        campoCpf.value = "";
    });

    optIdentificado.addEventListener("click", () => {
        optIdentificado.classList.add("active");
        optAnonimo.classList.remove("active");
        dadosIdentificacao.classList.remove("hidden");
        campoNome.required = true; 
        campoCpf.required = true;
    });

    // Máscara de CPF
    campoCpf.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        e.target.value = value;
    });

    // CONTROLES DO MODAL DO MAPA
    const btnOpenMaps = document.getElementById("btnGpsSmart");
    const inputLocalizacao = document.getElementById("localizacaoOcorrencia");
    const mapsModal = document.getElementById("mapsModal");
    const btnCloseMaps = document.getElementById("btnCloseMaps");
    const btnConfirmarLocal = document.getElementById("btnConfirmarLocal");
    const radiusSlider = document.getElementById("radiusSlider");
    const radiusVal = document.getElementById("radiusVal");

    // Gatilho para Abrir o Mapa Interativo
    btnOpenMaps.addEventListener("click", () => {
        mapsModal.classList.remove("hidden");
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLoc = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(userLoc);
                marker.setPosition(userLoc);
                selectedCoordinates = marker.getPosition();
            });
        }
    });

    // Fechar Modal sem Salvar
    btnCloseMaps.addEventListener("click", () => mapsModal.classList.add("hidden"));

    // Atualização do Raio em Tempo Real ao arrastar o Slider
    radiusSlider.addEventListener("input", (e) => {
        const radiusInMeters = parseInt(e.target.value);
        radiusVal.textContent = radiusInMeters;
        if (damageCircle) {
            damageCircle.setRadius(radiusInMeters);
        }
    });

    // Confirmar Escolha de Posição do Mapa
    btnConfirmarLocal.addEventListener("click", () => {
        const coords = selectedCoordinates || marker.getPosition();
        const lat = coords.lat().toFixed(6);
        const lng = coords.lng().toFixed(6);
        const raio = radiusSlider.value;

        inputLocalizacao.value = `Lat: ${lat}, Lng: ${lng} (Raio: ${raio}m)`;
        
        mapsModal.classList.add("hidden");
        triggerNotice("Área demarcada com sucesso no satélite.");
    });

    // Controle de Upload de Imagem de Evidência
    const arquivoEvidencia = document.getElementById("arquivoEvidencia");
    const textoUpload = document.getElementById("textoUpload");
    const containerPreview = document.getElementById("containerPreview");
    const imgPreview = document.getElementById("imgPreview");

    arquivoEvidencia.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            textoUpload.textContent = `Evidência: ${file.name}`;
            const reader = new FileReader();
            reader.onload = function(event) {
                imgPreview.src = event.target.result;
                containerPreview.classList.remove("hidden");
            };
            reader.readAsDataURL(file);
            triggerNotice("Foto carregada com sucesso.");
        }
    });

    // Envio Final do Formulário para a API da Render
    document.getElementById("formDenunciaAmbiental").addEventListener("submit", async (e) => {
        e.preventDefault();
        triggerNotice("Enviando pacote de dados criptografados...");

        const payload = {
            titulo: document.getElementById("tituloOcorrencia").value.trim(),
            descricao: document.getElementById("descricaoOcorrencia").value.trim(),
            privacidade: document.querySelector("input[name='privacidade']:checked")?.value || "anonimo",
            denunciante_nome: campoNome.value.trim() || null,
            denunciante_cpf: campoCpf.value.trim() || null,
            localizacao_texto: inputLocalizacao.value.trim(),
            prioridade: "media",
            evidencia_url: imgPreview.src || null
        };

        try {
            await sidmaRequest("/denuncias", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            triggerNotice("Sucesso! Registro inserido na fila de fiscalização.");
            document.getElementById("formDenunciaAmbiental").reset();
            containerPreview.classList.add("hidden");
            textoUpload.textContent = "Clique para carregar foto da evidência";
            optAnonimo.click();
        } catch (error) {
            triggerNotice(error.message);
        }
    });
}

// ==========================================================================
// CONTROLADORES DA TELA DE LOGIN ADMINISTRATIVO
// ==========================================================================
if (document.getElementById("formLoginAdm")) {
    
    const campoSenha = document.getElementById("loginPassword");
    const btnTogglePassword = document.getElementById("btnTogglePassword");
    const formLogin = document.getElementById("formLoginAdm");
    const btnEsqueci = document.getElementById("btnEsqueciSenha");

    btnTogglePassword.addEventListener("click", () => {
        const isPassword = campoSenha.getAttribute("type") === "password";
        campoSenha.setAttribute("type", isPassword ? "text" : "password");
        
        btnTogglePassword.innerHTML = isPassword 
            ? '<i class="fas fa-eye-slash"></i>' 
            : '<i class="fas fa-eye"></i>';
            
        btnTogglePassword.style.color = isPassword ? "#00e676" : "#8a8f8a";
    });

    btnEsqueci.addEventListener("click", (e) => {
        e.preventDefault();
        triggerNotice("Contate o administrador do STI para redefinir sua credencial.");
    });

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const usuario = document.getElementById("loginUser").value.trim();
        const senha = campoSenha.value;
        
        triggerNotice("Validando assinatura digital...");

        try {
            const data = await sidmaRequest("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    credencial: usuario,
                    senha
                })
            });

            localStorage.setItem("sidma_token", data.token);
            localStorage.setItem("sidma_usuario", JSON.stringify(data.usuario));
            triggerNotice(`Bem-vindo de volta, operador ${data.usuario.nome}!`);

            setTimeout(() => {
                window.location.href = "dashboard.html";
            }, 700);
        } catch (error) {
            triggerNotice(error.message);
        }
    });
}

// ==========================================================================
// DASHBOARD ADMINISTRATIVA CONSUMINDO API REST
// ==========================================================================
if (document.body.classList.contains("dashboard-body")) {
    const token = getSidmaToken();

    if (!token) {
        window.location.href = "login.html";
    }

    const statusLabels = {
        recebida: "Recebida",
        em_triagem: "Em triagem",
        em_campo: "Em campo",
        resolvida: "Resolvida",
        arquivada: "Arquivada"
    };

    const priorityLabels = {
        baixa: "Baixa",
        media: "Media",
        alta: "Alta"
    };

    const priorityClass = {
        baixa: "low",
        media: "medium",
        alta: "high"
    };

    function setText(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    function formatDateTime(value) {
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(new Date(value));
    }

    function renderMetrics(resumo) {
        setText("metricAbertas", resumo.abertas || 0);
        setText("metricAltaPrioridade", resumo.alta_prioridade || 0);
        setText("metricResolvidas", resumo.resolvidas || 0);
        setText("metricAreas", resumo.areas_monitoradas || 0);

        const novasHoje = document.getElementById("metricNovasHoje");
        if (novasHoje) {
            novasHoje.innerHTML = `<i class="fas fa-arrow-up"></i> ${resumo.novas_hoje || 0} novas hoje`;
        }

        const zonasCriticas = document.getElementById("metricZonasCriticas");
        if (zonasCriticas) {
            zonasCriticas.innerHTML = `<i class="fas fa-satellite-dish"></i> ${resumo.alta_prioridade || 0} zonas críticas`;
        }
    }

    function renderStatus(porStatus) {
        const totals = porStatus.reduce((acc, item) => {
            acc[item.status] = item.total;
            return acc;
        }, {});

        setText("statusRecebidas", totals.recebida || 0);
        setText("statusTriagem", totals.em_triagem || 0);
        setText("statusCampo", totals.em_campo || 0);
        setText("statusResolvidas", totals.resolvida || 0);
    }

    function renderChart(ultimosSeteDias) {
        const chart = document.getElementById("dashboardBarChart");
        if (!chart) return;

        const max = Math.max(...ultimosSeteDias.map(item => item.total), 1);

        chart.innerHTML = ultimosSeteDias.map((item) => {
            const date = new Date(`${item.dia}T00:00:00`);
            const label = new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
            const height = Math.max((item.total / max) * 88, 12);
            return `<div style="--bar-height: ${height}%;" title="${item.total} denúncias"><span>${label}</span></div>`;
        }).join("");
    }

    function renderCriticalLocations(locaisCriticos) {
        const topLocation = locaisCriticos[0];

        if (!topLocation) {
            setText("criticalLocationTitle", "Sem dados");
            setText("criticalLocationText", "Aguardando registros de ocorrências");
            return;
        }

        setText("criticalLocationTitle", topLocation.localizacao_texto);
        setText("criticalLocationText", `${topLocation.total} ocorrência(s) registradas nesta área`);
    }

    function renderRecentIncidents(recentes) {
        const list = document.getElementById("dashboardIncidentList");
        if (!list) return;

        if (!recentes.length) {
            list.innerHTML = `<div class="incident-row"><div><strong>Nenhuma denúncia cadastrada</strong><small>Os registros enviados pela comunidade aparecerão aqui.</small></div></div>`;
            return;
        }

        list.innerHTML = recentes.map((denuncia) => `
            <div class="incident-row">
                <span class="priority ${priorityClass[denuncia.prioridade] || "medium"}">${priorityLabels[denuncia.prioridade] || "Media"}</span>
                <div>
                    <strong>${denuncia.titulo}</strong>
                    <small>${denuncia.localizacao_texto} · ${statusLabels[denuncia.status] || denuncia.status}</small>
                </div>
                <em>${formatDateTime(denuncia.criado_em)}</em>
            </div>
        `).join("");
    }

    async function loadDashboard() {
        try {
            const data = await sidmaRequest("/dashboard/overview");
            renderMetrics(data.resumo || {});
            renderStatus(data.porStatus || []);
            renderChart(data.ultimosSeteDias || []);
            renderCriticalLocations(data.locaisCriticos || []);
            renderRecentIncidents(data.recentes || []);
        } catch (error) {
            triggerNotice(error.message);

            if (error.message.includes("Token")) {
                localStorage.removeItem("sidma_token");
                localStorage.removeItem("sidma_usuario");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 900);
            }
        }
    }

    document.getElementById("btnRefreshDashboard")?.addEventListener("click", loadDashboard);
    document.getElementById("btnLogoutDashboard")?.addEventListener("click", () => {
        localStorage.removeItem("sidma_token");
        localStorage.removeItem("sidma_usuario");
    });

    loadDashboard();
}
