pragma solidity ^0.4.24;

contract Ownable {
  address owner;

  modifier onlyOwnbale {
    require(msg.sender == owner);
    _;
  }
}

contract Insurance {


    event AddedBill(uint billId, string name, uint cost, bool isPayed);
    event PayedEvent(uint indexed billId);

    uint convertToEther = 1 ether;

    struct Client {
        string name;
        uint franchise;
        uint count; //Decompte
    }

    struct Bill {
        uint id;
        string name;
        uint cost;
        bool isPayed;
    }


    //Table of balance
    mapping(address => uint) public balances;

    mapping (uint => address) public billToOwner;
    mapping (address => Client) public clients;
    mapping (address => uint) public ownerBillCount;
    //store bills that have been payed
    mapping(uint => bool) public billToPay;

    Bill[] public bills;

    constructor() public payable {
        createClient("Luca Srdjenovic", 10);
        createBill("Dentiste", 2);
        createBill("Medecin", 4);

        address(this).transfer(msg.value);
    }

    function createClient(string _name, uint _franchise) private {
        clients[msg.sender] = Client(_name, _franchise, 0);
    }

    function createBill(string _name, uint _cost) private  {
        uint id = ownerBillCount[msg.sender];
        ownerBillCount[msg.sender]++;
        bills.push(Bill(id, _name, _cost, false));
        billToOwner[id] = msg.sender;

        emit AddedBill(id, _name, _cost, false);
    }

    function payBill(uint _billId) public payable {
      //require that the bill belongs to the client
      require(billToOwner[_billId] == msg.sender);

      //require a valid bill
      require(_billId >= 0 && _billId <= ownerBillCount[msg.sender]);
      //record that client has payed

      require(billToPay[_billId] == false);

      billToPay[_billId] = true;
      bills[_billId].isPayed =   billToPay[_billId];

      clients[msg.sender].count = clients[msg.sender].count + bills[_billId].cost;

      //update client count
      if(clients[msg.sender].count >= clients[msg.sender].franchise){
        //l'assurance envoie l'argent
        billToOwner[_billId].transfer(address(this).balance);
      }else {
      }

      //trigger billEvent
      emit PayedEvent(_billId);
    }

    function addBill(string _name, uint _cost) public {
      createBill(_name, _cost);
    }

}
