import * as ethers from 'ethers'
import { getBrowserProvider, NemeosSDK } from '../../src/index.js'

declare global {
  interface Window {
    ethereum: any
  }
}

let signer: ethers.Signer
let nemeosSdk: NemeosSDK
let nemeosPoolBuyOpenSeaClient: ReturnType<NemeosSDK['getNemeosPoolClient']>

const nemeosPoolAddress = '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3'
const cyberKongzAddress = '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3'

export async function isMetamaskConnected() {
  if (!window.ethereum) return false

  try {
    const _provider = new ethers.BrowserProvider(window.ethereum)
    const accounts = await _provider.send('eth_accounts', [])
    const accounts2 = await window.ethereum.request({ method: 'eth_accounts' })

    if (accounts.length !== accounts2.length || accounts[0] !== accounts2[0]) {
      throw new Error('Metamask accounts are not the same when using ethers.js and window.ethereum.request')
    }

    console.log('[isMetamaskConnected] Metamask is connected', { accounts })
    return accounts && accounts.length > 0
  } catch (error) {
    console.error('[isMetamaskConnected] There was an error while trying to connect to Metamask isMetamaskConnected()', { error })
    return false
  }
}

function setWalletConnected(bool: boolean) {
  document.getElementById('isConnected')!.innerText = `${bool}`
}

async function connectWallet() {
  const provider1 = new ethers.BrowserProvider(window.ethereum)
  const signer1 = await provider1.getSigner()
  const address1 = await signer1.getAddress()

  const provider2 = getBrowserProvider(window.ethereum)
  const signer2 = await provider2.getSigner()
  const address2 = await signer2.getAddress()

  if (address1 !== address2) {
    throw new Error('Addresses are not the same when using ethers.js and window.ethereum.request')
  }

  signer = signer1
  nemeosSdk = new NemeosSDK(signer)
  nemeosPoolBuyOpenSeaClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress,
    nftCollectionAddress: cyberKongzAddress,
    nemeosPoolMode: NemeosSDK.NemeosPoolMode.BuyOpenSea,
  })

  setWalletConnected(true)
}

async function startLoan() {
  await nemeosPoolBuyOpenSeaClient.startLoan(224, 90)
}
async function retrieveLoan() {
  await nemeosPoolBuyOpenSeaClient.retrieveLoan(224)
}
async function payNextLoanStep() {
  await nemeosPoolBuyOpenSeaClient.payNextLoanStep(224)
}

function addEventListeners() {
  document.getElementById('connectWallet')!.addEventListener('click', connectWallet)
  document.getElementById('startLoan')!.addEventListener('click', startLoan)
  document.getElementById('retrieveLoan')!.addEventListener('click', retrieveLoan)
  document.getElementById('payNextLoanStep')!.addEventListener('click', payNextLoanStep)
}

document.addEventListener('DOMContentLoaded', async () => {
  addEventListeners()
  if (await isMetamaskConnected()) {
    setWalletConnected(true)
    connectWallet()
  } else {
    setWalletConnected(false)
  }
})
