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
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
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
      console.log(client[1]);

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

      for (var i = 0; i < billCount; i++) {
        insuranceInstance.bills(i).then(function(bill){
          var temp = i-1;
          var id = temp;
          var name = bill[0];
          var cost = bill[1];
          var isPayed = bill[2];

          //Render candidate billResults
          var billTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + cost + "</td><td>" + isPayed + "</td></tr>";
          billResults.append(billTemplate);
        });
      }

      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function(adopters, account) {
    /*
     * Replace me...
     */
  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    /*
     * Replace me...
     */
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
