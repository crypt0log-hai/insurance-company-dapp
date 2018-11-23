App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }

    return App.initContract();

  },



  initContract: function() {
    $.getJSON("Insurance.json", function(insurance) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Insurance = TruffleContract(insurance);
      // Connect provider to interact with contract
      App.contracts.Insurance.setProvider(App.web3Provider);


      return App.render();
    });
  },

  bindEvents: function() {
    App.contracts.Insurance.deployed().then(function(instance) {
      instance.PayedEvent({}, {
        fromBlock:'0',
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered, bill payed", event);
      });
    });

    App.contracts.Insurance.deployed().then(function(instance) {
      instance.AddedBill({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered, bill added", event);
      });
    });

    App.render();
  },

  render: function() {
    var insuranceInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    //Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $("#accountAddress").html("Your account -> " + account);
      }
    });

    //Load contract client data
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.clients(App.account);
    }).then(function(client) {
      var clientResult = $("#clientResult");
      clientResult.empty();

      var name = client[0];
      var franchise = client[1];
      var count = client[2];
      var clientTemplate = "<tr><th>" + name + "</th><td>" + franchise + "</td><td>" + count + "</td></tr>";
      clientResult.append(clientTemplate);



    });

    //Load contract bil data
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.ownerBillCount(App.account);
    }).then(function(billCount) {
      var billResults = $("#billResults");
      billResults.empty();

      var billSelect = $("#billSelect");
      billSelect.empty();

      for (var i = 0; i < billCount; i++) {
        insuranceInstance.bills(i).then(function(bill){
          var id = bill[0];
          var name = bill[1];
          var cost = bill[2];
          var isPayed = bill[3];

          //Render candidate billResults
          var billTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + cost + "</td><td>" + isPayed + '</td><td><button type="submit" class="btn btn-primary">Pay</button></td></tr>';
          billResults.append(billTemplate);

          var billOption = "<option value='" + id + "'>" + name + "</ option>"
          if(isPayed == false) {
            billSelect.append(billOption);
          }
        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  pay: function() {
    var billId = $("#billSelect").val();
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.bills(billId);
    }).then(function(bill) {
      console.log(bill);
      App.payBill(billId, bill[2]);
    }).catch(function(error) {
      console.warn(error);
    });
  },

  payBill: function(billId, cost) {
    console.log("here");
    App.contracts.Insurance.deployed().then(function(instance) {
        console.log("here2");
      instanceInsurance = instance;
      return instanceInsurance.payBill(billId, {
        value: web3.toWei(cost, 'ether'),
        from: App.account});
    }).then(function(result) {
          console.log("here3");
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });

  },


  addBill: function() {
    var billName = $("#billName").val();
    var billCost = $("#costName").val();

    App.contracts.Insurance.deployed().then(function(instance) {
      instanceInsurance = instance;
      return instance.addBill(billName, billCost, {from: App.account});
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  }

};



$(function() {
  $(window).load(function() {
    App.init();
  });
});
