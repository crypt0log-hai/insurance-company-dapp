pragma solidity ^0.4.24;

contract Insurance {

    event NewBill(uint billId, string name, uint cost, bool isPayed);

    struct Client {
        string name;
        uint franchise;
        uint count; //Decompte
    }

    struct Bill {
        string name;
        uint cost;
        bool isPayed;
    }

    mapping (uint => address) public billToOwner;
    mapping (address => Client) public clients;
    mapping (address => uint) public ownerBillCount;

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
        uint id = bills.push(Bill(_name, _cost, false)) - 1;
        billToOwner[id] = msg.sender;
        ownerBillCount[msg.sender]++;
        emit NewBill(id, _name, _cost, false);
    }
}
