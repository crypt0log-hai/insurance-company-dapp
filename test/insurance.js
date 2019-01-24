var Insurance = artifacts.require("./Insurance.sol");

contract("Insurance", function(accounts) {
  var insuranceInstance;

  it("initializes with 2 clients", function() {
    return Insurance.deployed().then(function(instance) {
      return instance.ownerClientCount("0x31a37df89d1789da93f4c661ead148b1c5644e10");
    }).then(function(count) {
      assert.equal(count, 2);
    });
  });


  it("it initializes the client 1 with the correct values", function() {
    return Insurance.deployed().then(function(instance) {
      return instance.clients(0);
    }).then(function(client) {
      assert.equal(client[0], 0, "contains the correct id");
      assert.equal(client[1], "Test1", "contains the correct name");
      assert.equal(client[2], (4.37 * 1e18), "contains the correct deductible");
      assert.equal(client[3], 0, "contains the correct amount");
      assert.equal(client[4], 0, "the deductible is not reached");
    });
  });

  it("it initializes the client 2 with the correct values", function() {
    return Insurance.deployed().then(function(instance) {
      return instance.clients(1);
    }).then(function(client) {
      assert.equal(client[0], 1, "contains the correct id");
      assert.equal(client[1], "Test2", "contains the correct name");
      assert.equal(client[2], (4.37 * 1e18), "contains the correct deductible");
      assert.equal(client[3], 0, "contains the correct amount");
      assert.equal(client[4], 0, "the deductible is not reached");
    });
  });
});
