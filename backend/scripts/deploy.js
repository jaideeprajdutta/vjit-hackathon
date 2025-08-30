// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
import { ethers } from "hardhat";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Get the contract factory
  const GrievanceSLA = await ethers.getContractFactory("GrievanceSLA");
  
  // Deploy the contract
  console.log("Deploying GrievanceSLA contract...");
  const grievanceSLA = await GrievanceSLA.deploy();
  
  // Wait for deployment to finish
  await grievanceSLA.waitForDeployment();
  
  const address = await grievanceSLA.getAddress();
  console.log("GrievanceSLA deployed to:", address);
  
  // Get the signers
  const [owner, officer1, officer2] = await ethers.getSigners();
  
  console.log("Contract owner:", await owner.getAddress());
  console.log("Officer 1:", await officer1.getAddress());
  console.log("Officer 2:", await officer2.getAddress());
  
  // Authorize additional officers
  console.log("Authorizing officers...");
  await grievanceSLA.setOfficerAuthorization(await officer1.getAddress(), true);
  await grievanceSLA.setOfficerAuthorization(await officer2.getAddress(), true);
  
  console.log("Deployment completed successfully!");
  console.log("Contract address:", address);
  
  // Save deployment info
  const deploymentInfo = {
    contract: "GrievanceSLA",
    address: address,
    network: "localhost",
    owner: await owner.getAddress(),
    officers: [
      await officer1.getAddress(),
      await officer2.getAddress()
    ],
    timestamp: new Date().toISOString()
  };
  
  // Write deployment info to file
  const deploymentPath = path.join(__dirname, '../deployment.json');
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
