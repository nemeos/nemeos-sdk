import * as ethers from 'ethers'
import { NEMEOS_POOL_HUMAN_ABI } from './abi.js'
import { assertValidHexAddress } from './utils.js'
import { NemeosBackendClient } from './NemeosBackendClient.js'

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

export class NemeosSDK {
  constructor(private readonly signer: ethers.JsonRpcSigner) {}

  public getPool(nftCollectionAddress: string, nemeosPoolAddress: string) {
    return new NemeosPool(this.signer, nftCollectionAddress, nemeosPoolAddress)
  }
}

export class NemeosPool {
  private readonly poolContract: ethers.Contract
  private readonly nemeosBackendClient = new NemeosBackendClient()

  constructor(
    private readonly signer: ethers.JsonRpcSigner,
    private readonly nftCollectionAddress: string,
    private readonly nemeosPoolAddress: string,
  ) {
    assertValidHexAddress(nftCollectionAddress)
    assertValidHexAddress(nemeosPoolAddress)

    const nemeosPoolInterface = new ethers.Interface(NEMEOS_POOL_HUMAN_ABI)
    console.log(nemeosPoolInterface)
    console.log("nemeosPoolInterface.getFunction('buyNFT')", nemeosPoolInterface.getFunction('buyNFT'))
    this.poolContract = new ethers.Contract(nemeosPoolAddress, nemeosPoolInterface, signer)
    console.log('this.poolContract', this.poolContract)
  }

  public async registerCustomerEmailAddress(customerEmailAddress: string) {
    const borrowerAddress = await this.signer.getAddress()

    console.log(`[nemeos-sdk][registerCustomerEmailAddress] Requesting wallet signature for borrowerAddress=${borrowerAddress}`)
    const { message, signature } = await this.nemeosBackendClient.generateLoginSignature(this.signer)
    console.log(
      `[nemeos-sdk][registerCustomerEmailAddress] Registering customerEmailAddress=${customerEmailAddress} ` +
        `for borrowerAddress=${borrowerAddress}`,
    )
    await this.nemeosBackendClient.setCustomerDataEmail(borrowerAddress, message, signature, customerEmailAddress)
  }

  public async startLoan(nftId: number, loanDurationDays: number) {
    const borrowerAddress = await this.signer.getAddress()

    console.log(
      `[nemeos-sdk][startLoan] Starting loan from borrowerAddress=${borrowerAddress} for ` +
        `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}, loanDurationDays=${loanDurationDays}`,
    )
    const startLoanData = await this.nemeosBackendClient.fetchStartLoanData(
      borrowerAddress,
      this.nftCollectionAddress,
      nftId,
      loanDurationDays,
    )
    console.log('[nemeos-sdk][startLoan]', startLoanData)
  }
}
