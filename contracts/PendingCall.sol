pragma solidity ^0.4.5;

contract PendingCall {
    // Call with full data
    struct PendingOne {
        uint count;
        address contractAddress;
        bytes data;
    }

    mapping(bytes32 => PendingOne) public pendingOnes;

    function pleaseCallOne(
        address newContractAddress, 
        bytes newData) 
        returns (bytes32 key, uint8 result) {
        key = sha3(newContractAddress, newData);
        PendingOne pendingOne = pendingOnes[key];
        if (pendingOne.count > 0) {
            result = effectCall(pendingOne);
        } else {
            pendingOne.count = 1;
            pendingOne.contractAddress = newContractAddress;
            pendingOne.data = newData;
            result = 0;
        }
    }

    function callPending(bytes32 key) 
        returns (uint8 result) {
        PendingOne pendingOne = pendingOnes[key];
        if (pendingOne.count > 0) {
            result = effectCall(pendingOne);
        } else {
            result = 0;
        }
    }

    function effectCall(PendingOne storage pendingOne) 
        internal
        returns (uint8 result) {
        pendingOne.count++;
        if (pendingOne.contractAddress
                .call(pendingOne.data)) {
            result = 1;
        } else {
            result = 2;
        }
    }
}