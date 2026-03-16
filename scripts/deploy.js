import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log("Deploying GestionRH contract...");

    const GestionRH = await hre.ethers.getContractFactory("GestionRH");
    const gestionRH = await GestionRH.deploy();

    await gestionRH.waitForDeployment();
    const address = await gestionRH.getAddress();

    console.log(`GestionRH deployed to: ${address}`);

    saveFrontendFiles(address);
}

function saveFrontendFiles(contractAddress) {
    const frontendDir = path.join(__dirname, "..", "frontend");

    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir);
    }

    fs.writeFileSync(
        path.join(frontendDir, "contract-address.json"),
        JSON.stringify({ GestionRH: contractAddress }, undefined, 2)
    );

    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "GestionRH.sol", "GestionRH.json");
    const GestionRHArtifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));

    fs.writeFileSync(
        path.join(frontendDir, "GestionRH.json"),
        JSON.stringify(GestionRHArtifact, null, 2)
    );
    console.log("Artifacts saved to frontend directory.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
