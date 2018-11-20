pragma solidity ^0.4.24;

contract Insurance {

    event NewBill(uint billId, string name, uint cost, bool isPayed);

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

    mapping (uint => address) public billToOwner;
    mapping (address => Client) public clients;
    mapping (address => uint) public ownerBillCount;
    //store bills that have been payed
    mapping(uint => bool) public billToPay;

    Bill[] public bills;

    constructor() public {
        createClient("Luca Srdjenovic", 10);
        createBill("Dentiste", 2);
        createBill("Medecin", 4);
    }

    function createClient(string _name, uint _franchise) private {
        clients[msg.sender] = Client(_name, _franchise, 0);
    }

    function createBill(string _name, uint _cost) private {
        ownerBillCount[msg.sender]++;
        uint id = ownerBillCount[msg.sender];
        bills.push(Bill(id, _name, _cost, false));
        billToOwner[id] = msg.sender;

        emit NewBill(id, _name, _cost, false);
    }

    function payBill(uint _billId) public {
      //require that the bill belongs to the client
      require(billToOwner[_billId] == msg.sender);

      //require a valid bill
      require(_billId > 0 && _billId <= ownerBillCount[msg.sender]);
      //record that client has payed

      require(billToPay[_billId] == false);
      billToPay[_billId] = true;
      bills[_billId].isPayed =   billToPay[_billId];

      clients[msg.sender].count = clients[msg.sender].count + bills[_billId].cost;

      //update client count
    }
}
