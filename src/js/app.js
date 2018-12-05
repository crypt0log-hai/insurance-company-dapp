var chfToEther = 0.0090168;

// 1 ether = 116.63
var etherToCHF = 110.90;

var boolCreate = false;

var loader = $("#loader");
var content = $("#content");
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

    var contentClient = $("#contentClient");
    var contentCreateClient = $("#contentCreateClient");
    var contentBillList = $("#contentBillList");
    var contentClientPay = $("#contentClientPay");
    var contentAddBill = $("#contentAddBill");
    var contentClientList = $("#contentClientList");


    loader.show();
    content.hide();

    //Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        $("#accountAddress").html("Your account -> " + account);
        App.getBalance();

        console.log(App.account);
        if(App.account == '0x31a37df89d1789da93f4c661ead148b1c5644e10') {
          // render for owner
          console.log("account -> owner");
          $('#title').html("Welcome Insurer");
          contentBillList.hide();
          contentClientPay.hide();
          contentAddBill.hide();
          contentClient.hide();

          App.renderOwner();

        } else if (App.account == '0x3600e0c2da8a936c970d3f9e08b693c984cfa68f') {
          // render for the doctor
          console.log("Account -> doctor");
          $('#title').html("Welcome Doctor")
          contentClient.hide();
          contentCreateClient.hide();
          contentBillList.hide();
          contentClientPay.hide();
          contentClientList.hide();

          App.renderDoctor();




        } else {
          // render for the client
          console.log("Account -> client");
          $('#title').html("Welcome Insured");
          contentCreateClient.hide();
          contentAddBill.hide();
          contentClientList.hide();

          App.renderClient();
        }
      }
    });

    loader.hide();
    content.show();
  },

  renderOwner: function() {

    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.ownerClientCount(App.account);
    }).then(function(clientCount) {
      console.log("test");
      var listClientResult = $("#listClientResult");
      listClientResult.empty();
      for (var i = 0; i < clientCount; i++) {
        insuranceInstance.clients(i).then(function(client){
          console.log(client);
        var id = client[0];
        var name = client[1];
        console.log(name);
        var franchise = Number((web3.fromWei(client[2], 'ether').toFixed(6)));
        var count = Number((web3.fromWei(client[3], 'ether').toFixed(6)));
        console.log("count ->" + count);
        var franchiseCHF = Number((franchise * etherToCHF).toFixed(0));
        var countCHF = Number((count * etherToCHF).toFixed(2));


        var isReached = client[4];

        console.log(isReached);

        if(isReached == false){
          var clientTemplate = "<tr><td id='idClient'>"  + id + '</td><td id="name">' + name + '</td><td id="franchise">' + franchiseCHF + '</td><td id="franchiseCHF">' + franchise + '</td><td id="count">' + countCHF +'</td><td id="countCHF">'+ count + "</td><td style='color:#FF0000';>Unreached</td></tr>";
        } else {
          var clientTemplate = "<tr><td id='idClient'>" + id + '</td><td id="name">' + name + '</td><td id="franchise">' + franchiseCHF + '</td><td id="franchiseCHF">' + franchise + '</td><td id="count">' + countCHF +'</td><td id="countCHF">'+ count + "</td><td style='color:#00FF00';>Reached</td></tr>";
        }

        listClientResult.append(clientTemplate);
        });

      }
    }).catch(function(error) {
      console.warn(error);
    });
  },

  renderDoctor: function() {

    //Load client account
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.ownerClientCount('0x31a37df89d1789da93f4c661ead148b1c5644e10');
    }).then(function(clientCount) {
      var clientSelect = $("#clientSelect");
      clientSelect.empty();

      for (var i = 0; i < clientCount; i++) {
        insuranceInstance.clients(i).then(function(client){


        var id = client[0];
        var name = client[1];
        insuranceInstance.clientToAddress(id).then(function(address)
        {
          console.log(address);
          var billOption = "<option value='" + address + "'>" + name + "</ option>"
          clientSelect.append(billOption);
        });
        });
      }
    }).catch(function(error) {
      console.warn(error);
    });

  },


  renderClient: function(){
    console.log("test");
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.clientAccounts(App.account);
    }).then(function(client) {
      console.log(client);
                    var clientResult = $("#clientResult");
      clientResult.empty();

      var name = client[1];
      var franchise = Number((web3.fromWei(client[2], 'ether').toFixed(6)));
      var count = Number((web3.fromWei(client[3], 'ether').toFixed(6)));
      var franchiseCHF = Number((franchise * etherToCHF).toFixed(0));
      var countCHF = Number((count * etherToCHF).toFixed(2));

      var clientTemplate = "<tr><td>" + name + '</td><td id="franchise">' + franchiseCHF + '</td><td id="franchiseCHF">' + franchise + '</td><td id="count">' + countCHF +'</td><td id="countCHF">'+ count + "</td><td id='wallet'>" + "</td></tr>";
      clientResult.append(clientTemplate);

    });


    //Load contract bil data
    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.clientBillCount(App.account);
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
    }).catch(function(error) {
      console.warn(error);
    });
  },

  createClient: function() {
    var clientName = $("#clientName").val();
    var franchiseSelect = $("#franchiseSelect").val();
    var clientAddress = $("#clientAddress").val();

    franchiseSelect = franchiseSelect * chfToEther * Math.pow(10, 18);

    App.contracts.Insurance.deployed().then(function(instance) {
      insuranceInstance = instance;
      return insuranceInstance.createClient(clientAddress, clientName, franchiseSelect);
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
    App.contracts.Insurance.deployed().then(function(instance) {
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
    var clientAddress = $("#clientSelect").val();
    var billDate = $("#billDate").val();
    var billCost = $("#billCost").val();
    console.log(billDate);

    // 1 chf = 0.0089 ether
    billCost = billCost * chfToEther * Math.pow(10, 18);


    App.contracts.Insurance.deployed().then(function(instance) {
      instanceInsurance = instance;
      return instance.addBill(clientAddress, billDate, billCost, {from: App.account});
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.error(err);
    });
  },

  getBalance: function() {

    try {
        web3.eth.getBalance(App.account, function(error, wei) {
          if (!error) {
            var balance = web3.fromWei(wei, 'ether');
            $("#accountWallet").html("Your wallet -> " + balance.toFixed(2) + " ETH");
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
