// SPDX-License-Identifier: Apache-2.0
pragma solidity >=0.8.0;

import {Router} from "@hyperlane-xyz/core/contracts/Router.sol";
import {TypeCasts} from "@hyperlane-xyz/core/contracts/libs/TypeCasts.sol";

/**
 * @title Hyperlane Router that extends the ERC721 token standard to enable native interchain transfers.
 * @author Mark Carey, modified from https://github.com/hyperlane-xyz/hyperlane-token/blob/main/contracts/libs/TokenRouter.sol
 */
abstract contract ERC721Router is Router {
    using TypeCasts for bytes32;

    /**
     * @dev Emitted on `transferRemote` when a transfer message is dispatched.
     * @param destination The identifier of the destination chain.
     * @param recipient The address of the recipient on the destination chain.
     * @param tokenId The tokenId burnt on the origin chain.
     */
    event SentTransferRemote(
        uint32 indexed destination,
        bytes32 indexed recipient,
        uint256 tokenId
    );

    /**
     * @notice Transfers `_tokenId` from `msg.sender` to `_recipient` on the `_destination` chain.
     * @dev Burns `_tokenId`  on the origin chain and dispatches
     *      message to the `destination` chain to mint `_tokenId` to `recipient`.
     * @dev Emits `SentTransferRemote` event on the origin chain.
     * @param _destination The identifier of the destination chain.
     * @param _recipient The address of the recipient on the destination chain.
     * @param _tokenId The id of ERC721 token to be sent to the remote recipient.
     */
    function transferRemote(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _tokenId
    ) external payable {
        _send(_destination, _recipient, _tokenId);
    }

    function _send(
        uint32 _destination,
        bytes32 _recipient,
        uint256 _tokenId
    ) internal virtual {
        bytes memory _payload = _messagePayload(_recipient, _tokenId);
        _beforeSending(_tokenId);
        _dispatchWithGas(
            _destination,
            _payload,
            msg.value
        );
        emit SentTransferRemote(_destination, _recipient, _tokenId);
    }

    function _beforeSending(uint256 _tokenId) internal virtual;

    function _messagePayload(bytes32 _recipient, uint256 _tokenId) internal virtual returns(bytes memory);

    /**
     * @dev Mints tokens to recipient when router receives transfer message.
     * @param _origin The identifier of the origin chain.
     * @param _payload The encoded remote transfer message containing the recipient address and amount and other data.
     */
    function _handle(
        uint32 _origin,
        bytes32,
        bytes calldata _payload
    ) internal override {
        _receive(_origin, _payload);
    }

    function _receive(uint32 _origin, bytes calldata _payload) internal virtual;
}