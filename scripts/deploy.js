const { ethers } = require("hardhat");

/// Deploys the event-ticket NFT contract using the configured Hardhat network.
async function main() {
  const Ticket = await ethers.getContractFactory("EventTicketNFT");
  const ticket = await Ticket.deploy();
  await ticket.waitForDeployment();
  console.log("EventTicketNFT deployed to:", await ticket.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
