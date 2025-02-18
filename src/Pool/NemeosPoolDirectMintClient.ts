import { ethers } from 'ethers'
import { NemeosBackendClient, NftLivePriceDirectMintData } from '../NemeosBackendClient.js'
import { NemeosPoolClient } from './NemeosPoolClient.js'
import { getFeeOverrides, NemeosSDKError } from '../utils.js'
import { NemeosPoolMode } from '../constants.js'

export class NemeosPoolDirectMintClient extends NemeosPoolClient {
  constructor(signer: ethers.Signer, enableLogging: boolean, nftCollectionAddress: string, nemeosPoolAddress: string) {
    super(signer, enableLogging, nftCollectionAddress, nemeosPoolAddress, NemeosPoolMode.DirectMint)
  }

  public async isWhitelistedAddress(whitelistProof: string[]): Promise<boolean> {
    const borrowerAddress = await this.signer.getAddress()
    const isWhitelisted = await this.poolContract.isWhitelistedAddress(borrowerAddress, whitelistProof)
    return isWhitelisted
  }

  public async previewLoan(loanDurationDays: number): Promise<NftLivePriceDirectMintData> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(
        `[nemeos][previewLoan_DirectMint] Previewing loan for ` +
          `nftCollectionAddress=${this.nftCollectionAddress}, loanDurationDays=${loanDurationDays}, borrowerAddress=${borrowerAddress}`,
      )
    }

    const previewLoanData = await NemeosBackendClient.fetchLivePriceDirectMintData(
      this.nftCollectionAddress,
      loanDurationDays,
      borrowerAddress,
    )

    if (this.enableLogging) {
      console.log('[nemeos][previewLoan_DirectMint] Preview loan data:', previewLoanData)
    }

    return previewLoanData
  }

  public async startLoan(loanDurationDays: number, whitelistProof?: string[]): Promise<ethers.ContractTransactionReceipt> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(
        `[nemeos][startLoan_DirectMint] Starting loan from borrowerAddress=${borrowerAddress} for ` +
          `nftCollectionAddress=${this.nftCollectionAddress}, loanDurationDays=${loanDurationDays}`,
      )
    }

    const startLoanData = await NemeosBackendClient.fetchStartLoanDirectMintData(
      this.nftCollectionAddress,
      loanDurationDays,
      borrowerAddress,
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
