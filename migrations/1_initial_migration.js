var Insurance = artifacts.require("./Insurance.sol");

module.exports = function(deployer) {
  deployer.deploy(Insurance, {from:web3.eth.accounts[0], value: web3.toWei(10, 'ether')});
};
