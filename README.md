# 🛡️ BlockRH - Decentralized HR Management System

**BlockRH** est une application décentralisée (DApp) permettant de gérer les ressources humaines avec une sécurité renforcée par la blockchain. Ce projet implémente un système de contrôle d'accès basé sur les rôles (**RBAC**) garantissant l'intégrité et la confidentialité des données sensibles.

---

## 🚀 Fonctionnalités

- **Système RBAC (Role-Based Access Control) :**
  - **RH (Admin) :** Seul le déployeur du contrat détient le rôle RH. Il peut ajouter des employés et consulter la liste globale.
  - **Employés :** Chaque employé enregistré peut consulter ses propres données personnelles (Nom, Poste, Salaire) de manière sécurisée via son wallet.
- **Accès Sécurisé :** Les données sont stockées sur la blockchain, rendant toute modification frauduleuse impossible.
- **Interface Intuitive :** Frontend connecté à MetaMask avec affichage conditionnel selon le rôle de l'utilisateur.

## 🛠️ Stack Technique

- **Smart Contract :** Solidity (0.8.24)
- **Framework de développement :** Hardhat
- **Librairie Web3 :** Ethers.js (v6)
- **Frontend :** HTML5 / CSS3 / JavaScript (Vanilla)
- **Wallet :** MetaMask

## 📦 Installation et Utilisation

### Prérequis
- [Node.js](https://nodejs.org/) (v20+ recommandé)
- Extension [MetaMask](https://metamask.io/) installée sur votre navigateur.

### Installation
1. Clonez le dépôt :
   ```bash
   git clone https://github.com/Youssef-srf/BlockRH.git
   cd BlockRH
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```

### Déploiement Local
1. Lancez un nœud blockchain local (Hardhat) :
   ```bash
   npx hardhat node
   ```
2. Dans un nouveau terminal, déployez le contrat :
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Lancement du Frontend
Ouvrez le fichier `frontend/index.html` via un serveur local (ex: extension *Live Server* de VS Code ou `python -m http.server`).

## 📋 Structure du Projet

```text
├── contracts/          # Smart Contract (GestionRH.sol)
├── scripts/            # Script de déploiement (deploy.js)
├── frontend/           # Interface utilisateur (HTML/JS/Ethers)
├── artifacts/          # Fichiers de compilation générés par Hardhat
└── hardhat.config.js   # Configuration de l'environnement Hardhat
```

## 📜 Auteurs
- **Youssef Sarraf**
- **Sifeddine Legnioui**

---
*Projet réalisé dans le cadre du module Sécurité IA et Blockchain - FSBM (2025-2026).*
