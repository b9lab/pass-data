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
		if (pendingOnes[key].count > 0) {
			pendingOnes[key].count++;
			if (newContractAddress.call(newData)) {
				result = 1;
			} else {
				result = 2;
			}
		} else {
			pendingOnes[key] = PendingOne({
				count: 1,
				contractAddress: newContractAddress,
				data: newData
			});
			result = 0;
		}
	}

	function callPending(bytes32 key) 
		returns (uint8 result) {
		if (pendingOnes[key].count > 0) {
			pendingOnes[key].count++;
			if (pendingOnes[key].contractAddress
					.call(pendingOnes[key].data)) {
				result = 1;
			} else {
				result = 2;
			}
		} else {
			throw;
		}
	}
}