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
    address doctor;

    struct Client {
        uint id;
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

    mapping (uint => address) public clientToAddress;
    mapping (uint => address) public billToOwner;
    mapping (address => Client) public clientAccounts;
    mapping (address => uint) public clientBillCount;

    mapping (address => Bill[]) public ownerToBills;
    //store bills that have been payed
    mapping(uint => bool) public billToPay;


    mapping(address => uint) public ownerClientCount;
    Client[] public clients;

    constructor(address _doctor) public payable {
        owner = msg.sender;
        doctor = _doctor;
    }

    function createClient(address _address, string _name, uint _franchise) public {
        uint id = ownerClientCount[owner];
        ownerClientCount[owner]++;
        clientAccounts[_address] = Client(id, _name, _franchise, 0, false);
        clients.push(clientAccounts[_address]);
        clientToAddress[id] = _address;
    }

    function createBill(address _address, string _name, uint _cost ) private  {
        uint id = clientBillCount[_address];
        clientBillCount[_address]++;
        ownerToBills[_address].push(Bill(id, _name, _cost, false));
        billToOwner[id] = _address;

        emit AddedBill(id, _name, _cost, false);
    }

    function payBill(uint _billId) public payable {
      //require that the bill belongs to the client
      require(billToOwner[_billId] == msg.sender);

      //require a valid bill
      require(_billId >= 0 && _billId <= clientBillCount[msg.sender]);
      //record that client has payed the bill
      require(billToPay[_billId] == false);



      billToPay[_billId] = true;
      ownerToBills[msg.sender][_billId].isPayed =   billToPay[_billId];

      uint rest = (clientAccounts[msg.sender].count+ownerToBills[msg.sender][_billId].cost) - clientAccounts[msg.sender].franchise;
      uint clientToPay = ownerToBills[msg.sender][_billId].cost - rest;

      //Insurance transfer the cost bill to the doctor address
      //doctor.transfer(ownerToBills[msg.sender][_billId].cost);

      //Insurance  pay 90 % to the doctor address client has to pay 10 % for the insuranced
      if(clientAccounts[msg.sender].isReached == true)
      {
        clientAccounts[msg.sender].count += (ownerToBills[msg.sender][_billId].cost * 10) / 100;

        //Insurance transfer to client 90%
        billToOwner[_billId].transfer((ownerToBills[msg.sender][_billId].cost * 90) / 100);

        //Client pay to doctor 90% + 10% from himself
        doctor.transfer(msg.value);
      }

      //Insurance pay just the 90 % rest of the cost
      if((clientAccounts[msg.sender].count+ownerToBills[msg.sender][_billId].cost) >= clientAccounts[msg.sender].franchise && clientAccounts[msg.sender].isReached == false){
        clientAccounts[msg.sender].count += clientToPay + ((rest*10)/100);
        clientAccounts[msg.sender].isReached = true;

        //Insurance transfer 90% of the rest bill
        billToOwner[_billId].transfer((rest * 90) / 100);

        //Client pay to doctor 90% of the rest + 10% from rest himself
        doctor.transfer(msg.value);
      }

      //insurance pay nothing
      if(clientAccounts[msg.sender].count < clientAccounts[msg.sender].franchise && clientAccounts[msg.sender].count >= 0) {
        clientAccounts[msg.sender].count = clientAccounts[msg.sender].count + ownerToBills[msg.sender][_billId].cost;
        doctor.transfer(msg.value);
      }

      //
      clients[clientAccounts[msg.sender].id] = clientAccounts[msg.sender];
      //trigger billEvent
      emit PayedEvent(_billId);
    }

    function addBill(address _address, string _name, uint _cost) public {
      createBill(_address, _name, _cost);
    }

    function getContractBalance() external view returns(uint) {
      return address(this).balance;
    }


}
