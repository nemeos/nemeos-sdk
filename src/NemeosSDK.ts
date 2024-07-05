import ethers from 'ethers'
import { assertValidHexAddress, NemeosSDKError } from './utils.js'
import { NemeosBackendClient } from './NemeosBackendClient.js'

const NEMEOS_POOL_HUMAN_ABI = [
  'function buyNFT(uint256 tokenId, uint256 priceOfNFT, uint256 nftFloorPrice, uint256 priceOfNFTIncludingFees, address settlementManager, uint256 loanTimestamp, uint256 loanDurationInSeconds, bytes orderExtraData, bytes oracleSignature) payable',

  'function retrieveLoan(uint256 tokenId, address borrower) view returns ((address borrower, uint256 tokenID, uint256 amountAtStart, uint256 amountOwedWithInterest, uint256 nextPaymentAmount, uint256 interestAmountPerPayment, uint256 loanDurationInSeconds, uint256 startTime, uint256 nextPaymentTime, uint160 remainingNumberOfInstallments, uint256 dailyInterestRateAtStart, bool isClosed, bool isInLiquidation))',

  'function refundLoan(uint256 tokenId, address borrower) payable',
]

export class NemeosSDK {
  constructor(private readonly signer: ethers.Signer) {}

  public getPool(params: { nftCollectionAddress: string; nemeosPoolAddress: string }) {
    const { nftCollectionAddress, nemeosPoolAddress } = params
    assertValidHexAddress(nftCollectionAddress)
    assertValidHexAddress(nemeosPoolAddress)
    return new NemeosPool(this.signer, nftCollectionAddress, nemeosPoolAddress)
  }
}

class NemeosPool {
  private readonly poolContract: ethers.Contract
  private readonly nemeosBackendClient = new NemeosBackendClient()

  constructor(
    private readonly signer: ethers.Signer,
    private readonly nftCollectionAddress: string,
    private readonly nemeosPoolAddress: string,
  ) {
    const nemeosPoolInterface = new ethers.Interface(NEMEOS_POOL_HUMAN_ABI)
    this.poolContract = new ethers.Contract(nemeosPoolAddress, nemeosPoolInterface, signer)
  }

  public async registerCustomerEmailAddress(customerEmailAddress: string): Promise<void> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(`[nemeos-sdk][registerCustomerEmailAddress] Requesting wallet signature for borrowerAddress=${borrowerAddress}`)
    const { message, signature } = await this.nemeosBackendClient.generateLoginSignature(this.signer)
    console.log(
      `[nemeos-sdk][registerCustomerEmailAddress] Registering customerEmailAddress=${customerEmailAddress} ` +
        `for borrowerAddress=${borrowerAddress}...`,
    )
    await this.nemeosBackendClient.setCustomerDataEmail(borrowerAddress, message, signature, customerEmailAddress)
    console.log(
      `[nemeos-sdk][registerCustomerEmailAddress] Successfully registered customerEmailAddress=${customerEmailAddress} ` +
        `for borrowerAddress=${borrowerAddress}!`,
    )
  }

  public async startLoan(nftId: number, loanDurationDays: number): Promise<ethers.ContractTransactionReceipt | null> {
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
    const feeOverides = await this.getFeeOverrides()

    console.log('[nemeos-sdk][startLoan] Call Pool.BuyNFT() with startLoanData=', startLoanData, ', feeOverides=', feeOverides)
    const tx: ethers.ContractTransactionResponse = await this.poolContract.buyNFT(
      startLoanData.customerBuyNftParameters.tokenId,
      startLoanData.customerBuyNftParameters.priceOfNFT,
      startLoanData.customerBuyNftParameters.nftFloorPrice,
      startLoanData.customerBuyNftParameters.priceOfNFTIncludingFees,
      startLoanData.customerBuyNftParameters.settlementManager,
      startLoanData.customerBuyNftParameters.loanTimestamp,
      startLoanData.customerBuyNftParameters.loanDurationInSeconds,
      startLoanData.customerBuyNftParameters.orderExtraData,
      startLoanData.customerBuyNftParameters.oracleSignature,
      {
        ...feeOverides,
        gasLimit: startLoanData.customerBuyNftOverrides.gasLimit,
        value: startLoanData.customerBuyNftOverrides.value,
      },
    )

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      console.error('[nemeos-sdk][startLoan] Transaction failed! Tx receipt', receipt)
      throw new NemeosSDKError('Pool.BuyNFT() Transaction failed!')
    }
    console.log('[nemeos-sdk][startLoan] Transaction successful! Tx receipt', receipt)
    return receipt
  }

  private async getFeeOverrides() {
    const feeData = await this.signer.provider!.getFeeData()
    const isLegacyNetwork = feeData.maxFeePerGas === undefined || feeData.maxPriorityFeePerGas === undefined
    return isLegacyNetwork
      ? { gasPrice: feeData.gasPrice }
      : { maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas }
  }
}
