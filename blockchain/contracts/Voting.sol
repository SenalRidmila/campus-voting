// License eka (Open source)
// SPDX-License-Identifier: MIT

// Solidity version eka 0.8.20 ho ita wadi wenna ona
pragma solidity ^0.8.20;

// Gasless (salli nathuwa) chande danna ona nisa OpenZeppelin library eka import karanawa
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

// Voting kiyana main contract eka hadanawa, eka gasless (ERC2771) gathiyen yukthai
contract Voting is ERC2771Context {
    
    // Admin ge wallet address eka save karaganna variable eka
    address public admin;

    // Register wuna lamayinge (voters) wallet address athulathda kiyala check karanna mapping (List) eka
    mapping(address => bool) public isWhitelisted;
    
    // Eka lamayekta eka parak witharak chande danna puluwan wenna Student ID hash eka save karanawa
    mapping(bytes32 => bool) public registeredStudentIdHashes;
    
    // Voter kenek kalin position ekakata (e.g. president) chande dunnada kiyala balanna
    mapping(address => mapping(uint256 => bool)) public hasVotedForPosition;
    
    // Eka eka candidate ta labena chanda gaana (vote count) save karaganna mapping eka
    mapping(uint256 => uint256) public candidateVotes;

    // Aluth voter kenek register unahama system ekata alert ekak (event) denawa
    event VoterWhitelisted(address voter);
    
    // Chande dunnama kawda dunne saha kaatada dunne kiyala system ekata alert ekak denawa
    // + eka vote ekata seconds kiyak gaththada kiyana ekath (timeTaken) methanadi blockchain hash data ekata add wenawa
    event VoteCast(address voter, uint256 positionId, uint256 candidateId, uint256 timeTaken);

    // Admin ta witharak wada karanna puluwan functions hadanna meka pawichi karanawa
    modifier onlyAdmin() {
        // Me function eka call karanne admin mai kiyala check karanawa (Naththam error ekak enawi)
        require(_msgSender() == admin, "Only admin can perform this action");
        // Check eka pass nam anith code tika run wenna denawa
        _;
    }

    // Contract eka deploy wena welema eka parak run wena constructor eka
    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {
        // Contract eka deploy karana kenawa Admin widiyata save karanawa
        admin = _msgSender();
    }

    // Aluth voter kenekwa system ekata add karana main function eka. Admin ta witharai puluwan.
    function whitelistVoter(address _voter, bytes32 _studentIdHash) public onlyAdmin {
        // Me voter ge wallet address eka kalin register wela naha neda kiyala check karanawa
        require(!isWhitelisted[_voter], "Voter is already whitelisted");
        
        // Me student ID eka kalin register wela naha neda kiyala check karanawa (Duplicate accounts nawattanna)
        require(!registeredStudentIdHashes[_studentIdHash], "Student ID already registered on blockchain");
        
        // Voter ta chande danna awasara (whitelist) denawa
        isWhitelisted[_voter] = true;
        
        // Student ID eka register wuna kiyala mark karanawa
        registeredStudentIdHashes[_studentIdHash] = true;
        
        // Voter wa add kara kiyala event eka fire (shabda) karanawa
        emit VoterWhitelisted(_voter);
    }

    // Backend eke use karanna read-only helper ekak. Duplicate wallet/student ID thiyenawada kiyala ehama check karanna puluwan.
    function canWhitelistVoter(address _voter, bytes32 _studentIdHash) public view returns (bool walletAvailable, bool studentIdAvailable) {
        walletAvailable = !isWhitelisted[_voter];
        studentIdAvailable = !registeredStudentIdHashes[_studentIdHash];
    }

    // Voter kenek chande daddi call wena main function eka
    // Methana "_timeTaken" walin 20s athule kochchara welawak gaththada kiyana eka yawalamai hash eka hadaganne.
    function vote(uint256 _positionId, uint256 _candidateId, uint256 _timeTaken) public {
        // Time eka waradida kiyala check karanawa (20s ta wadanam vote block karanawa)
        require(_timeTaken <= 20, "Vote timeout expired");

        // Chande dena kenage (msg.sender) wallet address eka currentVoter variable ekata danawa
        address currentVoter = _msgSender(); 

        // Me aya register wunu voter kenekda kiyala check karanawa
        require(isWhitelisted[currentVoter], "You are not an eligible voter");
        
        // Me position ekata eya kalin chande deela naha neda kiyala check karanawa
        require(!hasVotedForPosition[currentVoter][_positionId], "You have already voted for this position");

        // Me position ekata chande dunna kiyala mark karanawa (Aye pahu wada nokaranna)
        hasVotedForPosition[currentVoter][_positionId] = true;
        
        // Methana thamai candidate ge chanda gaana 1 kin wadi karanne (Vote count + 1)
        candidateVotes[_candidateId]++;

        // Chande sarthakawa watuna kiyala event eka fire karanawa, timeTaken ekath ekkama blockchain hash ekei save wenne
        emit VoteCast(currentVoter, _positionId, _candidateId, _timeTaken);
    }

    function getCandidateVotes(uint256 _candidateId) public view returns (uint256) {
        return candidateVotes[_candidateId];
    }
}