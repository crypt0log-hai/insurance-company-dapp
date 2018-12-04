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

    address owner;

    struct Client {
        string name;
        uint franchise;
        uint count; //Decompte
        bool isReached;
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
    mapping (address => Bill[]) public ownerToBills;
    //store bills that have been payed
    mapping(uint => bool) public billToPay;

    //Bill[] public bills;

    constructor() public payable {
        createClient("Luca Srdjenovic", (1 ether));
        createBill("Dentiste", 1 ether);
        createBill("Medecin", 5 ether);
        owner = msg.sender;
    }

    function createClient(string _name, uint _franchise) public {
        clients[msg.sender] = Client(_name, _franchise, 0, false);
    }

    function createBill(string _name, uint _cost ) private  {
        uint id = ownerBillCount[msg.sender];
        ownerBillCount[msg.sender]++;
        ownerToBills[msg.sender].push(Bill(id, _name, _cost, false));
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
      ownerToBills[msg.sender][_billId].isPayed =   billToPay[_billId];

      uint rest = (clients[msg.sender].count+ownerToBills[msg.sender][_billId].cost) - clients[msg.sender].franchise;
      //uint memory test  =

      //Insurance  pay 90 %
      if(clients[msg.sender].isReached == true)
      {
        billToOwner[_billId].transfer((ownerToBills[msg.sender][_billId].cost * 9) / 100);
      }

      //Insurance pay just the rest of the cost
      if((clients[msg.sender].count+ownerToBills[msg.sender][_billId].cost) >= clients[msg.sender].franchise && clients[msg.sender].isReached == false){
        clients[msg.sender].count = (clients[msg.sender].count+ownerToBills[msg.sender][_billId].cost) - rest;
        clients[msg.sender].isReached = true;
        billToOwner[_billId].transfer(rest);
      }

      //insurance pay nothing
      if(clients[msg.sender].count < clients[msg.sender].franchise && clients[msg.sender].count >= 0) {
        clients[msg.sender].count = clients[msg.sender].count + ownerToBills[msg.sender][_billId].cost;
      }
      //trigger billEvent
      emit PayedEvent(_billId);
    }

    function addBill(string _name, uint _cost) public {
      createBill(_name, _cost);
    }

}
