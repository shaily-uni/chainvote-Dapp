// ====== CONFIG: paste your deployed contract address below ======
const CONTRACT_ADDRESS = "0x9aD8eb425807e582026203B2f8E30a12Ebc3ECf3";
const EXPECTED_CHAIN_ID = 11155111n; // Sepolia
const EXPECTED_CHAIN_HEX = "0xaa36a7";
const EXPECTED_NETWORK_NAME = "Sepolia";

const ABI = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  {
    inputs: [{ internalType: "uint256", name: "candidateId", type: "uint256" }],
    name: "vote", outputs: [], stateMutability: "nonpayable", type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "voter", type: "address" },
      { indexed: true, internalType: "uint256", name: "candidateId", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newVoteCount", type: "uint256" }
    ],
    name: "VoteCast", type: "event"
  },
  {
    inputs: [{ internalType: "uint256", name: "candidateId", type: "uint256" }],
    name: "getCandidate",
    outputs: [
      { internalType: "uint256", name: "", type: "uint256" },
      { internalType: "string", name: "", type: "string" },
      { internalType: "uint256", name: "", type: "uint256" }
    ],
    stateMutability: "view", type: "function"
  },
  {
    inputs: [], name: "getCandidateCount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view", type: "function"
  },
  {
    inputs: [], name: "getCandidates",
    outputs: [{
      components: [
        { internalType: "uint256", name: "id", type: "uint256" },
        { internalType: "string", name: "name", type: "string" },
        { internalType: "uint256", name: "voteCount", type: "uint256" }
      ],
      internalType: "struct Voting.Candidate[]", name: "", type: "tuple[]"
    }],
    stateMutability: "view", type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "voter", type: "address" }],
    name: "hasVoted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view", type: "function"
  }
];

let provider, signer, contract, userAddress;

const $ = (id) => document.getElementById(id);

function showError(msg) {
  const el = $("error");
  el.textContent = msg;
  el.hidden = !msg;
}
function setStatus(msg) {
  const el = $("status");
  el.textContent = msg;
  el.hidden = !msg;
}
function setNetwork(text, cls) {
  const el = $("network");
  el.textContent = text;
  el.className = "net " + (cls || "");
}

async function connect() {
  showError("");
  if (!window.ethereum) {
    showError("MetaMask is not installed or not available in this browser. Install the MetaMask extension and reload this page.");
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    userAddress = await signer.getAddress();
    $("account").textContent = userAddress;
    $("connectBtn").textContent = "Connected";
    $("connectBtn").disabled = true;

    const net = await provider.getNetwork();
    if (net.chainId !== EXPECTED_CHAIN_ID) {
      setNetwork(`Wrong network (chain ID ${net.chainId}). Switch to ${EXPECTED_NETWORK_NAME}.`, "bad");
      $("switchBtn").hidden = false;
      showError(`Wrong network. This app only works on ${EXPECTED_NETWORK_NAME}. Use the switch button or change it in MetaMask.`);
      $("candidates").innerHTML = "";
      return;
    }
    $("switchBtn").hidden = true;
    setNetwork(`Connected to ${EXPECTED_NETWORK_NAME}`, "ok");

    if (!ethers.isAddress(CONTRACT_ADDRESS)) {
      showError("Contract address is not set. Open app.js and paste your deployed contract address.");
      return;
    }
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    await loadCandidates();
  } catch (e) {
    if (e.code === "ACTION_REJECTED" || e.code === 4001) {
      showError("You rejected the connection request in MetaMask.");
    } else {
      showError("Connection failed: " + (e.shortMessage || e.message));
    }
  }
}

async function switchNetwork() {
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: EXPECTED_CHAIN_HEX }]
    });
  } catch (e) {
    showError("Could not switch network. Change it manually in MetaMask: " + (e.message || ""));
  }
}

async function loadCandidates() {
  try {
    const list = await contract.getCandidates();
    const voted = await contract.hasVoted(userAddress);
    const total = list.reduce((sum, c) => sum + c.voteCount, 0n);

    const wrap = $("candidates");
    wrap.innerHTML = "";
    list.forEach((c) => {
      const pct = total > 0n ? Number((c.voteCount * 100n) / total) : 0;

      const card = document.createElement("div");
      card.className = "cand";

      const bar = document.createElement("div");
      bar.className = "bar";
      bar.style.width = pct + "%";

      const left = document.createElement("div");
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = c.name;
      const id = document.createElement("div");
      id.className = "id";
      id.textContent = "Candidate ID " + c.id.toString();
      left.append(name, id);

      const right = document.createElement("div");
      right.className = "right";
      const votes = document.createElement("div");
      votes.className = "votes";
      votes.textContent = c.voteCount.toString();
      const btn = document.createElement("button");
      btn.textContent = "Vote";
      btn.disabled = voted;
      btn.addEventListener("click", () => vote(c.id));
      right.append(votes, btn);

      card.append(bar, left, right);
      wrap.appendChild(card);
    });

    const note = $("voteNote");
    note.hidden = !voted;
    note.textContent = voted ? "This address has already voted. Voting is disabled." : "";
  } catch (e) {
    showError("Could not read from the contract. Check the contract address and network. " + (e.shortMessage || e.message));
  }
}

async function vote(id) {
  showError("");
  document.querySelectorAll(".cand button").forEach((b) => (b.disabled = true));
  try {
    setStatus("Waiting for you to confirm in MetaMask...");
    const tx = await contract.vote(id);
    setStatus("Transaction submitted, waiting for confirmation. Hash: " + tx.hash);
    const receipt = await tx.wait();
    setStatus(`Vote confirmed in block ${receipt.blockNumber}. Hash: ${tx.hash}. Gas used: ${receipt.gasUsed.toString()}`);
    console.log("Tx hash:", tx.hash, "Gas used:", receipt.gasUsed.toString());
    await loadCandidates();
  } catch (e) {
    setStatus("");
    if (e.code === "ACTION_REJECTED" || e.code === 4001) {
      showError("You rejected the transaction in MetaMask. No vote was recorded.");
    } else {
      showError("Transaction failed: " + (e.reason || e.shortMessage || e.message));
    }
    await loadCandidates();
  }
}

$("connectBtn").addEventListener("click", connect);
$("switchBtn").addEventListener("click", switchNetwork);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => location.reload());
  window.ethereum.on("chainChanged", () => location.reload());
} else {
  showError("MetaMask is not installed or not available in this browser. Install the MetaMask extension and reload this page.");
}