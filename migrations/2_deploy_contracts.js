module.exports = function(deployer, network) {
 	deployer.deploy([
		[ TextStore, { gas: 500000 } ],
		[ PendingCall, { gas: 1000000 } ]
	]);
};
