console.log("GTech: Motor JavaScript v2.0 (Deploy Edition) carregado!");

// ==========================================
// 1. CONFIGURAÇÃO DO FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBH7RZW1mNAjJ_VazeL6ARSUDK7QV4RCWA",
    authDomain: "gtech-c106a.firebaseapp.com",
    projectId: "gtech-c106a",
    storageBucket: "gtech-c106a.firebasestorage.app",
    messagingSenderId: "691573084602",
    appId: "1:691573084602:web:52bba846534b70beeecd83",
    measurementId: "G-ZG8CM3VN2M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ==========================================
// 2. O CÉREBRO (LOGA / DESLOGA / REDIRECIONA)
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dadosDoBanco = docSnap.data();
            atualizarMenuTopo(dadosDoBanco); 
            configurarPainelCliente(dadosDoBanco);
            renderizarPortfolio(dadosDoBanco.isAdmin);
        }
    } else {
        atualizarMenuTopo(null); 
        // Se estiver no painel e deslogar, vai para o login
        if (window.location.pathname.includes('painel-cliente.html')) {
            window.location.href = "login.html";
        }
    }
});

// ==========================================
// 3. ATUALIZAÇÃO VISUAL (MENU E PAINEL)
// ==========================================
function atualizarMenuTopo(usuario) {
    // Procura o botão de login no cabeçalho
    const btnNav = document.querySelector('header a[href="login.html"]') || document.querySelector('header a[href="painel-cliente.html"]');
    
    if (btnNav) {
        if (usuario) {
            const primeiroNome = usuario.nome.split(' ')[0];
            const badge = usuario.isAdmin ? '<span style="background: #bc32ad; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; margin-left: 5px; vertical-align: middle;">ADMIN</span>' : '';
            btnNav.innerHTML = `<i class="fas fa-user" style="color: #00d2ff;"></i> Olá, ${primeiroNome} ${badge}`;
            btnNav.href = "painel-cliente.html"; 
        } else {
            btnNav.innerHTML = `<i class="fas fa-sign-in-alt"></i> Entrar / Premium`;
            btnNav.href = "login.html";
        }
    }
}

function configurarPainelCliente(usuario) {
    const saudacao = document.querySelector('.page-header h1');
    const subtitulo = document.querySelector('.page-header p');
    const cards = document.querySelectorAll('.dashboard-card');
    
    if (!saudacao || cards.length < 3) return;

    saudacao.innerHTML = `Olá, ${usuario.nome}! ${usuario.isPremium ? '<i class="fas fa-gem neon-purple-text"></i>' : '<i class="fas fa-user neon-blue-text"></i>'}`;

    if (subtitulo) {
        subtitulo.innerHTML = usuario.isPremium ? 
            'Bem-vindo à sua área exclusiva. Seu plano Premium está <strong style="color: #32BCAD;">Ativo</strong>.' : 
            'Bem-vindo à sua área exclusiva. Faça o upgrade para destravar benefícios.';
    }

    const statusText = cards[0].querySelector('p');
    if (statusText) statusText.innerHTML = `<strong>Aparelho:</strong> ${usuario.status_aparelho || "Nenhum na bancada"}`;

    if (!usuario.isPremium) {
        cards[1].style.opacity = "0.7";
        const suporteTitle = cards[1].querySelector('h3');
        if(suporteTitle) suporteTitle.innerText = "Suporte Padrão";
        
        cards[2].innerHTML = `
            <div class="card-header"><i class="fas fa-arrow-up neon-purple-text"></i><h3>Upgrade Premium</h3></div>
            <div class="card-body">
                <p>Ganhe 15% OFF e fure a fila de manutenção!</p>
                <a href="checkout.html" class="btn btn-software" style="width:100%; display:block; margin-top:10px; text-align:center;">Ser Premium</a>
            </div>`;
    }
}

// ==========================================
// 4. LOGOUT (CORREÇÃO DO ERRO 404 DO GITHUB)
// ==========================================
const btnSair = document.querySelector('a[href="index.html"].btn-hardware') || document.querySelector('.btn-hardware');

if (btnSair && window.location.pathname.includes('painel-cliente.html')) {
    btnSair.addEventListener('click', (e) => {
        e.preventDefault(); 
        signOut(auth).then(() => { 
            window.location.href = "index.html"; // Redirecionamento relativo seguro
        });
    });
}

// ==========================================
// 5. CADASTRO E LOGIN
// ==========================================
const registerForm = document.getElementById('register-form');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('reg-nome').value;
        const email = document.getElementById('reg-email').value;
        const senha = document.getElementById('reg-senha').value;
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            await setDoc(doc(db, "usuarios", userCredential.user.uid), {
                nome: nome, email: email, isPremium: false, isAdmin: false, status_aparelho: "Aparelho ainda não entregue"
            });
            alert("Bem-vindo à GTech!");
            window.location.href = "painel-cliente.html";
        } catch (error) { alert("Erro: " + error.message); }
    });
}

const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const senha = loginForm.querySelector('input[type="password"]').value;
        try {
            await signInWithEmailAndPassword(auth, email, senha);
            window.location.href = "painel-cliente.html";
        } catch (error) { alert("E-mail ou senha incorretos."); }
    });
}

// ==========================================
// 6. PORTFÓLIO ADMIN (IMGBB + FIRESTORE)
// ==========================================
const modal = document.getElementById("modal-projeto");
const btnAbrir = document.querySelector('#admin-panel button');
const btnFechar = document.querySelector(".close-btn");
const formProjeto = document.getElementById("form-novo-projeto");

if (btnAbrir) btnAbrir.onclick = () => modal.style.display = "block";
if (btnFechar) btnFechar.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

if (formProjeto) {
    formProjeto.addEventListener('submit', async (e) => {
        e.preventDefault();
        const titulo = document.getElementById('proj-titulo').value;
        const servico = document.getElementById('proj-servico').value;
        const descricao = document.getElementById('proj-descricao').value;
        const estrelas = document.getElementById('proj-estrelas').value;
        const comentario = document.getElementById('proj-comentario').value;
        const imagemInput = document.getElementById('proj-imagem').files[0];
        const btnSubmit = formProjeto.querySelector('button[type="submit"]');

        let imagemUrl = "https://via.placeholder.com/400x250"; 

        if (imagemInput) {
            try {
                btnSubmit.innerText = "Subindo para a nuvem...";
                const formData = new FormData();
                formData.append("image", imagemInput);
                const imgbbKey = "d62b85966d1ea96820f19c2f69f2ef2e"; 

                const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) imagemUrl = data.data.url; 
            } catch (error) { alert("Erro na imagem: " + error.message); }
        }

        await salvarProjetoNoFirebase(titulo, servico, descricao, imagemUrl, estrelas, comentario);
        btnSubmit.innerText = "Publicar no Portfólio";
    });
}

async function salvarProjetoNoFirebase(titulo, servico, descricao, imagemUrl, estrelas, comentario) {
    try {
        await addDoc(collection(db, "projetos"), {
            titulo, servico, descricao, imagemUrl, 
            estrelas: Number(estrelas), comentario, dataCadastro: new Date()
        });
        alert("Projeto publicado!");
        formProjeto.reset();
        modal.style.display = "none";
        renderizarPortfolio(true); 
    } catch (error) { alert("Erro no banco: " + error.message); }
}

window.deletarProjeto = async function(id) {
    if(confirm("Excluir projeto permanentemente?")) {
        await deleteDoc(doc(db, "projetos", id));
        renderizarPortfolio(true);
    }
}

async function renderizarPortfolio(isAdmin) {
    const grid = document.getElementById('portfolio-grid');
    const adminPanel = document.getElementById('admin-panel');
    if (!grid) return;
    if (isAdmin && adminPanel) adminPanel.style.display = 'block';

    grid.innerHTML = '<p style="color:white; text-align:center; width:100%;">Sincronizando com a nuvem...</p>';

    const querySnapshot = await getDocs(collection(db, "projetos"));
    grid.innerHTML = ''; 

    querySnapshot.forEach((docu) => {
        const proj = docu.data();
        const id = docu.id;
        
        let stars = '';
        for (let i = 0; i < proj.estrelas; i++) stars += '<i class="fas fa-star" style="color: #ffd700;"></i>';
        
        const feedback = proj.comentario ? `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-top: 10px; border-left: 3px solid #bc32ad;">
                <p style="font-style: italic; color: #ccc; font-size: 0.85rem; margin: 0;">"${proj.comentario}"</p>
            </div>` : '';

        grid.innerHTML += `
            <div class="portfolio-card" style="margin-bottom: 20px;">
                <div class="portfolio-img" style="background-image: url('${proj.imagemUrl}')"></div>
                <div class="portfolio-info">
                    <span class="tag tag-hardware">${proj.servico}</span>
                    <h3>${proj.titulo}</h3>
                    <p>${proj.descricao}</p>
                    ${stars}
                    ${feedback}
                    ${isAdmin ? `<button onclick="deletarProjeto('${id}')" style="margin-top:10px; color:#ff4d4d; background:none; border:1px solid #ff4d4d; padding:5px; cursor:pointer;">Excluir</button>` : ''}
                </div>
            </div>`;
    });
}

// ==========================================
// 7. SERVIÇOS E FEEDBACK DO CLIENTE
// ==========================================
async function renderizarServicos(tipo) {
    const container = document.getElementById(tipo === 'hardware' ? 'hardware-list' : 'software-list');
    if (!container) return;

    let srv = tipo === 'hardware' ? [
        { t: "Smartphones", p: "Sob consulta", r: "Telas e Baterias", d: "Reparo em Android e iPhone." },
        { t: "Limpeza Física", p: "R$ 80,00", r: "PC e Notebook", d: "Higienização e pasta térmica." },
        { t: "Montagem PC Gamer", p: "R$ 150,00", r: "Personalizada", d: "Montagem e organização de cabos." }
    ] : [
        { t: "Formatação Premium", p: "R$ 100,00", r: "Win + Backup", d: "Sistema novo com todos os drivers." },
        { t: "Remoção de Vírus", p: "R$ 60,00", r: "Malwares", d: "Limpeza total do Windows." },
        { t: "Sistemas Web", p: "Sob consulta", r: "Personalizados", d: "Desenvolvimento JS + Firebase." }
    ];

    container.innerHTML = srv.map(s => `
        <div class="service-card-interactive">
            <h3>${s.t}</h3><p>${s.r}</p><span class="service-price">${s.p}</span>
            <i class="fas fa-chevron-down toggle-icon"></i>
            <div class="service-details">${s.d}</div>
        </div>`).join('');

    container.querySelectorAll('.service-card-interactive').forEach(c => c.onclick = () => c.classList.toggle('active'));
}

const formFeedback = document.getElementById('form-feedback-cliente');
if (formFeedback) {
    formFeedback.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return;
        const eVal = document.getElementById('cliente-estrelas').value;
        const cVal = document.getElementById('cliente-comentario').value;
        
        try {
            const uSnap = await getDoc(doc(db, "usuarios", user.uid));
            await addDoc(collection(db, "avaliacoes"), {
                nome: uSnap.data().nome, estrelas: Number(eVal), comentario: cVal, data: new Date()
            });
            alert("Feedback enviado!");
            formFeedback.reset();
        } catch (error) { alert("Erro: " + error.message); }
    });
}

async function renderizarAvaliacoes() {
    const container = document.getElementById('feedback-container');
    if (!container) return;
    const q = await getDocs(collection(db, "avaliacoes"));
    container.innerHTML = '';
    q.forEach(d => {
        const a = d.data();
        let stars = ''; for (let i = 0; i < a.estrelas; i++) stars += '⭐';
        container.innerHTML += `<div style="background:#111; border:1px solid #333; padding:20px; border-radius:12px; margin:10px auto; max-width:500px; text-align:left;">
            <strong style="color:#00d2ff;">${a.nome}</strong> ${stars}<p style="color:#ccc; font-style:italic;">"${a.comentario}"</p></div>`;
    });
}

window.addEventListener('DOMContentLoaded', () => {
    renderizarServicos('hardware');
    renderizarServicos('software');
    renderizarAvaliacoes(); 
});