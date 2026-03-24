# 🎓 Guide de Soutenance : BlockRH

Ce document est votre feuille de route pour comprendre et présenter le projet **BlockRH** de A à Z. Utilisez-le pour réviser avant votre soutenance (module *Sécurité IA et Blockchain - FSBM*).

---

## 1. 🎯 Le Concept (Le "Pourquoi")

**Que fait BlockRH ?**
C'est une Application Décentralisée (DApp) qui permet de gérer des ressources humaines de manière transparente, inaltérable et sécurisée grâce à la blockchain Ethereum. 

**Pourquoi la Blockchain ?**
Dans un système RH classique (base de données SQL centrale), l'administrateur peut modifier un salaire ou supprimer un employé en cachette. Avec BlockRH, chaque ajout d'employé est une transaction enregistrée sur la blockchain. C'est :
- **Inaltérable** (personne ne peut effacer l'historique).
- **Transparent** (règles inscrites dans le code).
- **Sécurisé** (pas de mot de passe piratable, on utilise la cryptographie asymétrique via MetaMask).

---

## 2. 🏗️ L'Architecture Technique

Le projet est divisé en deux grandes parties : le **Backend (Smart Contract)** et le **Frontend (Interface Utilisateur)**.

### A. Le Smart Contract (`contracts/GestionRH.sol`)
C'est le "cerveau" de l'application. Il contient la logique métier et la base de données. Il est écrit en **Solidity**.

**Les concepts clés du contrat :**
1.  **L'état (State Variables) :**
    -   `hrAddress` : Sauvegarde l'adresse Ethereum de la personne qui a déployé le contrat (le Super Admin / RH).
    -   `mapping(address => Employee) private employees` : La base de données. Elle associe une adresse Ethereum (clé) aux données d'un employé (valeur).
2.  **La structure de données (`struct Employee`) :**
    -   Contient l'adresse wallet, le nom, le poste, le salaire et un booléen `isRegistered` pour vérifier si la personne existe.
3.  **La Sécurité (Modifiers) :**
    -   C'est l'implémentation du **RBAC (Role-Based Access Control)**.
    -   `modifier onlyHR()` : Avant d'exécuter une fonction, vérifie que la personne qui l'appelle (`msg.sender`) EST l'adresse du RH (`hrAddress`). Sinon, ça bloque avec *"Access denied"*.
    -   `modifier onlyRegisteredEmployee()` : Vérifie que celui qui appelle la fonction a `isRegistered == true` dans le mapping.
4.  **Les Fonctions :**
    -   `addEmployee(...)` : Protégée par `onlyHR`. Ajoute un nouvel employé au mapping.
    -   `getAllEmployees()` : Protégée par `onlyHR`. Retourne la liste complète.
    -   `getMyInfo()` : Protégée par `onlyRegisteredEmployee`. Chaque employé peut consulter *uniquement* ses propres données.

### B. Le Backend d'Infrastructure (Hardhat)
Pour ne pas payer de vrais frais (gas) pendant le développement, vous utilisez **Hardhat**.
-   `npx hardhat node` : Lance une blockchain Ethereum locale (une simulation sur votre PC avec 20 faux comptes remplis de faux Ethers).
-   `scripts/deploy.js` : Ce script compile le code Solidity et l'envoie sur la blockchain locale. Une fois "miné", le contrat obtient une adresse unique (ex: `0x5F...a3`). Le script copie aussi cette adresse et l'ABI vers le frontend.

---

## 3. 🌐 Le Frontend (`frontend/`)

Le frontend est ce que l'utilisateur voit. Il fait le pont entre le navigateur et la blockchain.

**Les technologies :**
-   **HTML/CSS** : La structure et le design premium "Glassmorphism" (interface moderne, sombre, avec des particules).
-   **JavaScript (Vanilla) & Ethers.js** : C'est ici que la magie opère.

**Comment le Frontend communique avec la Blockchain (`app.js`) :**
1.  **L'ABI (Application Binary Interface) & L'Adresse :** Pour parler au contrat, le frontend a besoin de savoir *où* il est (son adresse JSON) et *comment* lui parler (quelles fonctions existent ? C'est le rôle du fichier `GestionRH.json` / ABI).
2.  **Ethers.js :** C'est la librairie qui permet d'utiliser MetaMask comme "pont".
3.  **Le Workflow de Connexion :**
    -   L'utilisateur clique sur "Connecter MetaMask".
    -   Le JS appelle `window.ethereum.request(...)` pour demander la permission à MetaMask.
    -   Une fois connecté, le script récupère l'adresse de l'utilisateur.
    -   **Le Routage RBAC (La fonction `checkRole`) :**
        -   Le JS demande au contrat : *"Quelle est l'adresse hrAddress ?"*
        -   Si l'adresse MetaMaks de l'utilisateur === `hrAddress` ➡️ Affichage de la **Section RH** (formulaire d'ajout + liste).
        -   Sinon, le JS appelle `getMyInfo()`. Si ça réussit (l'employé existe), il affiche la **Section Employé**.
        -   Si l'appel échoue (la personne n'est ni RH ni employé), il affiche **"Accès Refusé"**.

---

## 4. 🧠 Scénario Pratique pour la Soutenance (Démo)

Voici comment vous devriez présenter la démo demain :

1.  **Préparation (En coulisses) :**
    - Lancez `npx hardhat node` (Terminal 1).
    - Lancez `npx hardhat run scripts/deploy.js --network localhost` (Terminal 2).
    - Lancez le serveur Live (HTTP serveur) sur le frontend.
2.  **Phase 1 : Le Rôle RH (Montrer le pouvoir de l'admin)**
    - Connectez MetaMask avec le **Compte 0** (Celui qui a déployé).
    - Montrez que le frontend détecte que vous êtes le RH.
    - Remplissez le formulaire d'ajout pour créer un employé (ex: Youssef, Développeur Blockchain).
    - *👉 Expliquez : "Quand je clique sur ajouter, une transaction est signée par le RH et envoyée à la blockchain locale. Le modifier `onlyHR` autorise cette action."*
    - Cliquez sur "Charger les employés" pour montrer la liste.
3.  **Phase 2 : Le Rôle Employé (Montrer le contrôle d'accès partiel)**
    - Changez de compte MetaMask dans l'extension (prenez le Compte 1 que vous venez d'ajouter).
    - La page se met à jour ou rafraîchissez.
    - Le frontend détecte que vous êtes un employé. Le menu RH disparaît.
    - Cliquez sur "Afficher mes données".
    - *👉 Expliquez : "Ici, l'utilisateur exécute le code pour lire ses propres données. Le modifier `onlyRegisteredEmployee` garantit la confidentialité."*
4.  **Phase 3 : L'Intrus (Montrer la sécurité)**
    - Changez de compte MetaMask vers un Compte 2 (non enregistré).
    - Montrez la page "Accès Refusé".
    - *👉 Expliquez : "La blockchain garantit que ce wallet n'a aucune permission."*

---

## 5. ❓ Questions classiques des jurys (Préparations)

**Q : Pourquoi avoir choisi la Blockchain plutôt qu'une base de données classique pour un SI RH ?**
*R : Pour l'immuabilité et la traçabilité. Dans une BDD classique, un admin corrompu peut modifier des données sans laisser de trace. Sur la blockchain, toute action (ajouter un employé) génère une transaction traçable et infalsifiable à vie.*

**Q : Où sont réellement stockées les informations des employés ?**
*R : Elles sont stockées dans le "State" du Smart Contract Ethereum, sous la forme d'un dictionnaire/mapping (`mapping(address => Employee)`). Chaque nœud du réseau possède une copie de cet état.*

**Q : Comment avez-vous implémenté la sécurité des accès ?**
*R : Grâce aux `modifiers` en Solidity. C'est du code qui s'exécute avant le corps de nos fonctions pour vérifier la condition `require(msg.sender == hrAddress)`. `msg.sender` est l'adresse cryptographique incrustée dans la transaction, impossible à falsifier.*

**Q : Que fait exactement Ethers.js dans votre frontend ?**
*R : Il sert Provider et de Signer. Le Provider construit des requêtes lisibles par le noeud blockchain. Le Signer utilise la clé privée de MetaMask pour signer cryptographiquement nos transactions d'écriture (comme l'ajout d'employé).*

---
*Bonne chance à Youssef et Sifeddine pour la soutenance demain ! Vous maîtrisez le sujet ! 🚀*
