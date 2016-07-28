module.exports = function(deployer, network) {
	deployer.deploy(Migrations, { gas: 3000000 });
};
