/* ═══════════════════════════════════════════════════════
   BlockRH — App Logic (Ethers.js v6 + Enhanced UX)
   ═══════════════════════════════════════════════════════ */

let contractAddress = "";
let contractABI = [];
let provider;
let signer;
let contract;

// ── DOM References ──
const connectBtn        = document.getElementById("connectBtn");
const connectPanel      = document.getElementById("connectPanel");
const statusDot         = document.getElementById("statusDot");
const statusText        = document.getElementById("statusText");
const accountInfo       = document.getElementById("accountInfo");
const accountAddress    = document.getElementById("accountAddress");
const hrSection         = document.getElementById("hrSection");
const employeeSection   = document.getElementById("employeeSection");
const unauthorizedSection = document.getElementById("unauthorizedSection");
const loadingOverlay    = document.getElementById("loadingOverlay");
const loadingText       = document.getElementById("loadingText");
const toastContainer    = document.getElementById("toastContainer");

// ══════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════

function truncateAddress(addr) {
    if (!addr) return "";
    return addr.slice(0, 6) + "..." + addr.slice(-4);
}

function formatSalary(amount) {
    return Number(amount).toLocaleString("fr-FR") + " DHS";
}

function getInitials(name) {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

// ── Toast Notifications ──
function showToast(message, type = "info") {
    const icons = { success: "fa-check-circle", error: "fa-exclamation-circle", info: "fa-info-circle" };
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type]} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.classList.add('removing');setTimeout(()=>this.parentElement.remove(),300)">
            <i class="fas fa-xmark"></i>
        </button>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add("removing");
            setTimeout(() => toast.remove(), 300);
        }
    }, 5000);
}

// ── Loading Overlay ──
function showLoading(text = "Transaction en cours...") {
    loadingText.textContent = text;
    loadingOverlay.classList.add("active");
}

function hideLoading() {
    loadingOverlay.classList.remove("active");
}

// ── Section Display ──
function showSection(section) {
    [hrSection, employeeSection, unauthorizedSection].forEach(s => s.classList.remove("active"));
    connectPanel.style.display = "none";
    section.classList.add("active");
}

// ══════════════════════════════════════════════════════
//  CONTRACT INIT
// ══════════════════════════════════════════════════════

async function init() {
    try {
        const addrRes = await fetch("contract-address.json");
        const addrData = await addrRes.json();
        contractAddress = addrData.GestionRH;

        const abiRes = await fetch("GestionRH.json");
        const abiData = await abiRes.json();
        contractABI = abiData.abi;
    } catch (err) {
        console.error("Impossible de charger les fichiers du contrat.", err);
        showToast("Erreur de chargement. Vérifiez que le contrat est déployé.", "error");
    }
}

// ══════════════════════════════════════════════════════
//  CONNECT WALLET
// ══════════════════════════════════════════════════════

connectBtn.addEventListener("click", async () => {
    if (typeof window.ethereum === "undefined") {
        showToast("MetaMask n'est pas installé !", "error");
        return;
    }

    try {
        showLoading("Connexion au wallet...");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const address = await signer.getAddress();

        // Update header
        statusDot.classList.add("connected");
        statusText.textContent = "Connecté";
        accountAddress.textContent = truncateAddress(address);
        accountInfo.classList.add("visible");

        contract = new ethers.Contract(contractAddress, contractABI, signer);
        await checkRole(address);
        hideLoading();
        showToast("Wallet connecté avec succès !", "success");
    } catch (err) {
        console.error(err);
        hideLoading();
        showToast("Erreur de connexion au wallet.", "error");
    }
});

// ══════════════════════════════════════════════════════
//  ROLE CHECK
// ══════════════════════════════════════════════════════

async function checkRole(userAddress) {
    try {
        const hrAddr = await contract.hrAddress();

        if (userAddress.toLowerCase() === hrAddr.toLowerCase()) {
            showSection(hrSection);
        } else {
            try {
                const info = await contract.getMyInfo();
                if (info.isRegistered) {
                    showSection(employeeSection);
                } else {
                    showSection(unauthorizedSection);
                }
            } catch (err) {
                console.error("Erreur récupération info employé :", err);
                showSection(unauthorizedSection);
            }
        }
    } catch (err) {
        console.error("Erreur vérification rôle HR :", err);
        showSection(unauthorizedSection);
    }
}

// ══════════════════════════════════════════════════════
//  HR ACTIONS
// ══════════════════════════════════════════════════════

// ── Add Employee ──
document.getElementById("addEmpBtn").addEventListener("click", async () => {
    const wallet   = document.getElementById("empWallet").value.trim();
    const name     = document.getElementById("empName").value.trim();
    const position = document.getElementById("empPosition").value.trim();
    const salary   = document.getElementById("empSalary").value.trim();

    if (!wallet || !name || !position || !salary) {
        showToast("Veuillez remplir tous les champs.", "error");
        return;
    }

    try {
        showLoading("Ajout de l'employé sur la blockchain...");
        const tx = await contract.addEmployee(wallet, name, position, salary);
        showLoading("Confirmation de la transaction...");
        await tx.wait();
        hideLoading();
        showToast(`${name} ajouté avec succès !`, "success");

        // Clear fields
        document.getElementById("empWallet").value = "";
        document.getElementById("empName").value = "";
        document.getElementById("empPosition").value = "";
        document.getElementById("empSalary").value = "";
    } catch (err) {
        console.error(err);
        hideLoading();
        showToast("Erreur lors de l'ajout. Vérifiez la console.", "error");
    }
});

// ── List Employees ──
document.getElementById("listEmpBtn").addEventListener("click", async () => {
    const listDiv = document.getElementById("employeesList");
    listDiv.innerHTML = "";

    try {
        showLoading("Chargement des employés...");
        const employees = await contract.getAllEmployees();
        hideLoading();

        if (employees.length === 0) {
            listDiv.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    Aucun employé enregistré pour le moment.
                </div>`;
            return;
        }

        employees.forEach((emp, index) => {
            const card = document.createElement("div");
            card.className = "employee-card";
            card.style.animationDelay = `${index * 0.08}s`;
            card.style.animation = "fadeInUp 0.4s ease-out both";
            card.innerHTML = `
                <div class="emp-card-header">
                    <div class="emp-avatar">${getInitials(emp.name)}</div>
                    <div>
                        <div class="emp-name">${emp.name}</div>
                        <div class="emp-position">${emp.position}</div>
                    </div>
                </div>
                <div class="emp-details">
                    <div class="emp-detail-item">
                        <span class="emp-detail-label"><i class="fas fa-wallet"></i> Wallet</span>
                        <span class="emp-detail-value">${truncateAddress(emp.walletAddress)}</span>
                    </div>
                    <div class="emp-detail-item">
                        <span class="emp-detail-label"><i class="fas fa-coins"></i> Salaire</span>
                        <span class="emp-detail-value salary">${formatSalary(emp.salary)}</span>
                    </div>
                </div>
            `;
            listDiv.appendChild(card);
        });

        showToast(`${employees.length} employé(s) chargé(s).`, "info");
    } catch (err) {
        console.error(err);
        hideLoading();
        showToast("Erreur lors du chargement. " + err.message, "error");
    }
});

// ══════════════════════════════════════════════════════
//  EMPLOYEE ACTIONS
// ══════════════════════════════════════════════════════

document.getElementById("myInfoBtn").addEventListener("click", async () => {
    const displayDiv = document.getElementById("myInfoDisplay");
    displayDiv.innerHTML = "";

    try {
        showLoading("Récupération de vos informations...");
        const info = await contract.getMyInfo();
        hideLoading();

        displayDiv.innerHTML = `
            <div class="employee-card" style="animation: fadeInUp 0.4s ease-out both;">
                <div class="emp-card-header">
                    <div class="emp-avatar">${getInitials(info.name)}</div>
                    <div>
                        <div class="emp-name">${info.name}</div>
                        <div class="emp-position">${info.position}</div>
                    </div>
                </div>
                <div class="emp-details">
                    <div class="emp-detail-item">
                        <span class="emp-detail-label"><i class="fas fa-wallet"></i> Wallet</span>
                        <span class="emp-detail-value">${truncateAddress(info.walletAddress)}</span>
                    </div>
                    <div class="emp-detail-item">
                        <span class="emp-detail-label"><i class="fas fa-coins"></i> Salaire</span>
                        <span class="emp-detail-value salary">${formatSalary(info.salary)}</span>
                    </div>
                </div>
            </div>
        `;
        showToast("Vos informations ont été récupérées.", "success");
    } catch (err) {
        console.error(err);
        hideLoading();
        showToast("Impossible de récupérer vos informations.", "error");
    }
});

// ══════════════════════════════════════════════════════
//  PARTICLE ANIMATION
// ══════════════════════════════════════════════════════

function initParticles() {
    const canvas = document.getElementById("particleCanvas");
    const ctx = canvas.getContext("2d");

    let width, height, particles;
    const PARTICLE_COUNT = 60;
    const MAX_DIST = 120;

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticles() {
        particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                r: Math.random() * 2 + 0.5,
            });
        }
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);

        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const alpha = (1 - dist / MAX_DIST) * 0.15;
                    ctx.strokeStyle = `rgba(0, 212, 255, ${alpha})`;
                    ctx.lineWidth = 0.5;
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.stroke();
                }
            }
        }

        // Draw particles
        particles.forEach(p => {
            ctx.fillStyle = "rgba(0, 212, 255, 0.4)";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();

            // Move
            p.x += p.vx;
            p.y += p.vy;

            // Wrap edges
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;
        });

        requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();
    window.addEventListener("resize", () => { resize(); createParticles(); });
}

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════

window.addEventListener("load", () => {
    init();
    initParticles();
});
