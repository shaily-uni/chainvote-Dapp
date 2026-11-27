// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Voting {
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }

    Candidate[] private candidates;
    mapping(address => bool) private voted;

    event VoteCast(address indexed voter, uint256 indexed candidateId, uint256 newVoteCount);

    constructor() {
        candidates.push(Candidate(0, "Alice", 0));
        candidates.push(Candidate(1, "Bob", 0));
        candidates.push(Candidate(2, "Carol", 0));
    }

    function vote(uint256 candidateId) external {
        require(!voted[msg.sender], "Already voted");
        require(candidateId < candidates.length, "Invalid candidate");
        voted[msg.sender] = true;
        candidates[candidateId].voteCount += 1;
        emit VoteCast(msg.sender, candidateId, candidates[candidateId].voteCount);
    }

    function getCandidate(uint256 candidateId) external view returns (uint256, string memory, uint256) {
        require(candidateId < candidates.length, "Invalid candidate");
        Candidate storage c = candidates[candidateId];
        return (c.id, c.name, c.voteCount);
    }

    function getCandidates() external view returns (Candidate[] memory) {
        return candidates;
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function hasVoted(address voter) external view returns (bool) {
        return voted[voter];
    }
}
