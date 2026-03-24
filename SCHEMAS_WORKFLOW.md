# 📊  Schémas d'Architecture et Workflows (BlockRH)

Ce document contient les diagrammes visuels de votre application. Ces schémas sont **parfaits pour votre présentation PowerPoint** car ils montrent exactement comment les données circulent entre l'utilisateur, le frontend (Navigateur), MetaMask et le backend (Smart Contract sur la Blockchain).

---

## 🏗️ 1. Architecture Globale (Web3)

Voici l'architecture technique de votre DApp. Contrairement à une application Web2 classique (où le Frontend parle à un serveur centralisé), ici le Frontend parle directement à la Blockchain via le Wallet.

```mermaid
graph TD
    classDef user fill:#6366f1,stroke:#4f46e5,stroke-width:2px,color:#fff;
    classDef front fill:#14b8a6,stroke:#0d9488,stroke-width:2px,color:#fff;
    classDef wallet fill:#f59e0b,stroke:#d97706,stroke-width:2px,color:#fff;
    classDef back fill:#8b5cf6,stroke:#7c3aed,stroke-width:2px,color:#fff;

    U((Utilisateur)):::user
    
    subgraph Client-Side [Ordinateur de l'Utilisateur]
        F[Frontend HTML/CSS/JS\n+ Ethers.js]:::front
        M{MetaMask\nWallet}:::wallet
    end
    
    subgraph Blockchain-Network [Réseau Ethereum / Hardhat]
        SC[(Smart Contract\nGestionRH.sol)]:::back
    end

    U -- "Interagit avec" --> F
    F -- "Demande Signature /\nDemande Connexion" --> M
    M -- "Autorise & Signe" --> F
    F -- "Lecture (0 gas) ou\nÉcriture (Transaction)" --> SC
    SC -- "Retourne Données /\nEvent Logs" --> F
```

---

## 👥 2. Scénario de Connexion & Routage (RBAC)

Que se passe-t-il exactement quand un utilisateur clique sur **"Connecter MetaMask"** ? Comment le Frontend sait-il quelle interface afficher ?

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant F as Frontend (app.js)
    participant M as MetaMask
    participant SC as Smart Contract

    U->>F: Clique sur "Connecter MetaMask"
    F->>M: Demande d'accès (eth_requestAccounts)
    M-->>U: Ouvre un popup d'autorisation
    U->>M: Approuve la connexion
    M-->>F: Retourne l'adresse Wallet (ex: 0x123...)
    
    Note over F,SC: Début de la vérification des rôles (RBAC)

    F->>SC: Appel `hrAddress()` (Lecture)
    SC-->>F: Retourne l'adresse du RH (ex: 0xAdmin)

    alt Si Adresse Utilisateur == Adresse RH
        F->>U: Affiche **Section RH** (Super Admin)
    else Si Adresse Utilisateur != Adresse RH
        F->>SC: Appel `getMyInfo()` (Lecture)
        alt Employé enregistré
            SC-->>F: Retourne données (Nom, Poste...) + isRegistered=true
            F->>U: Affiche **Section Employé**
        else Employé NON enregistré
            SC-->>F: Revert: "Access denied" (Modifier Blocked)
            F->>U: Affiche **Accès Refusé**
        end
    end
```

---

## ✍️ 3. Workflow du RH : Ajouter un Employé (Flux d'Écriture)

C'est l'action la plus critique du système. Elle modifie l'état de la blockchain, ce qui coûte du *Gas* et nécessite une *Signature Cryptographique*.

```mermaid
sequenceDiagram
    participant Admin as Super Admin (RH)
    participant F as Frontend (app.js)
    participant M as MetaMask (Signer)
    participant SC as Smart Contract

    Admin->>F: Remplit le formulaire (Nom, Salaire...)
    Admin->>F: Clique sur "Ajouter l'employé"
    
    F->>F: Prépare la transaction vers `addEmployee(...)`
    F->>M: Demande de signature de transaction
    
    M-->>Admin: Popup: "Confirmer la transaction ? (Frais de Gas)"
    Admin->>M: Valide et Signe
    
    M->>SC: Envoie la transaction signée à la Blockchain
    
    Note over SC: La Blockchain commence à miner
    
    SC->>SC: Modifier `onlyHR` vérifie si msg.sender == hrAddress (Succès)
    SC->>SC: Vérifie si l'employé n'existe pas déjà
    SC->>SC: Écrit les données dans le `mapping` (Stockage permanent)
    SC->>SC: Émet l'événement `EmployeeAdded`
    
    SC-->>F: Confirmation de la Transaction (Mined)
    F-->>Admin: Toast: "Employé ajouté avec succès !"
```

> **À retenir pour le jury :** Le frontend ne peut *jamais* ajouter d'employé tout seul. Si un hacker modifie le code JavaScript pour bypasser le frontend, la transaction échouera de toute façon sur la Blockchain car le Smart Contract validera mathématiquement (grâce à `onlyHR` et la signature MetaMask) que la transaction ne vient pas du vrai RH.

---

## 👁️ 4. Workflow de l'Employé : Consulter ses Données (Flux de Lecture)

Cette action est gratuite (0 Gas), rapide, et hautement confidentielle car l'employé ne peut lire que ses propres données.

```mermaid
sequenceDiagram
    participant Emp as Employé
    participant F as Frontend (app.js)
    participant SC as Smart Contract

    Note over Emp,SC: L'employé est déjà connecté via MetaMask
    
    Emp->>F: Clique sur "Afficher mes données"
    
    F->>SC: Appel de `getMyInfo()` (Provider.call)
    
    Note over SC: Exécution locale sans modification d'état (View)
    
    SC->>SC: Modifier `onlyRegisteredEmployee` vérifie si l'adresse existe
    SC->>SC: Récupère `employees[msg.sender]` depuis la base de données
    
    SC-->>F: Retourne { walletAddress, name, position, salary }
    
    F->>F: Formate les données (ex: Salaire en DHS)
    F-->>Emp: Affichage de la "Employee Card"
```

> **Le secret de cette confidentialité :** La fonction `getMyInfo` ne prend aucun paramètre. Elle utilise `msg.sender` (l'adresse cryptographique de celui qui fait la requête). Il est donc physiquement impossible pour l'Employé A de demander les infos de l'Employé B, car A ne peut pas falsifier `msg.sender`.
