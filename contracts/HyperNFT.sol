// SPDX-License-Identifier: AGPL-3.0-only

pragma solidity ^0.8.2;

//import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {ERC721Router} from "./libs/ERC721Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStreamer {
    function stream(address _from, address _to, uint256 _tokenId) external;
    function token() external returns(address);
}

contract HyperNFT is Initializable, ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC721BurnableUpgradeable, AccessControlUpgradeable, ERC721Router {
    using TypeCasts for bytes32;
    using TypeCasts for address;
    uint public nextMintId;
    uint public maxMintId;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant METADATA_ROLE = keccak256("METADATA_ROLE");
    string private contractURIHash;
    IStreamer streamer;
    uint32 streamDomain;

    function initialize(string memory _name, string memory _symbol, address _connectionManager, address _interchainGasPaymaster, uint _startMintId, uint _endMintId, address sender, uint32[] memory remoteDomains, string memory _contractURIHash, address _streamer, uint32 _streamDomain) public initializer {
        __Router_initialize(_connectionManager, _interchainGasPaymaster);
        __ERC721_init(_name, _symbol);
        nextMintId = _startMintId;
        maxMintId = _endMintId;
        contractURIHash = _contractURIHash;
        streamer = IStreamer(_streamer);
        streamDomain = _streamDomain;
        _grantRole(DEFAULT_ADMIN_ROLE, sender);
        _grantRole(MINTER_ROLE, sender);
        _grantRole(METADATA_ROLE, sender);
        for(uint i = 0; i < remoteDomains.length; i++) {
            _enrollRemoteRouter(remoteDomains[i], address(this).addressToBytes32());
        }
    }

    function mint(string memory uri) external payable {
        require(nextMintId <= maxMintId, "HyperNFT: max mint limit reached");

        uint tokenId = nextMintId;
        nextMintId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _startStream(tokenId);
    }

    // @dev mint on this chain and immediate send it to the same address on a different chain
    function mintAndSend(string memory uri, uint32 domain ) external payable {
        require(nextMintId <= maxMintId, "HyperNFT: max mint limit reached");

        uint tokenId = nextMintId;
        nextMintId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        _send(domain, msg.sender.addressToBytes32(), tokenId);
        _startStream(tokenId);
    }

    function mintWithPass(string memory uri) external {
        require(nextMintId <= maxMintId, "HyperNFT: max mint limit reached");
        require(address(streamer) != address(0), "No mint pass on this chain");
        IERC20 mintPass = IERC20(streamer.token());

        bool transferSuccess = mintPass.transferFrom(msg.sender, address(this), 1000000 ether);
        if(!transferSuccess) revert("!million");

        uint tokenId = nextMintId;
        nextMintId++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
    }

    function _startStream(uint tokenId) internal {
        if (address(streamer) != address(0)) {
            streamer.stream(address(0), msg.sender, tokenId);
        } else {
            if (streamDomain != uint32(0)) {
                _dispatchWithGas(
                    streamDomain,
                    abi.encode(bytes32(0), msg.sender.addressToBytes32(), tokenId, "stream"),
                    0
                );
            }
        }
    }

    // @dev convenience method
    function evmSend(uint32 domain, uint _tokenId) public payable {
         _send(domain, ownerOf(_tokenId).addressToBytes32(), _tokenId);
    }

    function _beforeSending(uint256 _tokenId) internal override {
        require(ownerOf(_tokenId) == msg.sender, "!owner");
        _burn(_tokenId);
    }

    function _messagePayload(bytes32 _recipient, uint256 _tokenId) view internal override returns(bytes memory payload) {
        payload = abi.encode(bytes32(0), _recipient, _tokenId, this.tokenURI(_tokenId));
    }

    /**
     * @dev Emitted on `_handle` when a transfer message is processed.
     * @param origin The identifier of the origin chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param tokenId The tokenId minted on the destination chain.
     */
    event ReceivedTransferRemote(
        uint32 indexed origin,
        bytes32 indexed recipient,
        uint256 tokenId
    );

    function _receive(uint32 _origin, bytes calldata _payload) internal override {
        (bytes32 fromAddressBytes32, bytes32 toAddressBytes32, uint tokenId, string memory uri) = abi.decode(_payload, (bytes32, bytes32, uint, string));
        address to = toAddressBytes32.bytes32ToAddress();
        if (keccak256(bytes(uri)) == keccak256(bytes("stream"))) {
            address from = fromAddressBytes32.bytes32ToAddress();
            if (address(streamer) != address(0)) {
                streamer.stream(from, to, tokenId);
            }
        } else {
            require(!_exists(tokenId), "token already exists on this chain");
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, uri);
            emit ReceivedTransferRemote(_origin, toAddressBytes32, tokenId);
        }
    }

    function _beforeTokenTransfer(
        address oldReceiver,
        address newReceiver,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721Upgradeable) {
        super._beforeTokenTransfer(oldReceiver, newReceiver, tokenId, batchSize);
        if ( (oldReceiver != address(0)) && (newReceiver != address(0)) ) {
            if (address(streamer) != address(0)) {
                streamer.stream(oldReceiver, newReceiver, tokenId);
            } else {
                if (streamDomain != uint32(0)) {
                    _dispatchWithGas(
                        streamDomain,
                        abi.encode(oldReceiver.addressToBytes32(), newReceiver.addressToBytes32(), tokenId, "stream"),
                        0
                    );
                }
            }
        }
    }

    /**
     * @notice The IPFS URI of contract-level metadata for OpenSea, etrc.
     */
    function contractURI() external view returns (string memory) {
        return string(abi.encodePacked('ipfs://', contractURIHash));
    }

    /**
     * @notice Set the _contractURIHash.
     * @dev Only callable by the owner.
     */
    function setContractURIHash(string memory _newContractURIHash) external onlyRole(DEFAULT_ADMIN_ROLE) {
        contractURIHash = _newContractURIHash;
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }


    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint[50] private __gap;
}