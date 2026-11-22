
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {

    // Store candidate information
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    // Store all candidates
    Candidate[] public candidates;

    // Track whether an address has voted
    mapping(address => bool) private voters;

    // Event generated after successful voting
    event VoteCast(address indexed voter, uint256 indexed candidateId);

    // Initialize three candidates
    constructor() {
        candidates.push(Candidate(0, "Alice", 0));
        candidates.push(Candidate(1, "Bob", 0));
        candidates.push(Candidate(2, "Charlie", 0));
    }

    // Allow users to cast a vote
    function vote(uint256 candidateId) public {
        require(candidateId < candidates.length, "Invalid candidate ID");
        require(!voters[msg.sender], "You have already voted");

        voters[msg.sender] = true;
        candidates[candidateId].voteCount++;

        emit VoteCast(msg.sender, candidateId);
    }

    // Retrieve candidate information
    function getCandidate(uint256 candidateId)
        public
        view
        returns (uint256, string memory, uint256)
    {
        require(candidateId < candidates.length, "Invalid candidate ID");

        Candidate memory c = candidates[candidateId];

        return (c.id, c.name, c.voteCount);
    }

    // Return total number of candidates
    function getCandidateCount() public view returns (uint256) {
        return candidates.length;
    }

    // Check whether an address has voted
    function hasVoted(address voter) public view returns (bool) {
        return voters[voter];
    }
}
