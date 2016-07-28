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

contract('PendingCall', function(accounts) {

  it("store should start with empty", function() {
    
    var store = TextStore.deployed();
    return store.text()
      .then(function(text) {
        assert.equal(text, "", "should be empty");
      });
  });

  it("should pass value only on second call", function() {

    var store = TextStore.deployed();
    var pendingCall = PendingCall.deployed();
    var data = store.contract.setText.getData("hello1");
    return pendingCall.pleaseCallOne.call(store.address, data, { gas: 1000000 })
      .then(function (result) {
        assert.equal(result[1].toNumber(), 0, "should be return value of pending");
        return pendingCall.pleaseCallOne(store.address, data, { gas: 1000000 });
      })
      .then(function (txn) {
        return web3.eth.getTransactionReceiptMined(txn);
      })
      .then(function (receipt) {
        return store.text();
      })
      .then(function (text) {
        assert.equal(text, "", "should not have been set");
        return pendingCall.pleaseCallOne.call(store.address, data, { gas: 1000000 } );
      })
      .then(function (result) {
        assert.equal(result[1].toNumber(), 1, "should be return value of passed-on with true");
        return pendingCall.pleaseCallOne(store.address, data, { gas: 1000000 });
      })
      .then(function (txn) {
        return web3.eth.getTransactionReceiptMined(txn);
      })
      .then(function (receipt) {
        return store.text();
      })
      .then(function (text) {
        assert.equal(text, "hello1", "should have been set");        
      });

  });

});
