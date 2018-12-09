var Insurance = artifacts.require("./Insurance.sol");

module.exports = function(deployer) {
  deployer.deploy(Insurance, '0x3600e0c2da8a936c970d3f9e08b693c984cfa68f', { value: 50 * 1e18});
};
