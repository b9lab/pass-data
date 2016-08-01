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

var expectedExceptionPromise = function (action, gasToUse) {
  return new Promise(function (resolve, reject) {
      try {
        resolve(action());
      } catch(e) {
        reject(e);
      }
    })
    .then(function (txn) {
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      // We are in Geth
      assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
    })
    .catch(function (e) {
      if ((e + "").indexOf("invalid JUMP") > -1) {
        // We are in TestRPC
      } else {
        throw e;
      }
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

  it("should throw if trying to make the second call without first", function() {

    var store = TextStore.deployed();
    var pendingCall = PendingCall.deployed();
    var data = store.contract.setText.getData("hello2");

    return expectedExceptionPromise(
        function () { return pendingCall.callPending(store.address, data, { gas: 1000000 }); },
        1000000);

  });

  it("should be possible to make the second call with the hash only", function() {

    var store = TextStore.deployed();
    var pendingCall = PendingCall.deployed();
    var data = store.contract.setText.getData("hello3");
    var key;

    return pendingCall.pleaseCallOne.call(store.address, data, { gas: 1000000 })
      .then(function (result) {
        key = result[0];
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
        assert.equal(text, "hello1", "should still be a previous value");
        return pendingCall.callPending.call(key, { gas: 1000000 } );
      })
      .then(function (result) {
        assert.equal(result.toNumber(), 1, "should be return value of passed-on with true");
        return pendingCall.callPending(key, { gas: 1000000 });
      })
      .then(function (txn) {
        return web3.eth.getTransactionReceiptMined(txn);
      })
      .then(function (receipt) {
        return store.text();
      })
      .then(function (text) {
        assert.equal(text, "hello3", "should have been set");        
      });

  });

});
