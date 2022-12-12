const cdaABI = [{"inputs":[],"name":"EmptyBytecode","type":"error"},{"inputs":[],"name":"FailedDeploy","type":"error"},{"inputs":[],"name":"FailedInit","type":"error"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"bytecodeHash","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"salt","type":"bytes32"},{"indexed":true,"internalType":"address","name":"deployedAddress","type":"address"}],"name":"Deployed","type":"event"},{"inputs":[{"internalType":"bytes","name":"bytecode","type":"bytes"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"deploy","outputs":[{"internalType":"address","name":"deployedAddress_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"bytecode","type":"bytes"},{"internalType":"bytes32","name":"salt","type":"bytes32"},{"internalType":"bytes","name":"init","type":"bytes"}],"name":"deployAndInit","outputs":[{"internalType":"address","name":"deployedAddress_","type":"address"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes","name":"bytecode","type":"bytes"},{"internalType":"address","name":"sender","type":"address"},{"internalType":"bytes32","name":"salt","type":"bytes32"}],"name":"deployedAddress","outputs":[{"internalType":"address","name":"deployedAddress_","type":"address"}],"stateMutability":"view","type":"function"}];
const cdaAddress = '0x98B2920D53612483F91F12Ed7754E51b4A77919e';

const zeroAddress = "0x0000000000000000000000000000000000000000";
const chain = hre.network.name;

const nftJSON = require("../artifacts/contracts/HyperNFT.sol/HyperNFT.json");
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const PUBLIC_KEY = process.env.PUBLIC_KEY;
const signer = new ethers.Wallet(PRIVATE_KEY, ethers.provider);

const v = "one";
const salt = ethers.utils.formatBytes32String(v);

const ABI = ["function initialize(string memory _name, string memory _symbol, address _connectionManager, address _interchainGasPaymaster, uint _startMintId, uint _endMintId, address sender, uint32[] memory remoteDomains, string memory _contractURIHash, address _streamer, uint32 _streamDomain)"];
const iface = new ethers.utils.Interface(ABI);

const name = "Hyper Apes";
const symbol = "hAPE";
const contractHash = "QmaQhe8igCrPrq3obupKfVxpaguZyTEZvzgJp37DaJP3Nj";
var streamer = zeroAddress;
var streamDomain = 0;
if (chain == "mumbai") {
    streamer = "0x3f900c008729BA1CAa5De3e25a77b2aa1475c121";
} else {
    streamDomain = 80001;
}
var addr = {};
addr.goerli = {
    "start": 1,
    "end": 1000,
    "manager": "0x01812D60958798695391dacF092BAc4a715B1718",
    "gas": "0x44b764045BfDC68517e10e783E69B376cef196B2",
    "domain": 5
};
addr.mumbai = {
    "start": 1001,
    "end": 2000,
    "manager": "0xb636B2c65A75d41F0dBe98fB33eb563d245a241a",
    "gas": "0x9A27744C249A11f68B3B56f09D280599585DFBb8",
    "domain": 80001
};
addr["arbitrum-goerli"] = {
    "start": 2001,
    "end": 3000,
    "manager": "0x4926a10788306D84202A2aDbd290b7743146Cc17",
    "gas": "0x679Dc08cC3A4acFeea2f7CAFAa37561aE0b41Ce7",
    "domain": 421613
};
addr["moonbeam-alpha"] = {
    "start": 3001,
    "end": 4000,
    "manager": "0xD356C996277eFb7f75Ee8bd61b31cC781A12F54f",
    "gas": "0xeb6f11189197223c656807a83B0DD374f9A6dF44",
    "domain": 0x6d6f2d61
};
const targetChains = [ "goerli", "moonbeam-alpha", "mumbai", "arbitrum-goerli" ];
var chainDomains = [];

for (let i = 0; i < targetChains.length; i++) {
    var thisChain = targetChains[i];
    if ( thisChain == chain ) {
        // do nothing
    } else {
        chainDomains.push(addr[thisChain].domain);
    }
}
console.log(chainDomains);
const init = iface.encodeFunctionData("initialize", [ name, symbol, addr[chain].manager, addr[chain].gas, addr[chain].start, addr[chain].end, PUBLIC_KEY, chainDomains, contractHash, streamer, streamDomain ]);


async function main() {

    const factory = new ethers.Contract(cdaAddress, cdaABI, signer);
    const result = await factory.deployAndInit(nftJSON.bytecode, salt, init);
    console.log(result);
    await result.wait();

}

main()
   .then(() => process.exit(0))
   .catch(error => {
     console.error(error);
     process.exit(1);
   });