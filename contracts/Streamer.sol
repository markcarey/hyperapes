// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.2;

import { ISuperfluid, ISuperToken, ISuperAgreement } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol";
import { IConstantFlowAgreementV1 } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";
import { ISuperTokenFactory } from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperTokenFactory.sol";
import { INativeSuperToken } from "./superfluid-finance/ethereum-contracts/contracts/interfaces/tokens/INativeSuperToken.sol"; 
import { NativeSuperTokenProxy } from "./superfluid-finance/ethereum-contracts/contracts/tokens/NativeSuperToken.sol";
import { CFAv1Library } from "./superfluid-finance/ethereum-contracts/contracts/apps/CFAv1Library.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Streamer is AccessControl {
    using SafeMath for uint256;
    using CFAv1Library for CFAv1Library.InitData;

    ISuperTokenFactory private _superTokenFactory;
    INativeSuperToken public token;
    ISuperfluid _host;
    IConstantFlowAgreementV1 _cfa;
    CFAv1Library.InitData public cfaV1;

    mapping(address => uint256) tokenCount;
    mapping(uint256 => address) owners;
    int96 unitFlowRate;

    bytes32 public constant STREAM_MANAGER_ROLE = keccak256("STREAM_MANAGER_ROLE");

    constructor(string memory name, string memory symbol, uint256 supply, address _stf, address host, address cfa, int96 _unitFlowRate) {
        token = INativeSuperToken(address(new NativeSuperTokenProxy()));
        _superTokenFactory = ISuperTokenFactory(_stf);
        _superTokenFactory.initializeCustomSuperToken(address(token));
        token.initialize(name, symbol, supply, address(this));
        _host = ISuperfluid(host);
        _cfa = IConstantFlowAgreementV1(cfa);
        cfaV1 = CFAv1Library.InitData(_host, IConstantFlowAgreementV1(address(_host.getAgreementClass(keccak256("org.superfluid-finance.agreements.ConstantFlowAgreement.v1")))));
        unitFlowRate = _unitFlowRate;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(STREAM_MANAGER_ROLE, msg.sender);
    }

    function stream(address from, address to, uint tokenId) external onlyRole(STREAM_MANAGER_ROLE) {
        if (from != address(0)) {
            if (tokenCount[from] > 0) {
                tokenCount[from]--;
                cfaV1.flow(from, token, int96(int256( uint256(uint96(unitFlowRate)).mul(tokenCount[from]) )) );
            }
        }
        if (to != address(0)) {
            tokenCount[to]++;
            cfaV1.flow(to, token, int96(int256( uint256(uint96(unitFlowRate)).mul(tokenCount[to]) )) );
        }
        owners[tokenId] = to;
    }

    function ownerOf(uint256 tokenId) external view returns(address) {
        return owners[tokenId];
    }

    function balanceOf(address owner) external view returns(uint) {
        return tokenCount[owner];
    }
}
