let contractAddress = "";
let contractABI = [];
let provider;
let signer;
let contract;

const connectBtn = document.getElementById("connectBtn");
const statusDiv = document.getElementById("status");
const accountInfo = document.getElementById("accountInfo");
const hrSection = document.getElementById("hrSection");
const employeeSection = document.getElementById("employeeSection");
const unauthorizedSection = document.getElementById("unauthorizedSection");

async function init() {
    try {
        const addrRes = await fetch("contract-address.json");
        const addrData = await addrRes.json();
        contractAddress = addrData.GestionRH;

        const abiRes = await fetch("GestionRH.json");
        const abiData = await abiRes.json();
        contractABI = abiData.abi;
    } catch (err) {
        console.error("Impossible de charger les fichiers du contrat. Avez-vous déployé le contrat ?", err);
        statusDiv.innerHTML = "<span class='error'>Erreur de chargement. Vérifiez que le contrat est déployé et copié dans le dossier frontend.</span>";
    }
}

connectBtn.addEventListener("click", async () => {
    if (typeof window.ethereum === "undefined") {
        alert("MetaMask n'est pas installé !");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        const address = await signer.getAddress();

        statusDiv.innerText = "Statut: Connecté";
        accountInfo.innerText = "Connecté avec: " + address;
        connectBtn.style.display = "none";

        contract = new ethers.Contract(contractAddress, contractABI, signer);
        await checkRole(address);
    } catch (err) {
        console.error(err);
        statusDiv.innerText = "Erreur de connexion.";
    }
});

async function checkRole(userAddress) {
    try {
        const hrAddress = await contract.hrAddress();

        console.log("User:", userAddress);
        console.log("HR:", hrAddress);

        if (userAddress.toLowerCase() === hrAddress.toLowerCase()) {
            hrSection.style.display = "block";
            employeeSection.style.display = "none";
            unauthorizedSection.style.display = "none";
        } else {
            // Check if they are a registered employee by trying to fetch their info
            try {
                const info = await contract.getMyInfo();
                if (info.isRegistered) {
                    hrSection.style.display = "none";
                    employeeSection.style.display = "block";
                    unauthorizedSection.style.display = "none";
                } else {
                    showUnauthorized();
                }
            } catch (err) {
                console.error("Erreur lors de la récupération des infos employé :", err);
                showUnauthorized();
            }
        }
    } catch (err) {
        console.error("Erreur lors de la vérification du rôle HR :", err);
        showUnauthorized();
    }
}

function showUnauthorized() {
    hrSection.style.display = "none";
    employeeSection.style.display = "none";
    unauthorizedSection.style.display = "block";
}

// HR Actions
document.getElementById("addEmpBtn").addEventListener("click", async () => {
    const wallet = document.getElementById("empWallet").value;
    const name = document.getElementById("empName").value;
    const position = document.getElementById("empPosition").value;
    const salary = document.getElementById("empSalary").value;

    if (!wallet || !name || !position || !salary) {
        alert("Veuillez remplir tous les champs");
        return;
    }

    try {
        const tx = await contract.addEmployee(wallet, name, position, salary);
        document.getElementById("addResult").innerText = "Transaction envoyée... En attente...";
        await tx.wait();
        document.getElementById("addResult").innerText = "Employé ajouté avec succès !";

        // Clear inputs
        document.getElementById("empWallet").value = "";
        document.getElementById("empName").value = "";
        document.getElementById("empPosition").value = "";
        document.getElementById("empSalary").value = "";
    } catch (err) {
        console.error(err);
        document.getElementById("addResult").innerHTML = "<span class='error'>Erreur lors de l'ajout. Voir la console.</span>";
    }
});

document.getElementById("listEmpBtn").addEventListener("click", async () => {
    const listDiv = document.getElementById("employeesList");
    listDiv.innerHTML = "Chargement...";

    try {
        const employees = await contract.getAllEmployees();
        listDiv.innerHTML = "";

        if (employees.length === 0) {
            listDiv.innerHTML = "<p>Aucun employé enregistré.</p>";
            return;
        }

        employees.forEach((emp, index) => {
            listDiv.innerHTML += `
                <div class="employee-card">
                    <strong>#${index + 1} - ${emp.name}</strong> (${emp.position})<br>
                    Wallet: ${emp.walletAddress}<br>
                    Salaire: ${emp.salary.toString()}
                </div>
            `;
        });
    } catch (err) {
        console.error(err);
        listDiv.innerHTML = "<span class='error'>Erreur: " + err.message + "</span>";
    }
});

// Employee Actions
document.getElementById("myInfoBtn").addEventListener("click", async () => {
    const displayDiv = document.getElementById("myInfoDisplay");
    displayDiv.innerHTML = "Chargement...";

    try {
        const info = await contract.getMyInfo();
        displayDiv.innerHTML = `
            <div class="employee-card">
                <strong>Nom :</strong> ${info.name}<br>
                <strong>Poste :</strong> ${info.position}<br>
                <strong>Salaire :</strong> ${info.salary.toString()}<br>
                <strong>Wallet :</strong> ${info.walletAddress}
            </div>
        `;
    } catch (err) {
        console.error(err);
        displayDiv.innerHTML = "<span class='error'>Impossible de récupérer les informations.</span>";
    }
});

window.addEventListener('load', init);
