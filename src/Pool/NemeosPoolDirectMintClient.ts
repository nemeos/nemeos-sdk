import { ethers } from 'ethers'
import { NemeosBackendClient } from '../NemeosBackendClient.js'
import { NemeosPoolClient, NemeosPoolMode } from './NemeosPoolClient.js'
import { getFeeOverrides, NemeosSDKError } from '../utils.js'

export class NemeosPoolDirectMintClient extends NemeosPoolClient {
  constructor(signer: ethers.Signer, enableLogging: boolean, nftCollectionAddress: string, nemeosPoolAddress: string) {
    super(signer, enableLogging, nftCollectionAddress, nemeosPoolAddress, NemeosPoolMode.DirectMint)
  }

  public async startLoan(nftId: number, loanDurationDays: number, whitelistProof?: string[]): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(
        `[nemeos][startLoan_DirectMint] Starting loan from borrowerAddress=${borrowerAddress} for ` +
          `nftCollectionAddress=${this.nftCollectionAddress}, nftId=${nftId}, loanDurationDays=${loanDurationDays}`,
      )
    }

    const startLoanData = await NemeosBackendClient.fetchStartLoanDirectMintData(
      borrowerAddress,
      this.nftCollectionAddress,
      nftId,
      loanDurationDays,
      whitelistProof,
    )
    const feeOverides = await getFeeOverrides(this.signer.provider!)

    if (this.enableLogging) {
      console.log('[nemeos][startLoan_DirectMint] Call Pool.buyNFT() with startLoanData=', startLoanData, ', feeOverides=', feeOverides)
    }
    const tx: ethers.ContractTransactionResponse = await this.poolContract.buyNFT(
      startLoanData.customerBuyNftParameters.tokenId,
      startLoanData.customerBuyNftParameters.priceOfNFT,
      startLoanData.customerBuyNftParameters.nftFloorPrice,
      startLoanData.customerBuyNftParameters.priceOfNFTIncludingFees,
      startLoanData.customerBuyNftParameters.crowdsaleContractAddress,
      startLoanData.customerBuyNftParameters.loanTimestamp,
      startLoanData.customerBuyNftParameters.loanDurationInSeconds,
      startLoanData.customerBuyNftParameters.orderExtraData,
      startLoanData.customerBuyNftParameters.oracleSignature,
      startLoanData.customerBuyNftParameters.proof,
      {
        ...feeOverides,
        gasLimit: startLoanData.customerBuyNftOverrides.gasLimit,
        value: startLoanData.customerBuyNftOverrides.value,
      },
    )

    const receipt = await tx.wait()
    if (receipt?.status !== 1) {
      console.error('[nemeos][startLoan_DirectMint] Transaction failed! Tx receipt', receipt)
      throw new NemeosSDKError('Pool.buyNFT() Transaction failed!')
    }
    if (this.enableLogging) {
      console.log('[nemeos][startLoan_DirectMint] Transaction successful! Tx receipt', receipt)
    }
    return receipt
  }
}
