pragma solidity ^0.4.24;
import "./Safemath.sol";
import "./ERC20.sol";
import "./Ownable.sol";

contract Insurance is Ownable {


    using SafeMath for uint256;

    event AddedBill(uint billId, string name, uint cost, bool isPayed);
    event PayedEvent(uint indexed billId);

    address doctor;
    uint previousState;


    struct Client {
        uint id;
        string name;
        uint franchise;
        uint amount; //Decompte
        bool isReached;
    }

    struct Bill {
        uint id;
        string name;
        uint cost;
        bool isPayed;
        uint payByInsurance;
        uint payByClient;
        address to;
        address from;
    }
    modifier onlyDoctor() {
      if (msg.sender == doctor)
        _;
    }



    // Table of client address
    mapping (uint => address) public clientToAddress;
    // table of bill id. return a client
    mapping (uint => address) public billToOwner;
    // Table of client
    mapping (address => Client) public clientAccounts;
    // Table of the count of client bill
    mapping (address => uint) public clientBillCount;
    // Each client get a table of bill
    mapping (address => Bill[]) public ownerToBills;
    // Get the total of client for the owner address
    mapping(address => uint) public ownerClientCount;

    Client[] public clients;

    constructor(address _doctor) public payable {
        doctor = _doctor;
        createClient(0x89619B2cd82f27487159A4f3Fa497F8394C41955, "Test1", (4.37 *  1 ether));
        createClient(0xA3785455b8Ee4debF641B66DBACE4E8Fd5a5b17F, "Test2", (4.37 *  1 ether));
        previousState = msg.value;
    }

    function createClient(address _address, string _name, uint _franchise) public onlyOwner {
        uint id = ownerClientCount[owner];
        //ownerClientCount[owner]++;
        ownerClientCount[owner] = ownerClientCount[owner].add(1);
        clientAccounts[_address] = Client(id, _name, _franchise, 0, false);
        clients.push(clientAccounts[_address]);
        clientToAddress[id] = _address;
    }

    function createBill(address _address, string _name, uint _cost ) private  {
        uint id = clientBillCount[_address];
        //clientBillCount[_address]++;
        clientBillCount[_address] = clientBillCount[_address].add(1);
        ownerToBills[_address].push(Bill(id, _name, _cost, false, 0, 0, _address, doctor));

        emit AddedBill(id, _name, _cost, false);
    }

    function payBill(uint _billId) public payable {

      //require that the bill belongs to the client
      require(ownerToBills[msg.sender][_billId].to == msg.sender);

      //require a valid bill
      require(_billId >= 0 && _billId <= clientBillCount[msg.sender]);

      //Verify that the bill is unpayed
      require(ownerToBills[msg.sender][_billId].isPayed == false);

      //require the bank has can pay 90%
      // require that the client can pay 10%
      //separate, the insurance pay give to doctor 90% and client give 10% to the doctor

      previousState = address(this).balance - msg.value;


      uint rest = (clientAccounts[msg.sender].amount + ownerToBills[msg.sender][_billId].cost) - uint(clientAccounts[msg.sender].franchise);
      uint clientToPay = ownerToBills[msg.sender][_billId].cost - rest;

      //Insurance  gives 90 % to the client address client and the client must pay 10 % for the the doctor
      if(clientAccounts[msg.sender].isReached == true)
      {
        clientAccounts[msg.sender].amount += (ownerToBills[msg.sender][_billId].cost * 10) / 100;

        //Insurance transfer to client 90% of the bill cost
        (ownerToBills[msg.sender][_billId].to).transfer((ownerToBills[msg.sender][_billId].cost * 90) / 100);

        ownerToBills[msg.sender][_billId].payByClient = (ownerToBills[msg.sender][_billId].cost * 10) / 100;
        ownerToBills[msg.sender][_billId].payByInsurance = (ownerToBills[msg.sender][_billId].cost * 90) / 100;

        //Client pay to doctor 90% from insurance + 10% from himself
        doctor.transfer(msg.value);
      }

      //Insurance pay just the 90 % of the cost rest
      if((clientAccounts[msg.sender].amount+ownerToBills[msg.sender][_billId].cost) >= uint(clientAccounts[msg.sender].franchise) && clientAccounts[msg.sender].isReached == false){
        clientAccounts[msg.sender].amount += clientToPay + ((rest*10)/100);
        clientAccounts[msg.sender].isReached = true;

        ownerToBills[msg.sender][_billId].payByClient = clientToPay + ((rest*10)/100);
        ownerToBills[msg.sender][_billId].payByInsurance = (rest * 90) / 100;

        //Insurance transfer 90% of the rest bill to the client
        (ownerToBills[msg.sender][_billId].to).transfer((rest * 90) / 100);

        //Client pay to doctor 90% of the rest from insurance + 10% from rest himself
        doctor.transfer(msg.value);
      }

      //insurance pay nothing
      if(clientAccounts[msg.sender].amount < uint(clientAccounts[msg.sender].franchise) && clientAccounts[msg.sender].amount >= 0) {
        clientAccounts[msg.sender].amount = clientAccounts[msg.sender].amount + ownerToBills[msg.sender][_billId].cost;

        ownerToBills[msg.sender][_billId].payByClient = msg.value;
        ownerToBills[msg.sender][_billId].payByInsurance = 0;

        doctor.transfer(msg.value);
      }

      ownerToBills[msg.sender][_billId].isPayed = true;

      clients[clientAccounts[msg.sender].id] = clientAccounts[msg.sender];

      //trigger billEvent
      emit PayedEvent(_billId);
    }

    function addBill(address _address, string _name, uint _cost) public onlyDoctor{
      createBill(_address, _name, _cost);
    }

    function getContractBalance() external view returns (uint) {
      return address(this).balance;
    }

    function getPreviousState() external view returns (uint) {
      return previousState;
    }

    function setDoctor(address _address) public onlyOwner {
      doctor = _address;
    }

}
