const TextStore = artifacts.require("./TextStore.sol");

const Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('TextStore', function(accounts) {

    let owner, textStore;

    before("should have unlocked accounts", () => {
        assert.isAtLeast(accounts.length, 1, "should have at least 1 account");
        owner = accounts[0];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy a TextStore", function() {
        return TextStore.new({ from: owner })
            .then(created => textStore = created)
            .then(() => textStore.text())
            .then(text => assert.strictEqual(text, "", "should start as empty"));
    });

    describe("with function call", function() {

        it("should return proper return data", function() {
            return textStore.setText.call("Hello World", { from: owner })
                .then(success => assert.isTrue(success, "should have allowed"));
        });

        it("should create proper event on store", function() {
            const callData = textStore.contract.setText.getData("Hello World");
            return textStore.setText("Hello World", { from: owner })
                .then(txObject => {
                    assert.strictEqual(txObject.logs.length, 1, "should have had 1 event");
                    const event0 = txObject.logs[0];
                    assert.strictEqual(
                        event0.args.sender, owner,
                        "should have been called from the contract");
                    assert.strictEqual(event0.args.text, "Hello World", "should be the text passed");
                    assert.strictEqual(event0.args.data, callData, "should be the call data");
                });
        });

        it("should update value on store", function() {
            return textStore.setText("Hello World", { from: owner })
                .then(txObject => textStore.text())
                .then(text => assert.strictEqual(text, "Hello World", "should be set"));
        });

    });

    describe("with call data", function() {
        
        it("should return proper return data when using call data", function() {
            const callData = textStore.contract.setText.getData("Hello World");
            return web3.eth.callPromise({
                    to: textStore.address,
                    data: callData
                })
                .then(returned => assert.strictEqual(
                    web3.toBigNumber(returned).toString(10), "1",
                    "should have returned true"));
        });

        it("should create proper event when using call data", function() {
            const callData = textStore.contract.setText.getData("Hello World");
            return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: textStore.address,
                    data: callData,
                    gas: 500000
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => {
                    assert.strictEqual(receipt.logs.length, 1, "should have had 1 event");
                    const event0 = textStore.LogTextSet().formatter(receipt.logs[0]);
                    assert.strictEqual(
                        event0.args.sender, owner,
                        "should have been called from the contract");
                    assert.strictEqual(event0.args.text, "Hello World", "should be the text passed");
                    assert.strictEqual(event0.args.data, callData, "should be the call data");
                });
        });

        it("should be able to store with call data", function() {
            const callData = textStore.contract.setText.getData("Hello World");
            return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: textStore.address,
                    data: callData,
                    gas: 500000
                })
                .then(web3.eth.getTransactionReceiptMined)
                .then(receipt => textStore.text())
                .then(text => assert.strictEqual(text, "Hello World", "should be set"));
        });

    });

    it("should create proper event on fallback", function() {
        const callData = "0x00112233";
        return web3.eth.sendTransactionPromise({
                from: owner,
                to: textStore.address,
                data: callData,
                gas: 500000
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                assert.strictEqual(receipt.logs.length, 1, "should have had 1 event");
                const event0 = textStore.LogFallback().formatter(receipt.logs[0]);
                assert.strictEqual(
                    event0.args.sender, owner,
                    "should have been called from the contract");
                assert.strictEqual(event0.args.data, callData, "should be the call data");
            });
    });

});
