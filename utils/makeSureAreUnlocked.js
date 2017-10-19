Promise = require("bluebird");
Promise.all = require("./sequentialPromise.js");
if (typeof web3.eth.signPromise !== "function") {
    Promise.promisifyAll(web3.eth, { suffix: "Promise" });
}

module.exports = function makeSureAreUnlocked(accounts) {
    const requests = [];
    accounts.forEach((account, index) => {
        requests.push(() => web3.eth.signPromise(
                account,
                "0x0000000000000000000000000000000000000000000000000000000000000000")
            .catch(error => {
                if (error.message == "account is locked") {
                    throw Error("account " + account + " at index " + index + " is locked");
                } else {
                    throw error;
                }
            }));
    });
    return Promise.all(requests);
}
