import * as ethers from 'ethers'
import { ofetch } from 'ofetch'
import { NemeosSDKError } from './utils.js'

const extractHttpErrorMessage = (error: any): string => error?.data?.message || error?.message || error?.data?.error
const extractHttpErrorMessageThenThrow = (error: any) => {
  throw new NemeosSDKError(extractHttpErrorMessage(error))
}

export class NemeosBackendClient {
  private ofetchClient = ofetch.create({
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.nemeos.finance',
  })

  public async generateLoginSignature(metamaskSigner: ethers.Signer) {
    const message = `Action: check_ownership ; Date: ${new Date().toISOString()}`
    return {
      message,
      signature: await metamaskSigner.signMessage(message),
    }
  }

  public async setCustomerDataEmail(
    borrowerAddress: string,
    loginSignedMessage: string,
    loginSignature: string,
    email: string,
  ): Promise<void> {
    return this.ofetchClient(`/customerData/${borrowerAddress}/email`, {
      method: 'PUT',
      headers: {
        'X-Login-Signed-Message': loginSignedMessage,
        'X-Login-Signed-Signature': loginSignature,
      },
      body: {
        email,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }

  public async fetchStartLoanData(
    borrowerAddress: string,
    nftCollectionAddress: string,
    nftId: number,
    loanDurationDays: number,
  ): Promise<NftStartLoanData> {
    return this.ofetchClient<NftStartLoanData>(`/nftCollections/${nftCollectionAddress}/nftId/${nftId}/startLoanData`, {
      query: {
        loanDurationDays,
        customerWalletAddress: borrowerAddress,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }
}

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
