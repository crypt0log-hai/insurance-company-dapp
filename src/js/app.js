var chfToEther = 0.0090168;

// 1 ether = 116.63
var etherToCHF = 110.90;

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
      var franchise = Number((web3.fromWei(client[1], 'ether').toFixed(6)));
      var count = Number((web3.fromWei(client[2], 'ether').toFixed(6)));


      var franchiseCHF = Number((franchise * etherToCHF).toFixed(0));

      var countCHF = Number((count * etherToCHF).toFixed(2));


      //var walletCHF = Number((wallet * etherToCHF).toFixed(2));

      var clientTemplate = "<tr><td>" + name + '</td><td id="franchise">' + franchiseCHF + '</td><td id="franchiseCHF">' + franchise + '</td><td id="count">' + countCHF +'</td><td id="countCHF">'+ count + "</td><td id='wallet'>" + "</td></tr>";
      clientResult.append(clientTemplate);

      App.getBalance();



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
        insuranceInstance.ownerToBills(App.account, i).then(function(bill){
        //insuranceInstance.bills(i).then(function(bill){

          var id = bill[0];
          var name = bill[1];
          var cost = Number((web3.fromWei(bill[2], 'ether').toFixed(6)));

          var isPayed = bill[3];
          var costCHF = Number((((cost * etherToCHF)/5).toFixed(2)* 5).toFixed(2));//https://www.coingecko.com/fr/graphiques_cours/ethereum/chf

          //Render candidate billResults
          var billTemplate = "";



          var billOption = "<option value='" + id + "'>" + name + "</ option>"
          if(isPayed == false) {
            billTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + costCHF + "</td><td>" + cost + "</td><td><font color='red'>Unpayed</font></td><td>";
            billSelect.append(billOption);
          } else {
            billTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + costCHF + "</td><td>" + cost + "</td><td><font color='green'>Payed</font></td></tr>";
          }
            billResults.append(billTemplate);
        });
      }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  createClient: function() {
    var clientName = $("#clientName").val();
    var franchiseSelect = $("#franchiseSelect").val();
    console.log(franchiseSelect);


    // 1 chf = 0.0089 ether

    franchiseSelect = franchiseSelect * chfToEther * Math.pow(10, 18);

    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.createClient(clientName, franchiseSelect);
    }).then(function(result) {
      console.log("Client created");
    }).catch(function(error) {
      console.warn(error);
    });
  },

  pay: function() {
    var billId = $("#billSelect").val();


    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.ownerToBills(App.account, billId);
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
        value: cost,
        from: App.account
      });
    }).then(function(result) {
          console.log("here");
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

    // 1 chf = 0.0089 ether
    billCost = billCost * chfToEther * Math.pow(10, 18);


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
  },

  getBalance: function() {
    var wallet = $("#wallet");
    var wei, balance

    try {
        web3.eth.getBalance(App.account, function(error, wei) {
          if (!error) {
            var balance = web3.fromWei(wei, 'ether');
            console.log(balance);
            wallet.text(balance.toFixed(2));
          }
        })
      ;
    } catch (err) {
      console.error(err);
    };
  }

};



$(function() {
  $(window).load(function() {
    App.init();
  });
});
