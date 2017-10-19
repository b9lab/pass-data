const Promise = require("bluebird");
const TextStore = artifacts.require("./TextStore.sol");
const PendingCall = artifacts.require("./PendingCall.sol");

const Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);
Promise.all = require("../utils/sequentialPromise.js");

contract('PendingCall', function(accounts) {

    let owner, requester;
    let textStore, pendingCall;

    before("should have unlocked accounts", () => {
        assert.isAtLeast(accounts.length, 2, "should have at least 2 account");
        [ owner, requester ] = accounts;
        return Extensions.makeSureAreUnlocked([ owner, requester ]);
    });

    beforeEach("should deploy a TextStore and a PendingCall", function() {
        return Promise.all([
                () => TextStore.new({ from: owner }),
                () => PendingCall.new({ from: owner })
            ])
            .then(createds => [ textStore, pendingCall ] = createds)
            .then(() => textStore.text())
            .then(text => assert.strictEqual(text, "", "should start as empty"));
    });

    it("should not expose internal function", function() {
        assert.strictEqual(typeof pendingCall.effectCall, "undefined", "should not be a function");
    });

    it("should return 0 if ask to call a non-existent pending", function() {
        const fakeKey = web3.sha3("Not a key");
        return pendingCall.callPending.call(fakeKey)
            .then(result => assert.strictEqual(result.toNumber(), 0, "should not have done call"));
    });

    describe("First time asking", function() {

        let callData;

        beforeEach("should prepare call data", function() {
            callData = textStore.contract.setText.getData("Hello World");
        });

        it("should return proper return values if ask the first time", function() {
            return pendingCall.pleaseCallOne.call(textStore.address, callData, { from: owner })
                .then(results => assert.strictEqual(results[1].toNumber(), 0));
        });

        it("should emit proper event if ask the first time", function() {
            let shaKey0;
            return pendingCall.pleaseCallOne.call(textStore.address, callData)
                .then(results => {
                    shaKey0 = results[0];
                    return pendingCall.pleaseCallOne(textStore.address, callData, { from: owner });
                })
                .then(txObject => {
                    assert.strictEqual(txObject.receipt.logs.length, 1);
                    const event0 = txObject.logs[0];
                    assert.strictEqual(event0.args.sender, owner);
                    assert.strictEqual(event0.args.key, shaKey0);
                    assert.strictEqual(event0.args.result.toNumber(), 0);
                });
        });

        it("should store a pending call if ask the first time", function() {
            return pendingCall.pleaseCallOne(textStore.address, callData, { from: owner })
                .then(txObject => pendingCall.pendingOnes(txObject.logs[0].args.key))
                .then(pendingOne => {
                    assert.strictEqual(pendingOne.length, 3, "should only have all data");
                    let [ count, contractAddress, data ] = pendingOne;
                    assert.strictEqual(count.toNumber(), 1, "should have only 1 call made");
                    assert.strictEqual(
                        contractAddress, textStore.address,
                        "should have saved the target address");
                    assert.strictEqual(data, callData, "should be the call data");
                });
        });

    });

    describe("Second time asking", function() {

        let callData, expectedCallData, shaKey0;

        beforeEach("should add a pending call", function() {
            callData = textStore.contract.setText.getData("Hello World");
            // Padding to 32 bytes
            expectedCallData = callData + "00000000000000000000000000000000000000000000000000000000";
            return pendingCall.pleaseCallOne(textStore.address, callData, { from: owner })
                .then(txObject => shaKey0 = txObject.logs[0].args.key);
        });

        it("should not be possible to ask to call by another key", function() {
            return pendingCall.callPending.call(web3.sha3("Not a key"))
                .then(result =>
                    assert.strictEqual(result.toNumber(), 0, "should not have gone through"));
        });

        [ "same", "different" ].forEach(who => {

            describe(who + " sender", function() {

                let sender;

                before("should set proper sender", function() {
                    sender = who == "same" ? owner : requester;
                });

                it("should return proper return values", function() {
                    return pendingCall.callPending.call(shaKey0, { from: sender })
                        .then(result => assert.strictEqual(result.toNumber(), 1, "should have gone through"))
                });

                it("should emit proper events when asking", function() {
                    return pendingCall.callPending(shaKey0, { from: sender })
                        .then(txObject => {
                            assert.strictEqual(txObject.logs.length, 1, "should have had only result logging event");
                            assert.strictEqual(txObject.receipt.logs.length, 2, "should have had 1 more event");
                            const event0 = textStore.LogTextSet().formatter(txObject.receipt.logs[0]);
                            assert.strictEqual(
                                event0.args.sender, pendingCall.address,
                                "should have been called from the contract");
                            assert.strictEqual(
                                event0.args.text,
                                "Hello World", "should be the asked text");
                            assert.strictEqual(
                                event0.args.data, expectedCallData,
                                "should match sent to textStore");
                            const event1 = txObject.logs[0];
                            assert.strictEqual(event1.args.sender, sender)
                            assert.strictEqual(event1.args.key, shaKey0);
                            assert.strictEqual(event1.args.result.toNumber(), 1);
                        });
                });

                it("should have increased the call count", function() {
                    return pendingCall.callPending(shaKey0, { from: sender })
                        .then(txObject => pendingCall.pendingOnes(shaKey0))
                        .then(pendingOne => assert.strictEqual(
                            pendingOne[0].toNumber(), 2,
                            "should have increased the call count"));
                });

                it("should have updated TextStore", function() {
                    return pendingCall.callPending(shaKey0, { from: sender })
                        .then(txObject => textStore.text())
                        .then(text => assert.strictEqual(text, "Hello World"));
                });

            });

        })

    });

});
