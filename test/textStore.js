web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval |= 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        try {
            var receipt = web3.eth.getTransactionReceipt(txnHash);
            if (receipt == null) {
                setTimeout(function () {
                    transactionReceiptAsync(txnHash, resolve, reject);
                }, interval);
            } else {
                resolve(receipt);
            }
        } catch(e) {
            reject(e);
        }
    };

    return new Promise(function (resolve, reject) {
        transactionReceiptAsync(txnHash, resolve, reject);
    });
};

contract('TextStore', function(accounts) {

  it("should start with empty", function() {
    
    var store = TextStore.deployed();
    return store.text()
      .then(function(text) {
        assert.equal(text, "", "should be empty");
      });
      
  });

  it("should be able to store", function() {

    var store = TextStore.deployed();
    return store.setText.call("hello1", { from: accounts[0] })
      .then(function (success) {
        assert.isTrue(success, "should have allowed");
        return store.setText("hello1", { from: accounts[0] });
      })
      .then(function (txn) {
        return web3.eth.getTransactionReceiptMined(txn);
      })
      .then(function (receipt) {
        return store.text();
      })
      .then(function(text) {
        assert.equal(text, "hello1", "should be set");
      });

  });

  it("should be able to store with call data", function() {

    var store = TextStore.deployed();
    return store.setText.call("hello2", { from: accounts[0] })
      .then(function (success) {
        assert.isTrue(success, "should have allowed");
        return web3.eth.sendTransaction({
          from: accounts[0],
          to: store.address,
          data: store.contract.setText.getData("hello2"),
          gas: 500000
        });
      })
      .then(function (txn) {
        return web3.eth.getTransactionReceiptMined(txn);
      })
      .then(function (receipt) {
        return store.text();
      })
      .then(function(text) {
        assert.equal(text, "hello2", "should be set");
      });

  });

});
