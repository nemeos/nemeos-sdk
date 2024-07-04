import { ofetch } from 'ofetch'
import * as ethers from 'ethers'
import { NEMEOS_POOL_HUMAN_ABI } from './abi.js'

export type NftStartLoanData = {
  customerBuyNftParameters: {
    /** ID of the NFT */
    tokenId: string
    /**
     * Price of the NFT on OpenSea in token units
     *
     * `openSeaNftPrice`
     */
    priceOfNFT: string
    /**
     * Floor price of the NFT given by Nemeos oracle algorithm in token units
     *
     * `nemeosOracleNftCollectionFloorPrice`
     */
    nftFloorPrice: string
    /**
     * Price of the NFT including the interest rate and protocol fees
     *
     * `totalLoanPrice`
     *
     * @example
     * ```ts
     * const totalLoanPrice = _remainingToPayPriceWithInterests.add(_proposedUpfrontPaymentGivenPrices)
     * ```
     */
    priceOfNFTIncludingFees: string
    /** Nemeos smart contracts seaport settlement manager address */
    settlementManager: string
    /**
     * Timestamp of the loan
     *
     * @example
     * ```ts
     * const _blockNumber = await _metamaskSigner.provider.getBlockNumber()
     * const _block = await _metamaskSigner.provider.getBlock(_blockNumber)
     * const loanTimestamp = _block.timestamp
     *```
     */
    loanTimestamp: number
    /** Duration of the loan in seconds
     *
     * `loanDurationDays * 24 * 60 * 60`
     */
    loanDurationInSeconds: number
    /** Extra data of the order */
    orderExtraData: string
    /** Signature of the oracle */
    oracleSignature: string
  }
  customerBuyNftOverrides: {
    /**
     * Upfront payment of the loan that will be paid by the customer to the protocol smart contract
     *
     * `proposedUpfrontPaymentGivenPrices`
     */
    value: string
    gasLimit: number
  }
}

const nemeosBackendHttpFetchClient = ofetch.create({
  baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.nemeos.finance',
})

export class NemeosSDKError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = this.constructor.name
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

const extractHttpErrorMessage = (error: any): string => error?.data?.message || error?.message || error?.data?.error
const extractHttpErrorMessageThenThrow = (error: any) => {
  throw new NemeosSDKError(extractHttpErrorMessage(error))
}

const assertValidHexAddress = (value: string) => {
  if (!ethers.isAddress(value)) {
    throw new NemeosSDKError(`The provided address is not a valid Ethereum address: "${value}".`)
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

  public async startLoan(nftId: number, loanDurationDays: number) {
    const startLoanData = await this.fetchStartLoanData(nftId, loanDurationDays)
    console.log('startLoanData', startLoanData)
  }

  private async fetchStartLoanData(nftId: number, loanDurationDays: number): Promise<string> {
    return nemeosBackendHttpFetchClient(`/nftCollections/${this.nemeosPoolAddress}/nftId/${nftId}/startLoanData`, {
      query: {
        loanDurationDays,
        customerWalletAddress: await this.signer.getAddress(),
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }
}
