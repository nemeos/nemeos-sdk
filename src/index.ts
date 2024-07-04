import * as ethers from 'ethers'
import { NEMEOS_POOL_HUMAN_ABI } from './abi.js'

const assertValidHexAddress = (value: string) => {
  if (!ethers.isAddress(value)) {
    throw new Error(`[nemeos-sdk] The provided address is not a valid Ethereum address: "${value}".`)
  }
}

export class NemeosSDK {
  constructor(private readonly signer: ethers.JsonRpcSigner) {}

  public getPool(nemeosPoolAddress: string) {
    return new NemeosPool(this.signer, nemeosPoolAddress)
  }
}

export class NemeosPool {
  private readonly poolContract: ethers.Contract

  constructor(private readonly signer: ethers.JsonRpcSigner, private readonly nemeosPoolAddress: string) {
    assertValidHexAddress(nemeosPoolAddress)

    const nemeosPoolInterface = new ethers.Interface(NEMEOS_POOL_HUMAN_ABI)
    console.log(nemeosPoolInterface)
    console.log("nemeosPoolInterface.getFunction('buyNFT')", nemeosPoolInterface.getFunction('buyNFT'))
    this.poolContract = new ethers.Contract(nemeosPoolAddress, nemeosPoolInterface, signer)
    console.log('this.poolContract', this.poolContract)
  }

  public async startLoan() {
    assertValidHexAddress(this.nemeosPoolAddress)
  }

  private async fetchStartLoanData(): Promise<string> {
    return ''
  }
}

const nemeosSdk = new NemeosSDK({} as any)
nemeosSdk.getPool('0x812db15b8Bb43dBA89042eA8b919740C23aD48a3')
