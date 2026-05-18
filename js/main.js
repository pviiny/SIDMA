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

    if (sections.length > 0 && navbarLinks.length > 0) {
        window.addEventListener("scroll", activateMenuOnScroll);
        activateMenuOnScroll();
    }


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

    if (header) {
        window.addEventListener("scroll", toggleHeaderBackground);
        toggleHeaderBackground();
    }
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
    const mapContainer = document.getElementById("googleMapContainer");
    if (!mapContainer) return;

    const defaultLocation = { lat: -3.119027, lng: -60.021731 };

    const darkMapStyle = [
        { "elementType": "geometry", "stylers": [{ "color": "#121512" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#747a74" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#121512" }] },
        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#2c332c" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1c221c" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#070a07" }] }
    ];

    map = new google.maps.Map(mapContainer, {
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
    if (optAnonimo && optIdentificado) {
        optAnonimo.addEventListener("click", () => {
            optAnonimo.classList.add("active");
            optIdentificado.classList.remove("active");
            if (dadosIdentificacao) dadosIdentificacao.classList.add("hidden");
            if (campoNome) campoNome.required = false;
            if (campoCpf) campoCpf.required = false;
            if (campoNome) campoNome.value = "";
            if (campoCpf) campoCpf.value = "";
        });

        optIdentificado.addEventListener("click", () => {
            optIdentificado.classList.add("active");
            optAnonimo.classList.remove("active");
            if (dadosIdentificacao) dadosIdentificacao.classList.remove("hidden");
            if (campoNome) campoNome.required = true;
            if (campoCpf) campoCpf.required = true;
        });
    }

    // Máscara de CPF
    if (campoCpf) {
        campoCpf.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 11) value = value.slice(0, 11);
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            e.target.value = value;
        });
    }

    // CONTROLES DO MODAL DO MAPA
    const btnOpenMaps = document.getElementById("btnGpsSmart");
    const inputLocalizacao = document.getElementById("localizacaoOcorrencia");
    const mapsModal = document.getElementById("mapsModal");
    const btnCloseMaps = document.getElementById("btnCloseMaps");
    const btnConfirmarLocal = document.getElementById("btnConfirmarLocal");
    const radiusSlider = document.getElementById("radiusSlider");
    const radiusVal = document.getElementById("radiusVal");

    // Gatilho para Abrir o Mapa Interativo
    if (btnOpenMaps && mapsModal) {
        btnOpenMaps.addEventListener("click", () => {
            mapsModal.classList.remove("hidden");

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    const userLoc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    if (map && marker) {
                        map.setCenter(userLoc);
                        marker.setPosition(userLoc);
                        selectedCoordinates = marker.getPosition();
                    }
                });
            }
        });
    }

    // Fechar Modal sem Salvar
    if (btnCloseMaps && mapsModal) {
        btnCloseMaps.addEventListener("click", () => mapsModal.classList.add("hidden"));
    }

    // Atualização do Raio em Tempo Real ao arrastar o Slider
    if (radiusSlider && radiusVal) {
        radiusSlider.addEventListener("input", (e) => {
            const radiusInMeters = parseInt(e.target.value);
            radiusVal.textContent = radiusInMeters;
            if (damageCircle) {
                damageCircle.setRadius(radiusInMeters);
            }
        });
    }

    // Confirmar Escolha de Posição do Mapa
    if (btnConfirmarLocal && inputLocalizacao && mapsModal) {
        btnConfirmarLocal.addEventListener("click", () => {
            if (!marker) return;
            const coords = selectedCoordinates || marker.getPosition();
            const lat = coords.lat().toFixed(6);
            const lng = coords.lng().toFixed(6);
            const raio = radiusSlider ? radiusSlider.value : 100;

            inputLocalizacao.value = `Lat: ${lat}, Lng: ${lng} (Raio: ${raio}m)`;

            mapsModal.classList.add("hidden");
            triggerNotice("Área demarcada com sucesso no satélite.");
        });
    }

    // Controle de Upload de Imagem de Evidência
    const arquivoEvidencia = document.getElementById("arquivoEvidencia");
    const textoUpload = document.getElementById("textoUpload");
    const containerPreview = document.getElementById("containerPreview");
    const imgPreview = document.getElementById("imgPreview");

    if (arquivoEvidencia && textoUpload && containerPreview && imgPreview) {
        arquivoEvidencia.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                textoUpload.textContent = `Evidência: ${file.name}`;
                const reader = new FileReader();
                reader.onload = function (event) {
                    imgPreview.src = event.target.result;
                    containerPreview.classList.remove("hidden");
                };
                reader.readAsDataURL(file);
                triggerNotice("Foto carregada com sucesso.");
            }
        });
    }

    // Envio Final do Formulário para a API da Render
    document.getElementById("formDenunciaAmbiental").addEventListener("submit", async (e) => {
        e.preventDefault();
        triggerNotice("Enviando pacote de dados criptografados...");

        const payload = {
            titulo: document.getElementById("tituloOcorrencia").value.trim(),
            descricao: document.getElementById("descricaoOcorrencia").value.trim(),
            privacidade: document.querySelector("input[name='privacidade']:checked")?.value || "anonimo",
            denunciante_nome: campoNome ? campoNome.value.trim() || null : null,
            denunciante_cpf: campoCpf ? campoCpf.value.trim() || null : null,
            localizacao_texto: inputLocalizacao ? inputLocalizacao.value.trim() : "",
            prioridade: "media",
            evidencia_url: imgPreview ? imgPreview.src || null : null
        };

        try {
            await sidmaRequest("/denuncias", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            triggerNotice("Sucesso! Registro inserido na fila de fiscalização.");
            document.getElementById("formDenunciaAmbiental").reset();
            if (containerPreview) containerPreview.classList.add("hidden");
            if (textoUpload) textoUpload.textContent = "Clique para carregar foto da evidência";
            if (optAnonimo) optAnonimo.click();
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

    if (btnTogglePassword && campoSenha) {
        btnTogglePassword.addEventListener("click", () => {
            const isPassword = campoSenha.getAttribute("type") === "password";
            campoSenha.setAttribute("type", isPassword ? "text" : "password");

            btnTogglePassword.innerHTML = isPassword
                ? '<i class="fas fa-eye-slash"></i>'
                : '<i class="fas fa-eye"></i>';

            btnTogglePassword.style.color = isPassword ? "#00e676" : "#8a8f8a";
        });
    }

    if (btnEsqueci) {
        btnEsqueci.addEventListener("click", (e) => {
            e.preventDefault();
            triggerNotice("Contate o administrador do STI para redefinir sua credencial.");
        });
    }

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
if (document.body.classList.contains("dashboard-body") || window.location.pathname.includes("dashboard.html")) {
    const token = getSidmaToken();

    // Comente as linhas abaixo se quiser testar a simulação local sem precisar logar na API
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
        media: "Média",
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
        const date = new Date(value);
        if (isNaN(date.getTime())) return "Data inválida";
        return new Intl.DateTimeFormat("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }).format(date);
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
    if (!porStatus) return;

    // 1. Mapeia e acumula os totais vindos do PostgreSQL
    const totals = porStatus.reduce((acc, item) => {
        acc[item.status] = item.total;
        return acc;
    }, {});

    // 2. Vincula exatamente aos IDs das suas tags <span> do HTML
    const elRecebida = document.getElementById("status_recebida");
    if (elRecebida) elRecebida.textContent = totals.recebida || 0;

    const elTriagem = document.getElementById("status_em_triagem");
    if (elTriagem) elTriagem.textContent = totals.em_triagem || 0;

    const elCampo = document.getElementById("status_em_campo");
    if (elCampo) elCampo.textContent = totals.em_campo || 0;

    // Como o banco salva como 'resolvida', jogamos o valor direto no id do HTML
    const elResolvida = document.getElementById("status_resolvida");
    if (elResolvida) elResolvida.textContent = totals.resolvida || totals.resolvidas || 0;
}

    function renderChart(ultimosSeteDias) {
        const chart = document.getElementById("dashboardBarChart");
        if (!chart) return;

        if (!ultimosSeteDias || !ultimosSeteDias.length) {
            chart.innerHTML = `<span style="color:#747a74; font-size:12px;">Sem dados para gráficos</span>`;
            return;
        }

        const max = Math.max(...ultimosSeteDias.map(item => item.total), 1);

        chart.innerHTML = ultimosSeteDias.map((item) => {
            // Tratamento contra erro de data "Invalid time value"
            let date = new Date(item.dia);
            if (isNaN(date.getTime()) && item.dia.includes('-')) {
                date = new Date(`${item.dia}T00:00:00`);
            }
            const label = isNaN(date.getTime()) ? item.dia : new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date).replace(".", "");
            const height = Math.max((item.total / max) * 88, 12);
            return `<div style="--bar-height: ${height}%;" title="${item.total} denúncias"><span>${label}</span></div>`;
        }).join("");
    }

    function renderCriticalLocations(locaisCriticos) {
        const topLocation = locaisCriticos ? locaisCriticos[0] : null;

        if (!topLocation) {
            setText("criticalLocationTitle", "Sem dados");
            setText("criticalLocationText", "Aguardando registros de ocorrências");
            return;
        }

        setText("criticalLocationTitle", topLocation.localizacao_texto);
        setText("criticalLocationText", `${topLocation.total} ocorrência(s) registrada(s) nesta área`);
    }

    function renderRecentIncidents(recentes) {
        const list = document.getElementById("dashboardIncidentList");
        if (!list) return;

        if (!recentes || !recentes.length) {
            list.innerHTML = `<div class="incident-row"><div><strong>Nenhuma denúncia cadastrada</strong><small>Os registros enviados pela comunidade aparecerão aqui.</small></div></div>`;
            return;
        }

        list.innerHTML = recentes.map((denuncia) => `
            <div class="incident-row">
                <span class="priority ${priorityClass[denuncia.prioridade] || "medium"}">${priorityLabels[denuncia.prioridade] || "Média"}</span>
                <div>
                    <strong>${denuncia.titulo}</strong>
                    <small>${denuncia.localizacao_texto} · ${statusLabels[denuncia.status] || denuncia.status}</small>
                </div>
                <em>${formatDateTime(denuncia.criado_em || denuncia.data_registro)}</em>
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
            console.warn("API Offline ou Token Inválido. Rodando simulação local fallback...", error.message);
            // Executa a simulação se o backend estiver inacessível
            initAdvancedDashboard();

            if (error.message.includes("Token")) {
                localStorage.removeItem("sidma_token");
                localStorage.removeItem("sidma_usuario");
                setTimeout(() => {
                    window.location.href = "login.html";
                }, 1500);
            }
        }
    }

    document.getElementById("btnRefreshDashboard")?.addEventListener("click", loadDashboard);
    document.getElementById("btnLogoutDashboard")?.addEventListener("click", () => {
        localStorage.removeItem("sidma_token");
        localStorage.removeItem("sidma_usuario");
        window.location.href = "login.html";
    });

    loadDashboard();
}

// ==========================================================================
// CENTRAL DE SIMULAÇÃO DA DASHBOARD (VERSÃO DE APRESENTAÇÃO / FALLBACK)
// ==========================================================================
async function initAdvancedDashboard() {
    if (!window.location.pathname.includes("dashboard.html")) return;

    // --- DADOS REAIS REPLICADOS PARA A SIMULAÇÃO ---
    const dadosSimuladosSummary = {
        abertas: 14,
        alta_prioridade: 4,
        resolvidas: 0,
        areas_monitoradas: 7,
        novas_hoje: 14,
        status_recebida: 0,
        status_em_triagem: 0,
        status_em_campo: 0,
        status_resolvida: 0
    };

    const denunciasSimuladas = [
        {
            prioridade: "alta",
            titulo: "Desmatamento ilegal detectado",
            localizacao_texto: "Ramal do Tarumã - Km 12",
            status: "recebida",
            criado_em: new Date().toISOString()
        },
        {
            prioridade: "media",
            titulo: "Queimada em terreno baldio",
            localizacao_texto: "Av. das Torres, Proximidades do Raio 300m",
            status: "em_triagem",
            criado_em: new Date(Date.now() - 3600000).toISOString()
        },
        {
            prioridade: "baixa",
            titulo: "Descarte irregular de resíduos",
            localizacao_texto: "Bairro Nova Cidade - Margem do Igarapé",
            status: "em_campo",
            criado_em: new Date(Date.now() - 7200000).toISOString()
        },
        {
            prioridade: "alta",
            titulo: "Extração de madeira não autorizada",
            localizacao_texto: "Reserva Florestal Ducke - Margem Leste",
            status: "recebida",
            criado_em: new Date(Date.now() - 10800000).toISOString()
        }
    ];

    // --- INJEÇÃO DOS DADOS NA TELA ---
    try {
        // 1. Contadores Principais (Cards do Topo)
        const metricAbertas = document.getElementById("metricAbertas");
        const metricAlta = document.getElementById("metricAltaPrioridade");
        const metricResolvidas = document.getElementById("metricResolvidas");
        const metricAreas = document.getElementById("metricAreas");

        if (metricAbertas) metricAbertas.textContent = dadosSimuladosSummary.abertas;
        if (metricAlta) metricAlta.textContent = dadosSimuladosSummary.alta_prioridade;
        if (metricResolvidas) metricResolvidas.textContent = dadosSimuladosSummary.resolvidas;
        if (metricAreas) metricAreas.textContent = dadosSimuladosSummary.areas_monitoradas;

        const novasHoje = document.getElementById("metricNovasHoje");
        if (novasHoje) {
            novasHoje.innerHTML = `<i class="fas fa-arrow-up"></i> ${dadosSimuladosSummary.novas_hoje} novas hoje`;
        }

        // 2. Esteira de Atendimento (IDs Unificados com os padrões reais do HTML)
        const statusRecebida = document.getElementById("statusRecebidas");
        const statusTriagem = document.getElementById("statusTriagem");
        const statusCampo = document.getElementById("statusCampo");
        const statusResolvida = document.getElementById("statusResolvidas");

        if (statusRecebida) statusRecebida.textContent = dadosSimuladosSummary.status_recebida;
        if (statusTriagem) statusTriagem.textContent = dadosSimuladosSummary.status_em_triagem;
        if (statusCampo) statusCampo.textContent = dadosSimuladosSummary.status_em_campo;
        if (statusResolvida) statusResolvida.textContent = dadosSimuladosSummary.status_resolvida;

        // 3. Atualização do Mapa de Calor (Simulando Local Crítico)
        const title = document.getElementById("criticalLocationTitle");
        const text = document.getElementById("criticalLocationText");
        if (title) title.textContent = "Ramal do Tarumã";
        if (text) text.textContent = "Área com maior ocorrência de focos térmicos.";

        // 4. Lista Lateral de Ocorrências Recentes
        const container = document.getElementById("dashboardIncidentList");
        if (container) {
            const statusLabels = { recebida: "Recebida", em_triagem: "Em triagem", em_campo: "Em campo" };
            container.innerHTML = denunciasSimuladas.map(d => {
                const prioridadeClasse = d.prioridade === 'alta' ? 'high' : d.prioridade === 'media' ? 'medium' : 'low';
                const horaTexto = new Date(d.criado_em).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                });

                return `
                <div class="incident-row">
                    <span class="priority ${prioridadeClasse}">
                        ${d.prioridade.charAt(0).toUpperCase() + d.prioridade.slice(1)}
                    </span>
                    <div>
                        <strong>${d.titulo}</strong>
                        <small>${d.localizacao_texto} · ${statusLabels[d.status] || d.status}</small>
                    </div>
                    <em>${horaTexto}</em>
                </div>
                `;
            }).join('');
        }

    } catch (err) {
        console.error("Erro ao renderizar simulação:", err);
    }
}

// ==========================================================================
// TELA DE GERENCIAMENTO COMPLETO DE OCORRÊNCIAS (admin_denuncias.html)
// ==========================================================================
if (window.location.pathname.includes("admin_denuncias.html")) {
    let currentEditingId = null;

    const statusBadges = {
        recebida: `<span style="background: rgba(255, 193, 7, 0.15); color: #ffc107; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i class="fas fa-clock"></i> Recebida</span>`,
        em_triagem: `<span style="background: rgba(0, 123, 255, 0.15); color: #007bff; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i class="fas fa-filter"></i> Em Triagem</span>`,
        em_campo: `<span style="background: rgba(23, 162, 184, 0.15); color: #17a2b8; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i class="fas fa-truck-ramp-box"></i> Em Campo</span>`,
        resolvida: `<span style="background: rgba(40, 167, 69, 0.15); color: #28a745; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i class="fas fa-check-circle"></i> Resolvida</span>`,
        arquivada: `<span style="background: rgba(108, 117, 125, 0.15); color: #6c757d; padding: 5px 10px; border-radius: 4px; font-size: 0.8rem; font-weight: 500;"><i class="fas fa-box-archive"></i> Arquivada</span>`
    };

    const priorityBadges = {
        baixa: `<span style="border-left: 3px solid #28a745; padding-left: 8px; color: #28a745; font-weight: 500;">Baixa</span>`,
        media: `<span style="border-left: 3px solid #ffc107; padding-left: 8px; color: #ffc107; font-weight: 500;">Média</span>`,
        alta: `<span style="border-left: 3px solid #dc3545; padding-left: 8px; color: #dc3545; font-weight: 600; text-shadow: 0 0 10px rgba(220,53,69,0.3);">Alta</span>`
    };

    // Função interna para estruturar e injetar as linhas da tabela
    function populateTable(denuncias) {
        const tbody = document.getElementById("pageIncidentList");
        if (!tbody) return;

        if (!denuncias || denuncias.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px; color: #555; font-family: 'Poppins', sans-serif;">
                        <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 10px; display: block; color: #333;"></i>
                        Nenhuma ocorrência encontrada no Banco de Dados Neon.
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = denuncias.map((item, index) => {
            const idCurto = item.id ? `#${item.id.toString().slice(-6).toUpperCase()}` : `#PR${1000 + index}`;
            const dbId = item.id || `mock-${index}`;

            // Formatando Data com Fallback de proteção contra datas corrompidas
            let dataFormatada = "N/A";
            const dataObjeto = new Date(item.criado_em || item.data_registro || Date.now());
            if (!isNaN(dataObjeto.getTime())) {
                dataFormatada = new Intl.DateTimeFormat("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                }).format(dataObjeto);
            }

            return `
                <tr style="border-bottom: 1px solid #1a1a1a; height: 65px; font-family: 'Poppins', sans-serif; font-size: 0.95rem; transition: background 0.2s;" onmouseover="this.style.background='#141414'" onmouseout="this.style.background='transparent'">
                    <td style="padding: 10px; font-weight: 600; color: #00e676;">${idCurto}</td>
                    <td style="padding: 10px;">${priorityBadges[item.prioridade] || priorityBadges.media}</td>
                    <td style="padding: 10px;">
                        <div style="font-weight: 500; color: #fff;">${item.titulo}</div>
                        <div style="font-size: 0.8rem; color: #666; max-width: 400px; white-space: nowrap; overflow: hidden; text-transform: ellipsis;" title="${item.localizacao_texto}">${item.localizacao_texto}</div>
                    </td>
                    <td style="padding: 10px;">${statusBadges[item.status] || statusBadges.recebida}</td>
                    <td style="padding: 10px; color: #aaa; font-size: 0.85rem;">${dataFormatada}</td>
                    <td style="padding: 10px;">
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-action-edit" data-id="${dbId}" data-protocolo="${idCurto}" data-status="${item.status || 'recebida'}" style="background: #1a1a1a; border: 1px solid #333; color: #00e676; padding: 6px 12px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#00e676'; this.style.color='#000';" onmouseout="this.style.background='#1a1a1a'; this.style.color='#00e676';">
                                <i class="fas fa-sliders"></i> Tratar
                            </button>
                            <button class="btn-action-delete" data-id="${dbId}" style="background: rgba(220,53,69,0.05); border: 1px solid rgba(220,53,69,0.2); color: #dc3545; padding: 6px 10px; border-radius: 4px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#dc3545'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='#dc3545';">
                                <i class="fas fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        // Binds dinâmicos dos botões gerados na tabela
        document.querySelectorAll(".btn-action-edit").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const target = e.currentTarget;
                currentEditingId = target.getAttribute("data-id");

                const modal = document.getElementById("statusModal");
                const textProto = document.getElementById("modalProtocoloText");
                const selectStatus = document.getElementById("selectModalStatus");

                if (modal && textProto && selectStatus) {
                    textProto.textContent = `Protocolo: ${target.getAttribute("data-protocolo")}`;
                    selectStatus.value = target.getAttribute("data-status");
                    modal.classList.remove("hidden");
                }
            });
        });

        document.querySelectorAll(".btn-action-delete").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.getAttribute("data-id");
                if (confirm("Tem certeza que deseja expurgar este registro do Banco Neon permanentemente?")) {
                    try {
                        if (id.includes("mock")) {
                            triggerNotice("Ação simulada: Registro removido localmente.");
                            e.currentTarget.closest("tr").remove();
                            return;
                        }
                        triggerNotice("Enviando comando de deleção...");
                        await sidmaRequest(`/denuncias/${id}`, { method: "DELETE" });
                        triggerNotice("Registro excluído com sucesso.");
                        fetchManagementData(); // Recarrega a tabela real
                    } catch (err) {
                        triggerNotice(err.message);
                    }
                }
            });
        });
    }

    // Função de carregamento principal (Busca na API com Fallback Fake)
    async function fetchManagementData() {
        try {
            // Requisição real para buscar todas as denúncias salvas no seu backend da Render
            const data = await sidmaRequest("/denuncias");
            // Se a API retornar um array direto ou um objeto com array
            const listaOriginal = Array.isArray(data) ? data : (data.recentes || data.denuncias || []);
            populateTable(listaOriginal);
        } catch (error) {
            console.warn("API de gerenciamento offline. Injetando Mock Data de contingência...", error.message);

            // --- MOCK DATA COMPLETA E ULTRA FOCO PARA APRESENTAÇÃO ---
            const dadosFakeApresentacao = [
                { id: "65f21a8bc412", prioridade: "alta", titulo: "Desmatamento e Extração de Madeira Ilegal", localizacao_texto: "Ramal do Tarumã - Área de Preservação Contígua", status: "recebida", criado_em: new Date().toISOString() },
                { id: "65f21b92c415", prioridade: "media", titulo: "Queimada Criminosa de Larga Escala", localizacao_texto: "Av. das Torres, Km 4 - Área de Clareira Urbana", status: "em_triagem", criado_em: new Date(Date.now() - 3600000).toISOString() },
                { id: "65f21c1fc419", prioridade: "baixa", titulo: "Descarte Químico Irregular de Resíduos", localizacao_texto: "Bairro Nova Cidade - Margem do Igarapé Principal", status: "em_campo", criado_em: new Date(Date.now() - 7200000).toISOString() },
                { id: "65f21d42c422", prioridade: "alta", titulo: "Garimpo Clandestino de Minérios", localizacao_texto: "Bacia Hidrográfica do Alto Rio Negro", status: "recebida", criado_em: new Date(Date.now() - 10800000).toISOString() },
                { id: "65f21e5dc425", prioridade: "resolvida", titulo: "Pesca Predatória em Período de Defeso", localizacao_texto: "Lago do Aleixo - Área de Proteção Ambiental", status: "resolvida", criado_em: new Date(Date.now() - 86400000).toISOString() }
            ];

            populateTable(dadosFakeApresentacao);
        }
    }

    // Configurações e Handlers do Modal de Edição de Status
    document.getElementById("btnCancelStatusModal")?.addEventListener("click", () => {
        document.getElementById("statusModal").classList.add("hidden");
    });

    document.getElementById("btnSaveStatusModal")?.addEventListener("click", async () => {
        const selectStatus = document.getElementById("selectModalStatus");
        if (!selectStatus || !currentEditingId) return;

        const novoStatus = selectStatus.value;
        triggerNotice("Atualizando esteira de atendimento...");

        try {
            if (currentEditingId.includes("mock")) {
                triggerNotice("Sucesso! Status atualizado localmente na simulação.");
                document.getElementById("statusModal").classList.add("hidden");
                fetchManagementData(); // Força re-render com dados padrão
                return;
            }

            // Requisição PATCH/PUT real enviada ao seu servidor na Render
            await sidmaRequest(`/denuncias/${currentEditingId}/status`, {
                method: "PATCH",
                body: JSON.stringify({ status: novoStatus })
            });

            triggerNotice("Status sincronizado com o Banco Neon.");
            document.getElementById("statusModal").classList.add("hidden");
            fetchManagementData();
        } catch (error) {
            triggerNotice(error.message);
        }
    });

    // Disparador inicial ao entrar na página
    fetchManagementData();
}
// ==========================================================================
// CENTRAL DO MAPA INTERATIVO VIA LEAFLET (SEM CHAVE / OPEN-SOURCE)
// ==========================================================================
let leafletMapInstance = null;
let leafletLayerGroup = null;

function initLeafletCriticalMap() {
    const mapElement = document.getElementById("criticalLeafletMap");
    if (!mapElement) return;

    // Centralizado nas coordenadas do seu banco (-3.09, -60.03)
    const defaultCenter = [-3.090000, -60.030000];

    // Cria a instância do mapa livre
    leafletMapInstance = L.map('criticalLeafletMap').setView(defaultCenter, 12);

    // Aplica o tema escuro/cyberpunk do CartoDB Voyageur Dark
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(leafletMapInstance);

    leafletLayerGroup = L.layerGroup().addTo(leafletMapInstance);

    // Executa a busca de dados
    fetchLeafletMapData();
}

async function fetchLeafletMapData() {
    try {
        const data = await sidmaRequest("/dashboard/overview");
        renderLeafletPoints(data.locaisCriticos || []);
    } catch (error) {
        console.warn("API Offline. Injetando dados geográficos simulados para a apresentação...");

        // Mock de Contingência para a tela nunca ficar vazia
        const mockLocais = [
            { localizacao_texto: "Ramal do Tarumã - Km 12", latitude: -3.025400, longitude: -60.068110, total: 8 },
            { localizacao_texto: "Rua das Seringueiras - Foco 1", latitude: -3.083410, longitude: -60.018920, total: 5 },
            { localizacao_texto: "Av. Brasil - Reduto Urbano", latitude: -3.101240, longitude: -60.025430, total: 3 },
            { localizacao_texto: "Comunidade Nova Esperança", latitude: -3.070120, longitude: -60.050320, total: 1 }
        ];
        renderLeafletPoints(mockLocais);
    }
}

function renderLeafletPoints(locais) {
    const geoListContainer = document.getElementById("mapGeoList");
    if (!geoListContainer || !leafletLayerGroup) return;

    geoListContainer.innerHTML = "";
    leafletLayerGroup.clearLayers();

    if (!locais || locais.length === 0) {
        geoListContainer.innerHTML = `<div style="color: #555; text-align: center; padding: 20px;">Nenhum foco detectado.</div>`;
        return;
    }

    locais.forEach((local) => {
        const lat = parseFloat(local.latitude);
        const lng = parseFloat(local.longitude);

        if (isNaN(lat) || isNaN(lng)) return;

        // Configuração de cores baseada em recorrência
        const corCritica = local.total >= 5 ? "#ff3e3e" : local.total >= 3 ? "#ff9800" : "#00e676";
        const raioMetros = 250 + (local.total * 70);

        // 1. Adiciona o Círculo Térmico no Leaflet
        const circle = L.circle([lat, lng], {
            color: corCritica,
            fillColor: corCritica,
            fillOpacity: 0.25,
            radius: raioMetros,
            weight: 1.5
        });

        // Adiciona um popup flutuante elegante ao clicar no círculo
        circle.bindPopup(`<strong style="color:#000;">${local.localizacao_texto}</strong><br><span style="color:#555;">${local.total} denúncias acumuladas</span>`);
        leafletLayerGroup.addLayer(circle);

        // 2. Monta o Card Lateral
        const itemCard = document.createElement("div");
        itemCard.style.background = "#161916";
        itemCard.style.border = "1px solid #222";
        itemCard.style.borderLeft = `4px solid ${corCritica}`;
        itemCard.style.padding = "12px";
        itemCard.style.borderRadius = "4px";
        itemCard.style.cursor = "pointer";
        itemCard.style.transition = "all 0.2s";

        itemCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <strong style="color: #fff; font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px;">
                    ${local.localizacao_texto}
                </strong>
                <span style="background: rgba(255,255,255,0.04); color: ${corCritica}; font-size: 0.75rem; font-weight: 700; padding: 2px 6px; border-radius: 3px;">
                    ${local.total} Focos
                </span>
            </div>
            <small style="color: #555; font-size: 0.75rem; display: block; margin-top: 4px;">Coordenadas: ${lat.toFixed(4)}, ${lng.toFixed(4)}</small>
        `;

        // Ação de clique para centralizar a câmera no ponto com zoom dinâmico
        itemCard.addEventListener("click", () => {
            leafletMapInstance.setView([lat, lng], 14, { animate: true, duration: 0.8 });
            circle.openPopup();
        });

        itemCard.addEventListener("mouseover", () => itemCard.style.background = "#1f241f");
        itemCard.addEventListener("mouseout", () => itemCard.style.background = "#161916");

        geoListContainer.appendChild(itemCard);
    });
}

// Inicializador automático para verificar se estamos na página correta
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("criticalLeafletMap")) {
        initLeafletCriticalMap();
    }
});

// ==========================================================================
// TELA DE CORPO TÉCNICO E AGENTES (admin_equipe.html)
// ==========================================================================
function initTeamManagement() {
    const teamGrid = document.getElementById("teamGridList");
    if (!teamGrid) return;

    // Busca os dados do operador atual salvos no localStorage pelo formulário de Login
    let operadorAtual = { nome: "Administrador SIDMA", credencial: "ADM-12345", email: "admin@sidma.local", perfil: "Diretor" };
    try {
        const localUser = localStorage.getItem("sidma_usuario");
        if (localUser) {
            const parsed = JSON.parse(localUser);
            operadorAtual = {
                nome: parsed.nome || parsed.name,
                credencial: parsed.credencial || "OP-2026",
                email: parsed.email || "agente@sidma.gov",
                perfil: parsed.perfil === "admin" ? "Administrador Geral" : "Operador Técnico"
            };
        }
    } catch (err) {
        console.warn("Erro ao ler dados do login local.", err);
    }

    // LISTA COMPLETA DA EQUIPE DISPARADA COMO FALLBACK E INTEGRADA
    const corpoTecnico = [
        {
            nome: operadorAtual.nome,
            credencial: operadorAtual.credencial,
            email: operadorAtual.email,
            perfil: operadorAtual.perfil,
            status: "Online",
            icone: "fa-user-shield",
            corBadge: "#00e676"
        },
        {
            nome: "Teylon Rodrigues",
            credencial: "AGENT-88412",
            email: "teylon.rodrigues@sidma.gov",
            perfil: "Analista de Monitoramento",
            status: "Em Campo",
            icone: "fa-user-gear",
            corBadge: "#ff9800"
        },
        {
            nome: "Carlos Eduardo Salinas",
            credencial: "INSP-33215",
            email: "salinas.carlos@sidma.gov",
            perfil: "Fiscal de Campo Sênior",
            status: "Online",
            icone: "fa-user-check",
            corBadge: "#00e676"
        },
        {
            nome: "Mariana Souza Queiroz",
            credencial: "GEOG-77410",
            email: "mariana.queiroz@sidma.gov",
            perfil: "Especialista em Geoprocessamento",
            status: "Offline",
            icone: "fa-user-graduate",
            corBadge: "#555"
        }
    ];

    // Injeção do layout estruturado dos cards no HTML
    teamGrid.innerHTML = corpoTecnico.map((membro) => `
        <div class="team-card" style="background: #111; border: 1px solid #222; border-radius: 8px; padding: 25px; display: flex; flex-direction: column; gap: 15px; position: relative; transition: all 0.2s;" onmouseover="this.style.borderColor='#00e676'; this.style.transform='translateY(-3px)'" onmouseout="this.style.borderColor='#222'; this.style.transform='translateY(0)'">
            
            <span style="position: absolute; top: 20px; right: 20px; display: flex; align-items: center; gap: 6px; font-size: 0.75rem; font-family: 'Poppins', sans-serif; color: ${membro.corBadge === '#555' ? '#666' : membro.corBadge}; font-weight: 600;">
                <i class="fas fa-circle" style="font-size: 0.6rem; color: ${membro.corBadge};"></i> ${membro.status}
            </span>

            <div style="width: 55px; height: 55px; background: rgba(0, 230, 118, 0.04); border: 1px solid rgba(0, 230, 118, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #00e676; font-size: 1.4rem;">
                <i class="fas ${membro.icone}"></i>
            </div>

            <div style="font-family: 'Poppins', sans-serif;">
                <h3 style="font-family: 'Montserrat', sans-serif; font-size: 1.05rem; color: #fff; margin-bottom: 4px; font-weight: 600;">${membro.nome}</h3>
                <span style="background: rgba(255,255,255,0.03); color: #888; font-size: 0.75rem; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 12px; border: 1px solid #222;">
                    ${membro.perfil}
                </span>
                
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; color: #aaa; margin-top: 5px;">
                    <div><i class="fas fa-id-card" style="width: 20px; color: #444;"></i> <span style="color: #666;">ID:</span> <span style="font-family: monospace; color: #00e676;">${membro.credencial}</span></div>
                    <div><i class="fas fa-envelope" style="width: 20px; color: #444;"></i> <span style="color: #666;">E-mail:</span> ${membro.email}</div>
                </div>
            </div>

            <div style="border-top: 1px solid #1a1a1a; padding-top: 15px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 0.75rem; color: #444; font-family: 'Poppins', sans-serif;">Acessos de auditoria liberados</span>
                <button type="button" style="background: transparent; border: none; color: #555; cursor: pointer; transition: color 0.2s;" onmouseover="this.style.color='#ff3e3e'" onmouseout="this.style.color='#555'" title="Revogar Credencial">
                    <i class="fas fa-user-slash"></i>
                </button>
            </div>
        </div>
    `).join("");
}

// Disparador inteligente na carga da página
document.addEventListener("DOMContentLoaded", initTeamManagement);