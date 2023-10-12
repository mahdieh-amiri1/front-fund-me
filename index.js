import { ethers } from "./ethers-5.6.esm.min.js"
import { abi, contractAddress } from "./constants.js"

const connectButton = document.getElementById("connectButton")
const fundButton = document.getElementById("fundButton")
const balanceButton = document.getElementById("balanceButton")
const withdrawButton = document.getElementById("withdrawButton")
const refundButton = document.getElementById("refundButton")
const eventLog = document.getElementById("eventLog")
const addressDisplay = document.getElementById("addressDisplay")
const balanceDisplay = document.getElementById("balanceDisplay")

connectButton.onclick = connect
fundButton.onclick = fund
balanceButton.onclick = getBalance
withdrawButton.onclick = withdraw
refundButton.onclick = refund

async function connect() {
    eventLog.innerHTML = ""
    if (typeof window.ethereum !== "undefined") {
        try {
            const accounts = await ethereum.request({ method: "eth_requestAccounts" });
            const selectedAccount = accounts[0]; // Get the first connected account
            addressDisplay.innerHTML = "Your Address: " + selectedAccount;
            // Update the "Connected" button text
            connectButton.innerHTML = "Connected";
        } catch (error) {
            console.error(error);
        }
    } else {
        connectButton.innerHTML = "Please install MetaMask";
    }
}

async function fund() {
    eventLog.innerHTML = ""
    const ethAmount = document.getElementById("ethAmount").value
    console.log(`Funding with ${ethAmount}...`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const userAddress = await signer.getAddress(); // Get the user's Ethereum address
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.fund({
                value: ethers.utils.parseEther(ethAmount),
            })
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
            // Listen to fund event
            contract.on("FundEvent", (fundingAddress, fundingAmount) => {
                // Update the front end to display the event data
                const amountInEth = ethers.utils.formatEther(fundingAmount)
                eventLog.innerHTML = `Received Fund Event: Address ${fundingAddress}, funded ${amountInEth} ETH`;
                // Store the event in localStorage for the user
                // logEventAndStore(userAddress, `Received FundEvent: Address ${fundingAddress}, Amount ${fundingAmount}`);
            });

            document.getElementById("ethAmount").value = "";
        }
        catch (error) {
            console.log(error)
        }
    } else {
        fundButton.innerHTML = "Please install MetaMask"
    }
}

function listenForTransactionMine(transactionResponse, provider) {
    console.log(`Mining ${transactionResponse.hash}`)
    return new Promise((resolve, reject) => {
        try {
            provider.once(transactionResponse.hash, (transactionReceipt) => {
                console.log(
                    `Completed with ${transactionReceipt.confirmations} confirmations. `
                )
                resolve()
            })
        } catch (error) {
            reject(error)
        }
    })
}

async function getBalance() {
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        try {
            const balance = await provider.getBalance(contractAddress)
            const etherBalance = ethers.utils.formatEther(balance)
            console.log(etherBalance)
            balanceDisplay.innerHTML = "Contract Balance: " + etherBalance;
        } catch (error) {
            console.log(error)
        }
    } else {
        balanceButton.innerHTML = "Please install MetaMask"
    }
}

async function withdraw() {
    eventLog.innerHTML = ""
    console.log(`Withdrawing...`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send('eth_requestAccounts', []) //This is optional
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.withdraw()
            await listenForTransactionMine(transactionResponse, provider)
            // await transactionResponse.wait(1)
            // Listen to withdraw event
            contract.on("WithdrawEvent", (withdrawAddreess, withdrawAmount) => {
                // Update the front end to display the event data
                const amountInEth = ethers.utils.formatEther(withdrawAmount)
                eventLog.innerHTML = `Received Withdraw Event: Address ${withdrawAddreess}, withdrawed ${amountInEth} ETH`
            })
        } catch (error) {
            console.log(error)
        }
    } else {
        withdrawButton.innerHTML = "Please install MetaMask"
    }
}

async function refund() {
    eventLog.innerHTML = ""
    const refundingAddress = document.getElementById("refundingAddress").value
    console.log(`Refunding to ${refundingAddress} ...`)
    if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const signer = provider.getSigner()
        const contract = new ethers.Contract(contractAddress, abi, signer)
        try {
            const transactionResponse = await contract.refund(refundingAddress)
            await listenForTransactionMine(transactionResponse, provider)
            console.log("Done!")
            // Listen to refund event
            contract.on("RefundEvent", (refundingAddress, refundingAmount) => {
                // Update the front end to display the event data
                const amountInEth = ethers.utils.formatEther(refundingAmount)
                eventLog.innerHTML = `Received Refund Event: Address ${refundingAddress}, refunded ${amountInEth} ETH`
            })
            document.getElementById("refundingAddress").value = "";
        }
        catch (error) {
            console.log(error)
        }
    } else {
        fundButton.innerHTML = "Please install MetaMask"
    }
}
