const chain = hre.network.name;

const tokenName = "Bananas";
const symbol = "BANANA";
const supply = "420000000000000000000000000000000"; // 420T
const stf = "0x200657E2f123761662567A1744f9ACAe50dF47E6";
const host = "0xEB796bdb90fFA0f28255275e16936D25d3418603";
const cfa = "0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873";
const rate = "1000000000000000000"; // 1 token per second

async function main() {
    // Grab the contract factory 
    const MyContract = await ethers.getContractFactory("Streamer");
 
    // Start deployment, returning a promise that resolves to a contract object
    const myContract = await MyContract.deploy(tokenName, symbol, supply, stf, host, cfa, rate); // Instance of the contract 
    console.log("Contract deployed to address:", myContract.address);
    console.log(`npx hardhat verify --network ${chain} ${myContract.address} "${tokenName}" ${symbol} ${supply} ${stf} ${host} ${cfa} ${rate}`);
 }
 
 main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });