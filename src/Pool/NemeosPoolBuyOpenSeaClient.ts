import { ethers } from 'ethers'
import { NemeosBackendClient } from '../NemeosBackendClient.js'
import { NemeosPoolClient, NemeosPoolMode } from './NemeosPoolClient.js'
import { getFeeOverrides, NemeosSDKError } from '../utils.js'

export class NemeosPoolBuyOpenSeaClient extends NemeosPoolClient {
  constructor(signer: ethers.Signer, enableLogging: boolean, nftCollectionAddress: string, nemeosPoolAddress: string) {
    super(signer, enableLogging, nftCollectionAddress, nemeosPoolAddress, NemeosPoolMode.BuyOpenSea)
  }

  public async startLoan(nftId: number, loanDurationDays: number): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(
        `[nemeos][startLoan] Starting loan from borrowerAddress=${borrowerAddress} for ` +
          `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}, loanDurationDays=${loanDurationDays}`,
      )
    }

    const startLoanData = await NemeosBackendClient.fetchStartLoanBuyOpenSeaData(
      borrowerAddress,
      this.nftCollectionAddress,
      nftId,
      loanDurationDays,
    )
    const feeOverides = await getFeeOverrides(this.signer.provider!)

    if (this.enableLogging) {
      console.log('[nemeos][startLoan] Call Pool.buyNFT() with startLoanData=', startLoanData, ', feeOverides=', feeOverides)
    }
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
    if (this.enableLogging) {
      console.log('[nemeos][startLoan] Transaction successful! Tx receipt', receipt)
    }
    return receipt
  }
}
