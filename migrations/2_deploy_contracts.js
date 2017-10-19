const TextStore = artifacts.require("./TextStore.sol");
const PendingCall = artifacts.require("./PendingCall.sol");

module.exports = function(deployer, network) {
    deployer.deploy([
        [ TextStore ],
        [ PendingCall ]
    ]);
};
