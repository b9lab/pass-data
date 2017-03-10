var TextStore = artifacts.require("./TextStore.sol");
var PendingCall = artifacts.require("./PendingCall.sol");

Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('PendingCall', function(accounts) {

    var owner, requester;
    var textStore, pendingCall;

    before("should have enough ether", () => {
        assert.isAtLeast(accounts.length, 2, "should have at least 2 account");
        owner = accounts[0];
        requester = accounts[1];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy a TextStore and a PendingCall", function() {
        return Promise.all([
                TextStore.new({ from: owner }),
                PendingCall.new({ from: owner })
            ])
            .then(createds => {
                textStore = createds[0];
                pendingCall = createds[1];
                return textStore.text();
            })
            .then(text => assert.strictEqual(text, "", "should start as empty"));
    });

    it("should not expose internal function", function() {
        assert.strictEqual(typeof pendingCall.effectCall, "undefined", "should not be a function");
    });

    it("should return 0 if ask to call a non-existent pending", function() {
        var fakeKey = web3.sha3("Not a key");
        return pendingCall.callPending.call(fakeKey)
            .then(result => assert.strictEqual(result.toNumber(), 0, "should not have done call"));
    });

    it("should store a pending call if ask the first time", function() {
        var shaKey0;
        var callData = textStore.contract.setText.getData("Hello World");
        return pendingCall.pleaseCallOne.call(textStore.address, callData)
            .then(results => {
                shaKey0 = results[0];
                assert.strictEqual(results[1].toNumber(), 0);
                return pendingCall.pleaseCallOne(textStore.address, callData);
            })
            .then(txObject => pendingCall.pendingOnes(shaKey0))
            .then(pendingOne => {
                assert.strictEqual(pendingOne.length, 3, "should only have all data");
                assert.strictEqual(pendingOne[0].toNumber(), 1, "should have only 1 call made");
                assert.strictEqual(
                    pendingOne[1], textStore.address,
                    "should have saved the target address");
                assert.strictEqual(pendingOne[2], callData, "should be the call data");
            });
    });

    describe("Second time asking", function() {

        var callData, expectedCallData, shaKey0;

        beforeEach("should add a pending call", function() {
            callData = textStore.contract.setText.getData("Hello World");
            // Padding to 32 bytes
            expectedCallData = callData + "00000000000000000000000000000000000000000000000000000000";
            return pendingCall.pleaseCallOne.call(textStore.address, callData, { from: owner })
                .then(results => {
                    shaKey0 = results[0];
                    return pendingCall.pleaseCallOne(textStore.address, callData, { from: owner });
                });
        });

        it("should not be possible to ask to call by another key", function() {
            return pendingCall.callPending.call(web3.sha3("Not a key"))
                .then(result =>
                    assert.strictEqual(result.toNumber(), 0, "should not have gone through"));
        });

        it("should be possible to ask to call by key, same sender", function() {
            return pendingCall.callPending.call(shaKey0, { from: owner })
                .then(result => {
                    assert.strictEqual(result.toNumber(), 1, "should have gone through");
                    return pendingCall.callPending(shaKey0, { from: owner });
                })
                .then(txObject => {
                    assert.strictEqual(txObject.receipt.logs.length, 1, "should have had 1 event");
                    var event0 = textStore.OnTextSet().formatter(txObject.receipt.logs[0]);
                    assert.strictEqual(
                        event0.args.text,
                        "Hello World", "should be the asked text");
                    assert.strictEqual(
                        event0.args.data, expectedCallData,
                        "should match sent to textStore");
                    return pendingCall.pendingOnes(shaKey0);
                })
                .then(pendingOne => assert.strictEqual(
                    pendingOne[0].toNumber(), 2,
                    "should have increased the call count"));
        });

        it("should be possible to ask to call by key, other sender", function() {
            return pendingCall.callPending.call(shaKey0, { from: requester })
                .then(result => {
                    assert.strictEqual(result.toNumber(), 1, "should have gone through");
                    return pendingCall.callPending(shaKey0, { from: requester });
                })
                .then(txObject => {
                    assert.strictEqual(txObject.receipt.logs.length, 1, "should have had 1 event");
                    var event0 = textStore.OnTextSet().formatter(txObject.receipt.logs[0]);
                    assert.strictEqual(
                        event0.args.text,
                        "Hello World", "should be the asked text");
                    assert.strictEqual(
                        event0.args.data, expectedCallData,
                        "should match sent to textStore");
                    return pendingCall.pendingOnes(shaKey0);
                })
                .then(pendingOne => assert.strictEqual(
                    pendingOne[0].toNumber(), 2,
                    "should have increased the call count"));
        });

        it("should be possible to ask to call by same values, same sender", function() {
            return pendingCall.pleaseCallOne.call(textStore.address, callData, { from: owner })
                .then(result => {
                    assert.strictEqual(result[1].toNumber(), 1, "should have gone through");
                    return pendingCall.pleaseCallOne(textStore.address, callData, { from: owner });
                })
                .then(txObject => {
                    assert.strictEqual(txObject.receipt.logs.length, 1, "should have had 1 event");
                    var event0 = textStore.OnTextSet().formatter(txObject.receipt.logs[0]);
                    assert.strictEqual(
                        event0.args.text,
                        "Hello World", "should be the asked text");
                    assert.strictEqual(
                        event0.args.data, expectedCallData,
                        "should match sent to textStore");
                    return pendingCall.pendingOnes(shaKey0);
                })
                .then(pendingOne => assert.strictEqual(
                    pendingOne[0].toNumber(), 2,
                    "should have increased the call count"));
        });

        it("should be possible to ask to call by same values, other sender", function() {
            return pendingCall.pleaseCallOne.call(textStore.address, callData, { from: requester })
                .then(result => {
                    assert.strictEqual(result[1].toNumber(), 1, "should have gone through");
                    return pendingCall.pleaseCallOne(textStore.address, callData, { from: requester });
                })
                .then(txObject => {
                    assert.strictEqual(txObject.receipt.logs.length, 1, "should have had 1 event");
                    var event0 = textStore.OnTextSet().formatter(txObject.receipt.logs[0]);
                    assert.strictEqual(
                        event0.args.text,
                        "Hello World", "should be the asked text");
                    assert.strictEqual(
                        event0.args.data, expectedCallData,
                        "should match sent to textStore");
                    return pendingCall.pendingOnes(shaKey0);
                })
                .then(pendingOne => assert.strictEqual(
                    pendingOne[0].toNumber(), 2,
                    "should have increased the call count"));
        });

    });

});
