import * as ethers from 'ethers'
import { NemeosBackendClient, NemeosLoginSignature } from './NemeosBackendClient.js'
import { assertValidHexAddress, NemeosSDKError } from './utils.js'

const NEMEOS_POOL_HUMAN_ABI = [
  'function buyNFT(uint256 tokenId, uint256 priceOfNFT, uint256 nftFloorPrice, uint256 priceOfNFTIncludingFees, address settlementManager, uint256 loanTimestamp, uint256 loanDurationInSeconds, bytes orderExtraData, bytes oracleSignature) payable',

  'function retrieveLoan(uint256 tokenId, address borrower) view returns ((address borrower, uint256 tokenID, uint256 amountAtStart, uint256 amountOwedWithInterest, uint256 nextPaymentAmount, uint256 interestAmountPerPayment, uint256 loanDurationInSeconds, uint256 startTime, uint256 nextPaymentTime, uint160 remainingNumberOfInstallments, uint256 dailyInterestRateAtStart, bool isClosed, bool isInLiquidation))',

  'function refundLoan(uint256 tokenId, address borrower) payable',
]

export const getBrowserProvider = (windowEthereum: ethers.Eip1193Provider) => {
  return new ethers.BrowserProvider(windowEthereum)
}

export class NemeosSDK {
  constructor(private readonly signer: ethers.Signer) {}

  public getNemeosCustomerClient(): NemeosCustomerClient {
    return new NemeosCustomerClient(this.signer)
  }

  public getNemeosPoolClient(params: { nftCollectionAddress: string; nemeosPoolAddress: string }): NemeosPoolClient {
    const { nftCollectionAddress, nemeosPoolAddress } = params
    assertValidHexAddress(nftCollectionAddress)
    assertValidHexAddress(nemeosPoolAddress)
    return new NemeosPoolClient(this.signer, nftCollectionAddress, nemeosPoolAddress)
  }
}

class NemeosCustomerClient {
  constructor(private readonly signer: ethers.Signer) {}

  /**
   * Trigger a signature request to the wallet. This is to ensure that the customer is the owner of the wallet when
   * interacting with the Nemeos backend.
   */
  public async requestLoginSignature(): Promise<NemeosLoginSignature> {
    const borrowerAddress = await this.signer.getAddress()
    console.log(`[nemeos][generateLoginSignature] Requesting wallet signature for borrowerAddress=${borrowerAddress}`)
    return NemeosBackendClient.generateLoginSignature(this.signer)
  }

  /**
   * Register the wallet to an email address. This is used to send email notifications and reminders to customers about their loans.
   *
   * The email address will not be broadcasted on the blockchain. It is only stored in Nemeos backend database.
   *
   * @param loginSignature Signature to ensure that the customer is the owner of the wallet
   * @param customerEmail Email address to associate with the wallet address
   */
  public async registerEmail(loginSignature: NemeosLoginSignature, customerEmail: string): Promise<void> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(`[nemeos][registerEmail] Registering customerEmail=${customerEmail} for borrowerAddress=${borrowerAddress}...`)
    await NemeosBackendClient.setCustomerDataEmail(borrowerAddress, loginSignature, customerEmail)
    console.log(
      `[nemeos][registerEmail] Successfully registered customerEmail=${customerEmail} ` + `for borrowerAddress=${borrowerAddress}!`,
    )
  }

  /**
   * Unregister the wallet from its associated email address. The customer will no longer receive email notifications and reminders.
   *
   * This will remove the email address from the Nemeos backend database.
   */
  public async unregisterEmail(loginSignature: NemeosLoginSignature): Promise<void> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(`[nemeos][unregisterEmail] Unregistering email for borrowerAddress=${borrowerAddress}...`)
    await NemeosBackendClient.deleteCustomerDataEmail(borrowerAddress, loginSignature)
    console.log(`[nemeos][unregisterEmail] Successfully unregistered email for borrowerAddress=${borrowerAddress}!`)
  }
}

class NemeosPoolClient {
  private readonly poolContract: ethers.Contract

  constructor(
    private readonly signer: ethers.Signer,
    private readonly nftCollectionAddress: string,
    private readonly nemeosPoolAddress: string,
  ) {
    const nemeosPoolInterface = new ethers.Interface(NEMEOS_POOL_HUMAN_ABI)
    this.poolContract = new ethers.Contract(nemeosPoolAddress, nemeosPoolInterface, signer)
  }

  public async startLoan(nftId: number, loanDurationDays: number): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(
      `[nemeos][startLoan] Starting loan from borrowerAddress=${borrowerAddress} for ` +
        `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}, loanDurationDays=${loanDurationDays}`,
    )

    const startLoanData = await NemeosBackendClient.fetchStartLoanData(borrowerAddress, this.nftCollectionAddress, nftId, loanDurationDays)
    const feeOverides = await this.getFeeOverrides()

    console.log('[nemeos][startLoan] Call Pool.buyNFT() with startLoanData=', startLoanData, ', feeOverides=', feeOverides)
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
      console.error('[nemeos][startLoan] Transaction failed! Tx receipt', receipt)
      throw new NemeosSDKError('Pool.buyNFT() Transaction failed!')
    }
    console.log('[nemeos][startLoan] Transaction successful! Tx receipt', receipt)
    return receipt
  }

  public async retrieveLoan(nftId: number): Promise<Loan> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(`[nemeos][retrieveLoan] Call Pool.retrieveLoan() with nftId=${nftId}, borrowerAddress=${borrowerAddress}`)
    const loan: Loan = loanProxyToObjectMapper(await this.poolContract.retrieveLoan(nftId, borrowerAddress))
    console.log('[nemeos][retrieveLoan] Retrieved loan data from contract, loan=', loan)
    return loan
  }

  public async payNextLoanStep(nftId: number): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    console.log(
      `[nemeos][payNextLoanStep] Paying next loan step from borrowerAddress=${borrowerAddress} for ` +
        `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}`,
    )

    const loan = await this.retrieveLoan(nftId)

    console.log(
      `[nemeos][payNextLoanStep] Call Pool.refundLoan() with nftId=${nftId}, borrowerAddress=${borrowerAddress}, ` +
        `loan.nextPaymentAmount=${loan.nextPaymentAmount.toString()}`,
    )
    const tx: ethers.ContractTransactionResponse = await this.poolContract.refundLoan(nftId, borrowerAddress, {
      value: loan.nextPaymentAmount.toString(),
    })

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      console.error('[nemeos][payNextLoanStep] Transaction failed! Tx receipt', receipt)
      throw new NemeosSDKError('Pool.refundLoan() Transaction failed!')
    }
    console.log('[nemeos][payNextLoanStep] Transaction successful! Tx receipt', receipt)
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

export type Loan = {
  /** Borrower address */
  borrower: string
  /** Token ID */
  tokenID: bigint
  /** Amount owed with interest */
  amountOwedWithInterest: bigint
  /** Next payment amount */
  nextPaymentAmount: bigint
  /** Interest amount per payment */
  interestAmountPerPayment: bigint
  /** Loan duration in seconds */
  loanDurationInSeconds: bigint
  /** Start time */
  startTime: bigint
  /** Next payment time */
  nextPaymentTime: bigint
  /** Remaining number of installments */
  remainingNumberOfInstallments: number
  /** Daily interest rate at start */
  dailyInterestRateAtStart: bigint
  /** Is closed */
  isClosed: boolean
  /** Is in liquidation */
  isInLiquidation: boolean
}

/** The response object returned by ethers.js is an array wrapped by a Proxy, unwrap the proxy for easier external usage */
const loanProxyToObjectMapper = (loan: Loan): Loan => ({
  borrower: loan.borrower,
  tokenID: BigInt(loan.tokenID),
  amountOwedWithInterest: BigInt(loan.amountOwedWithInterest),
  nextPaymentAmount: BigInt(loan.nextPaymentAmount),
  interestAmountPerPayment: BigInt(loan.interestAmountPerPayment),
  loanDurationInSeconds: BigInt(loan.loanDurationInSeconds),
  startTime: BigInt(loan.startTime),
  nextPaymentTime: BigInt(loan.nextPaymentTime),
  remainingNumberOfInstallments: Number(loan.remainingNumberOfInstallments),
  dailyInterestRateAtStart: BigInt(loan.dailyInterestRateAtStart),
  isClosed: loan.isClosed,
  isInLiquidation: loan.isInLiquidation,
})
