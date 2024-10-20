const hre = require("hardhat");
require("dotenv").config();

const FACTORY_ADDRESS = "0xae4D49197edDE7216962cBc94D7fb55a5E76c41F";
const EP_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789";
const PM_ADDRESS = "0xA23558b8F5fa26507c32C7608B013f616Cf8Fa9b";

async function main() {
    const entryPoint = await hre.ethers.getContractAt("EntryPoint", EP_ADDRESS);

    

    const AccountFactory = await hre.ethers.getContractFactory("AccountFactory");
    const [signer0] = await hre.ethers.getSigners();
    const address0 = await signer0.getAddress();
    let initCode =
        FACTORY_ADDRESS +
        AccountFactory.interface
            .encodeFunctionData("createAccount", [address0])
            .slice(2);

    let sender;
    try {
        await entryPoint.getSenderAddress(initCode);
    } catch (ex) {
        sender = "0x" + ex.data.slice(-40);
    }

    const code = await ethers.provider.getCode(sender);
    if (code !== "0x") {
        initCode = "0x";
    }

    console.log({sender});

    const Account = await hre.ethers.getContractFactory("Account");

    const userOp = {
        sender,
        nonce: "0x" + (await entryPoint.getNonce(sender, 0)).toString(16),
        initCode,
        callData: Account.interface.encodeFunctionData("execute"),
        paymasterAndData: PM_ADDRESS,
        signature: 
        "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c",
    };

    const { preVerificationGas, verificationGasLimit, callGasLimit } =
    await ethers.provider.send("eth_estimateUserOperationGas", [
      userOp,
      EP_ADDRESS,
    ]);
    console.log(preVerificationGas);

  userOp.preVerificationGas = preVerificationGas;
  userOp.verificationGasLimit = verificationGasLimit;
  userOp.callGasLimit = callGasLimit;

  const { maxFeePerGas } = await ethers.provider.getFeeData();
  userOp.maxFeePerGas = "0x" + maxFeePerGas.toString(16);

  const maxPriorityFeePerGas = await ethers.provider.send(
    "rundler_maxPriorityFeePerGas"
  );
  userOp.maxPriorityFeePerGas = maxPriorityFeePerGas;

    // callGasLimit: 400_000,
    // verificationGasLimit: 400_000,
    // preVerificationGas: 100_000,
    // maxFeePerGas: hre.ethers.parseUnits("10", "gwei"),
    // maxPriorityFeePerGas: hre.ethers.parseUnits("5", "gwei"),

    const userOpHash = await entryPoint.getUserOpHash(userOp);
    userOp.signature = await signer0.signMessage(hre.ethers.getBytes(userOpHash));

    const opHash = await ethers.provider.send("eth_sendUserOperation", [
        userOp,
        EP_ADDRESS,
    ]);

    setTimeout(async () => {
        const { transactionHash } = await ethers.provider.send(
        "eth_getUserOperationByHash",
        [opHash]
        );

        console.log(transactionHash);
    }, 5000);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});