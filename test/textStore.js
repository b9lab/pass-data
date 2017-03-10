var TextStore = artifacts.require("./TextStore.sol");

Extensions = require("../utils/extensions.js");
Extensions.init(web3, assert);

contract('TextStore', function(accounts) {

    var owner, textStore;

    before("should have enough ether", () => {
        assert.isAtLeast(accounts.length, 1, "should have at least 1 account");
        owner = accounts[0];
        return Extensions.makeSureAreUnlocked([ owner ]);
    });

    beforeEach("should deploy a TextStore", function() {
        return TextStore.new({ from: owner })
            .then(created => {
                textStore = created;
                return textStore.text();
            })
            .then(text => assert.strictEqual(text, "", "should start as empty"));
    });

    it("should be able to store", function() {
        var callData = textStore.contract.setText.getData("Hello World");
        return textStore.setText.call("Hello World", { from: owner })
            .then(success => {
                assert.isTrue(success, "should have allowed");
                return textStore.setText("Hello World", { from: owner });
            })
            .then(textObject => {
                assert.strictEqual(textObject.logs.length, 1, "should have had 1 event");
                var event0 = textObject.logs[0];
                assert.strictEqual(event0.args.text, "Hello World", "should be the text passed");
                assert.strictEqual(event0.args.data, callData, "should be the call data");
                return textStore.text();
            })
            .then(text => assert.equal(text, "Hello World", "should be set"));
    });

    it("should be able to store with call data", function() {
        var callData = textStore.contract.setText.getData("Hello World");
        return web3.eth.callPromise({
                to: textStore.address,
                data: callData
            })
            .then(returned => {
                assert.strictEqual(
                    web3.toBigNumber(returned).toString(10), "1",
                    "should have returned true");
                return web3.eth.sendTransactionPromise({
                    from: owner,
                    to: textStore.address,
                    data: callData,
                    gas: 500000
                });
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                assert.strictEqual(receipt.logs.length, 1, "should have had 1 event");
                var event0 = textStore.OnTextSet().formatter(receipt.logs[0]);
                assert.strictEqual(event0.args.text, "Hello World", "should be the text passed");
                assert.strictEqual(event0.args.data, callData, "should be the call data");
                return textStore.text();
            })
            .then(text => assert.equal(text, "Hello World", "should be set"));
    });

    it("should be possible to trigger fallback", function() {
        var callData = "0x00112233";
        return web3.eth.sendTransactionPromise({
                from: owner,
                to: textStore.address,
                data: callData,
                gas: 500000
            })
            .then(web3.eth.getTransactionReceiptMined)
            .then(receipt => {
                assert.strictEqual(receipt.logs.length, 1, "should have had 1 event");
                var event0 = textStore.OnTextSet().formatter(receipt.logs[0]);
                assert.strictEqual(event0.args.text, "fallback", "should be from the fallback");
                assert.strictEqual(event0.args.data, callData, "should be the call data");
                return textStore.text();
            })
            .then(text => assert.equal(text, "", "should still be unset"));
    });

});
