import { ethers } from 'ethers'
import { NEMEOS_ABI } from '../constants.js'
import { NemeosSDKError } from '../utils.js'
import { NemeosPoolMode } from '../constants.js'

export abstract class NemeosPoolClient {
  protected readonly poolContract: ethers.Contract

  constructor(
    protected readonly signer: ethers.Signer,
    protected readonly enableLogging: boolean,
    protected readonly nftCollectionAddress: string,
    protected readonly nemeosPoolAddress: string,
    protected readonly nemeosPoolMode: NemeosPoolMode,
  ) {
    const nemeosPoolInterface = new ethers.Interface(NEMEOS_ABI.POOL[nemeosPoolMode])
    this.poolContract = new ethers.Contract(nemeosPoolAddress, nemeosPoolInterface, signer)
  }

  public async retrieveLoan(nftId: number): Promise<Loan> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(`[nemeos][retrieveLoan] Call Pool.retrieveLoan() with nftId=${nftId}, borrowerAddress=${borrowerAddress}`)
    }
    const loan: Loan = loanProxyToObjectMapper(await this.poolContract.retrieveLoan(nftId, borrowerAddress))
    if (this.enableLogging) {
      console.log('[nemeos][retrieveLoan] Retrieved loan data from contract, loan=', loan)
    }
    return loan
  }

  public async payNextLoanStep(nftId: number): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(
        `[nemeos][payNextLoanStep] Paying next loan step from borrowerAddress=${borrowerAddress} for ` +
          `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}`,
      )
    }

    const loan = await this.retrieveLoan(nftId)

    if (this.enableLogging) {
      console.log(
        `[nemeos][payNextLoanStep] Call Pool.refundLoan() with nftId=${nftId}, borrowerAddress=${borrowerAddress}, ` +
          `loan.nextPaymentAmount=${loan.nextPaymentAmount.toString()}`,
      )
    }
    const tx: ethers.ContractTransactionResponse = await this.poolContract.refundLoan(nftId, borrowerAddress, {
      value: loan.nextPaymentAmount.toString(),
    })

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      console.error('[nemeos][payNextLoanStep] Transaction failed! Tx receipt', receipt)
      throw new NemeosSDKError('Pool.refundLoan() Transaction failed!')
    }
    if (this.enableLogging) {
      console.log('[nemeos][payNextLoanStep] Transaction successful! Tx receipt', receipt)
    }
    return receipt
  }

  protected async getFeeOverrides() {
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
export const loanProxyToObjectMapper = (loan: Loan): Loan => ({
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
