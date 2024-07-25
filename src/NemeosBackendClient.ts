import * as ethers from 'ethers'
import { ofetch } from 'ofetch'
import { NemeosSDKError } from './utils.js'

const extractHttpErrorMessage = (error: any): string => error?.data?.message || error?.message || error?.data?.error
const extractHttpErrorMessageThenThrow = (error: any) => {
  throw new NemeosSDKError(extractHttpErrorMessage(error))
}

export class NemeosBackendClient {
  private static readonly ofetchClient = ofetch.create({
    baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:8000' : 'https://api.nemeos.finance',
  })

  public static async generateLoginSignature(metamaskSigner: ethers.Signer): Promise<NemeosLoginSignature> {
    const message = `Action: check_ownership ; Date: ${new Date().toISOString()}`
    return {
      message,
      signature: await metamaskSigner.signMessage(message),
    }
  }

  public static async fetchCustomerData(borrowerAddress: string, loginSignature: NemeosLoginSignature): Promise<CustomerData> {
    return NemeosBackendClient.ofetchClient(`/customerData/${borrowerAddress}`, {
      headers: {
        'X-Login-Signed-Message': loginSignature.message,
        'X-Login-Signed-Signature': loginSignature.signature,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }

  public static async setCustomerDataEmail(borrowerAddress: string, loginSignature: NemeosLoginSignature, email: string): Promise<void> {
    return NemeosBackendClient.ofetchClient(`/customerData/${borrowerAddress}/email`, {
      method: 'PUT',
      headers: {
        'X-Login-Signed-Message': loginSignature.message,
        'X-Login-Signed-Signature': loginSignature.signature,
      },
      body: {
        email,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }

  public static async deleteCustomerDataEmail(borrowerAddress: string, loginSignature: NemeosLoginSignature): Promise<void> {
    return NemeosBackendClient.ofetchClient(`/customerData/${borrowerAddress}/email`, {
      method: 'DELETE',
      headers: {
        'X-Login-Signed-Message': loginSignature.message,
        'X-Login-Signed-Signature': loginSignature.signature,
      },
    }).catch(extractHttpErrorMessageThenThrow)
  }

  public static async fetchStartLoanBuyOpenSeaData(
    borrowerAddress: string,
    nftCollectionAddress: string,
    nftId: number,
    loanDurationDays: number,
  ): Promise<NftStartLoanBuyOpenSeaData> {
    return NemeosBackendClient.ofetchClient<NftStartLoanBuyOpenSeaData>(
      `/nftCollections/${nftCollectionAddress}/protocolVariant/buyOpenSea/nftId/${nftId}/startLoanData`,
      {
        query: {
          loanDurationDays,
          customerWalletAddress: borrowerAddress,
        },
      },
    ).catch(extractHttpErrorMessageThenThrow)
  }
}

/**
 * Wallet signature to ensure that the customer is the owner of the wallet. This signature is valid for a few days.
 */
export type NemeosLoginSignature = {
  message: string
  signature: string
}

export type CustomerData = {
  /** Borrower address */
  borrower: string

  email?: string
  web3EmailProtectedData?: string
}

export type NftStartLoanBuyOpenSeaData = {
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
