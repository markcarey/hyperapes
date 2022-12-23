const zeroAddress = "0x0000000000000000000000000000000000000000";
const nftAddress = "0x4674312E6c202662F78E72dF039e16f3AAB2ec3a"; // all chains

var addr = {};

addr.goerli = {
    "evmChainId": 5,
    "name": "Etheruem Goerli",
    "rpc": "eth-goerli.alchemyapi.io/v2/n_mDCfTpJ8I959arPP7PwiOptjubLm57",
    "start": 1,
    "end": 1000,
    "bgcolor": "grey",
    "slug": "goerli",
    "native": "ETH",
    "manager": "0x01812D60958798695391dacF092BAc4a715B1718",
    "gas": "0x44b764045BfDC68517e10e783E69B376cef196B2",
    "domain": 5
};
addr.mumbai = {
    "evmChainId": 80001,
    "name": "Polygon Mumbai",
    "rpc": "polygon-mumbai.g.alchemy.com/v2/Ptsa6JdQQUtTbRGM1Elvw_ed3cTszLoj",
    "start": 1001,
    "end": 2000,
    "bgcolor": "purple",
    "slug": "mumbai",
    "native": "MATIC",
    "manager": "0xb636B2c65A75d41F0dBe98fB33eb563d245a241a",
    "gas": "0x9A27744C249A11f68B3B56f09D280599585DFBb8",
    "domain": 80001
};
addr["arbitrum-goerli"] = {
    "evmChainId": 421613,
    "name": "Arbitrum Goerli",
    "rpc": "arb-goerli.g.alchemy.com/v2/jb4AhFhyR0X_ChVX5J1f0oWQ6GvJqLK0",
    "start": 2001,
    "end": 3000,
    "bgcolor": "blue",
    "slug": "arbitrum-goerli",
    "native": "ETH",
    "manager": "0x4926a10788306D84202A2aDbd290b7743146Cc17",
    "gas": "0x679Dc08cC3A4acFeea2f7CAFAa37561aE0b41Ce7",
    "domain": 421613
};
addr["moonbeam-alpha"] = {
    "evmChainId": 1287,
    "name": "Moonbase Alpha",
    "rpc": "moonbeam-alpha.api.onfinality.io/rpc?apikey=63f987d5-9673-4446-a49a-0c72b9dc4899",
    "start": 3001,
    "end": 4000,
    "bgcolor": "red",
    "slug": "moonbase-alpha",
    "native": "DEV",
    "manager": "0xD356C996277eFb7f75Ee8bd61b31cC781A12F54f",
    "gas": "0xeb6f11189197223c656807a83B0DD374f9A6dF44",
    "domain": 0x6d6f2d61
};

const sidedoorAPI = "https://api.sidedoor.tools";

var chain = "moonbeam-alpha";
//var chain = "optigoerli";
var web3, hyper;
var accounts = [];
var provider, ethersSigner;

var tokenId;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
};

var allChains = ["goerli", "mumbai", "arbitrum-goerli", "moonbeam-alpha"];
for (let i = 0; i < allChains.length; i++) {
    var thisChain = allChains[i];
    const chainProvider = new ethers.providers.JsonRpcProvider({"url": "https://"+addr[thisChain].rpc});
    addr[thisChain].hyper = new ethers.Contract(nftAddress, nftABI, chainProvider);
}

function setupChain() {
    var rpcURL = addr[chain].rpc;
    const prov = {"url": "https://"+rpcURL};
    provider = new ethers.providers.JsonRpcProvider(prov);
    provider = new ethers.providers.Web3Provider(window.ethereum, "any");
    var wssProvider = new ethers.providers.WebSocketProvider(
        "wss://" + rpcURL
    );
    if (chain == "moonbeam-alpha") {
        wssProvider = new ethers.providers.WebSocketProvider(
            "wss://moonbeam-alpha.api.onfinality.io/ws?apikey=63f987d5-9673-4446-a49a-0c72b9dc4899"
        );
    }
    hyper = new ethers.Contract(
        nftAddress,
        nftABI,
        wssProvider
    );
    web3 = AlchemyWeb3.createAlchemyWeb3("wss://"+rpcURL);
    updateRemaining(chain);
}
setupChain();

provider.on("network", (newNetwork, oldNetwork) => {
    if (oldNetwork) {
        console.log(newNetwork, oldNetwork);
        //setupChain();
    }
});

const chains = {};
chains["5"] = {
    "chainId":  web3.utils.toHex(5),
    "chainName": "Goerli Test Network",
    "nativeCurrency": {
        "name": "Goerli ETH",
        "symbol": "GoerliETH",
        "decimals": 18
    },
    "rpcUrls": ["https://goerli.infura.io/v3/"],
    "blockExplorerUrls": ["https://goerli.etherscan.io"],
}
chains["420"] = {
    "chainId":  web3.utils.toHex(420),
    "chainName": "Optimism Goerli",
    "nativeCurrency": {
        "name": "KOR",
        "symbol": "KOR",
        "decimals": 18
    },
    "rpcUrls": ["https://goerli.optimism.io"],
    "blockExplorerUrls": ["https://blockscout.com/optimism/goerli"],
}
chains["80001"] = {
    "chainId":  web3.utils.toHex(80001),
    "chainName": "Polygon Mumbai",
    "nativeCurrency": {
        "name": "MATIC",
        "symbol": "MATIC",
        "decimals": 18
    },
    "rpcUrls": ["https://matic-mumbai.chainstacklabs.com"],
    "blockExplorerUrls": ["https://mumbai.polygonscan.com/"],
}
chains["421613"] = {
    "chainId":  web3.utils.toHex(421613),
    "chainName": "Arbitrum Goerli Testnet",
    "nativeCurrency": {
        "name": "ETH",
        "symbol": "ETH",
        "decimals": 18
    },
    "rpcUrls": ["https://goerli-rollup.arbitrum.io/rpc"],
    "blockExplorerUrls": ["https://goerli.arbiscan.io/"],
}
chains["1287"] = {
    "chainId":  web3.utils.toHex(1287),
    "chainName": "Moonbase Alpha",
    "nativeCurrency": {
        "name": "DEV",
        "symbol": "DEV",
        "decimals": 18
    },
    "rpcUrls": ["https://rpc.api.moonbase.moonbeam.network"],
    "blockExplorerUrls": ["https://moonbase.moonscan.io/"],
}

function abbrAddress(address){
    if (!address) {
        address = accounts[0];
    }
    return address.slice(0,4) + "..." + address.slice(address.length - 4);
}

async function connect(){
    if (window.ethereum) {
        //console.log("window.ethereum true");
        await provider.send("eth_requestAccounts", []);
        ethersSigner = provider.getSigner();
        accounts[0] = await ethersSigner.getAddress();
        console.log(accounts);
        const userChain = await ethereum.request({ method: 'eth_chainId' });
        if (web3.utils.hexToNumber(userChain) != chain) {
            //await ethereum.request({
            //    method: 'wallet_switchEthereumChain',
            //    params: [{ chainId: web3.utils.toHex(addr[chain].evmChainId) }],
            //});
            await switchChain(addr[chain].evmChainId);
        }
        $(".address").text(abbrAddress());
        $("#offcanvas").find("button").click();
    } else {
        // The user doesn't have Metamask installed.
        console.log("window.ethereum false");
    } 
}

async function mint(mintChain, color, wearing, deliveryChain) {
    var jumping = false;
    console.log(mintChain, color, wearing, deliveryChain);
    // TODO: prompt network change if network doesn't match mintChain
    const params = {
        "chain": addr[chain].name,
        "color": color,
        "wearing": wearing,
        "bgcolor": addr[chain].bgcolor,
        "template": "apes"
    };
    const res = await fetch(sidedoorAPI + '/nfts/metadata', { 
        method: 'POST', 
        headers: new Headers({
            'Authorization': 'Bearer apikeytbd', 
            'Content-Type': 'application/json'
        }), 
        body: JSON.stringify(params)
    });
    var result = await res.json();
    //var result ={
    //    "result": "ok",
    //    "image": "bafybeiaomrguepg4jmcpujyr5sklyhrqhvw6bo6redy4uvbubd7n2m2p4i",
    //    "meta": "bafkreibfqhevkqjufmugut5qo445icms6o2juc6x2a2vlnag4vdiu4bu2q"
    //    };
    const ipfsMeta = "ipfs://" + result.meta;
    const imageURL = ipfsToHttp(result.image);
    preload(imageURL);
    var tx;
    if (mintChain != deliveryChain) {
        jumping = true;
        const fee = [0]; // TODO: fee estimate
        console.log("estFee", fee[0]);
        tx = await hyper.connect(ethersSigner).mintAndSend(ipfsMeta, addr[deliveryChain].domain, {"value": ''+fee[0]});
    } else {
        tx = await hyper.connect(ethersSigner).mint(ipfsMeta);
    }
    let mintFilter = hyper.filters.Transfer(zeroAddress, accounts[0]);
    hyper.once(mintFilter, async (from, to, id, event) => { 
        tokenId = id;
        console.log('tokenId:' + tokenId);
        $("#mint-image").attr("src", imageURL);
        $("#tokenid").text(tokenId);
        $("#mint-title").text("");
        $("#mint-title-label").text("Minted!");
        $("#birth-chain, #color, #wearing").parents(".mint-field").hide();
        if (jumping) {
            $("#delivery-chain").parents(".mint-field").hide();
        }
        $("#mint-button").text("Minted!");
        await sleep(2000);
        if (jumping) {
            $("#mint-button").text("Swinging...");
            let arrivalFilter = addr[deliveryChain].hyper.filters.Transfer(zeroAddress, accounts[0]);
            addr[deliveryChain].hyper.once(arrivalFilter, async (from, to, id, event) => { 
                tokenId = id;
                $("#mint-title").text("");
                $("#mint-title-label").text("Swing Completed!");
                $("#jump-button").text("Swing Completed.");
                await sleep(2000);
                $("#jump-button").hide();
                $("#mint-button").show().attr("href", getMarketplaceURL(deliveryChain, tokenId)).text("View on Opensea");
                await sleep(2000);
                $("#reset-button").show();
            });
        } else {
            $("#mint-button").attr("href", getMarketplaceURL(mintChain, tokenId)).text("View on Opensea");
            $("#jump-button").show();
            await sleep(2000);
            $("#reset-button").show();
        }
        updateRemaining(chain);
    });
    await tx.wait();
}

async function jump(tokenId, deliveryChain) {
    console.log(deliveryChain, addr[deliveryChain].domain);
    const fee = [0]; // TODO: fee estimate
    console.log("estFee", fee[0]);
    const tx = await hyper.connect(ethersSigner).evmSend(addr[deliveryChain].domain, tokenId, {"value": ''+fee[0]});
    let burnFilter = hyper.filters.Transfer(accounts[0], zeroAddress);
    hyper.once(burnFilter, async (from, to, id, event) => { 
        tokenId = id;
        $("#jump-button").text("Swing Started...");
    });
    let arrivalFilter = addr[deliveryChain].hyper.filters.Transfer(zeroAddress, accounts[0]);
    addr[deliveryChain].hyper.once(arrivalFilter, async (from, to, id, event) => { 
        tokenId = id;
        $("#mint-title").text("");
        $("#mint-title-label").text("Swing Completed!");
        $("#jump-button").text("Swing Completed.");
        await sleep(2000);
        $("#jump-button").hide();
        $("#mint-button").show().attr("href", getMarketplaceURL(deliveryChain, tokenId)).text("View on Opensea");
        await sleep(2000);
        $("#reset-button").show();
    });
    tx.wait();
    // TODO: filter for arrival on destination chain
    return false;
}

async function switchChain(chainId) {
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: web3.utils.toHex(chainId) }],
        });
    } catch (switchError) {
        // This error code indicates that the chain has not been added to MetaMask.
        if (switchError.code === 4902) {
            try {
                await ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [
                        chains[chainId]
                    ],
                });
                switchChain(chainId);
            } catch (addError) {
                // handle "add" error
            }
        }
        // handle other "switch" errors
    }
    if (chainId == 80001) {
        chain = "mumbai";
    }
    if (chainId == 420) {
        chain = "optigoerli";
    }
    if (chainId == 5) {
        chain = "goerli";
    }
    if (chainId == 421613) {
        chain = "arbitrum-goerli";
    }
    if (chainId == 1287) {
        chain = "moonbeam-alpha";
    }
    setupChain();
}

async function updateRemaining(targetChain) {
    const max = await addr[targetChain].hyper.maxMintId();
    const next = await addr[targetChain].hyper.nextMintId();
    const remaining = parseInt(max) - parseInt(next) + 1;
    $("#remaining").text(remaining);
}

function reset() {
    $("#mint-image").attr("src", "https://hyperapes.club/images/mint.png");
    $("#tokenid").text("?");
    $("#mint-title").text("Public Mint is ");
    $("#mint-title-label").text("Live");
    $("#birth-chain, #color, #wearing, #delivery-chain").parents(".mint-field").show();
    $("#jump-button").hide().text("Swing");
    $("#mint-button").attr("href", "#").show().text("Mint Now");
    tokenId = null;
}

function ipfsToHttp(ipfs) {
    var http = "";
    var cid = ipfs.replace("ipfs://", "");
    //http = "https://" + cid + ".ipfs.dweb.link";
    //http = "https://ipfs.io/ipfs/" + cid;
    http = "https://nftstorage.link/ipfs/" + cid;
    return http;
}

function getMarketplaceURL(currentChain, tokenId) {
    var slug = addr[currentChain].slug;
    var url = `https://testnets.opensea.io/assets/${slug}/${nftAddress}/${tokenId}`;
    return url;
}

function preload(url) {
    var image = new Image();
	image.src = url;
}

$( document ).ready(function() {

    $(".connect").click(function(){
        connect();
        return false;
    });

    $("#mint-button").click(function(){
        if (tokenId) {
            return true;
        }
        $(this).text("Minting...");
        const mintChain = $("#birth-chain").val();
        const color = $("#color").val();
        const wearing = $("#wearing").val();
        const deliveryChain = $("#delivery-chain").val();
        mint(mintChain, color, wearing, deliveryChain);
        return false;
    });

    $("#jump-button").click(function(){
        if (!tokenId) {
            console.log("need tokenId to swing");
            return false;
        }
        $(this).text("Swinging...");
        const deliveryChain = $("#delivery-chain").val();
        jump(tokenId, deliveryChain);
        return false;
    });

    $("#reset-button").click(function(){
        reset();
        $(this).hide();
        return false;
    });

    $(".switch").click(async function(){
        var chainId = $(this).data("chain");
        await switchChain(chainId);
        return false;
    });

    $("#birth-chain").change(async function(){
        const newChain = $(this).val();
        $(".birth-chain-name").text(addr[newChain].name);
        $("#native-token").text(addr[newChain].native);
        updateRemaining(newChain);
        await switchChain(addr[newChain].evmChainId);
    });

});