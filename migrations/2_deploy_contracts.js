var TextStore = artifacts.require("./TextStore.sol");
var PendingCall = artifacts.require("./PendingCall.sol");

module.exports = function(deployer, network) {
    deployer.deploy([
        [ TextStore ],
        [ PendingCall ]
    ]);
};
