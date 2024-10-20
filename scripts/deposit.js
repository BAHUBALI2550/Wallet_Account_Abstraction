const hre = require("hardhat");

const EP_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const PM_ADDRESS = "0x9169564e4298dc89Ee81477a41f2dea133eC3E1D";

async function main() {
  const entryPoint = await hre.ethers.getContractAt("EntryPoint", EP_ADDRESS);

  await entryPoint.depositTo(PM_ADDRESS, {
    value: hre.ethers.parseEther(".04"),
  });

  console.log("deposit was successful!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});