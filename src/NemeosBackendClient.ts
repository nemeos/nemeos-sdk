import * as ethers from 'ethers'
import { ofetch } from 'ofetch'
import { NemeosSDKError } from './utils.js'

const extractHttpErrorMessage = (error: any): string => error?.data?.message || error?.message || error?.data?.error
const extractHttpErrorMessageThenThrow = (error: any) => {
  throw new NemeosSDKError(extractHttpErrorMessage(error))
}

export enum NemeosBackendEnvironment {
  Development = 'development',
  Preprod = 'preprod',
  Production = 'production',
}

export class NemeosBackendClient {
  private static ofetchClient = ofetch.create({
    baseURL:
      process?.env?.NODE_ENV === NemeosBackendEnvironment.Development
        ? 'http://localhost:8000'
        : process?.env?.NODE_ENV === NemeosBackendEnvironment.Preprod
        ? 'https://testnet-api.nemeos.finance'
        : 'https://api.nemeos.finance',
  })

  public static setEnvironment(env: NemeosBackendEnvironment) {
    const baseURL =
      env === NemeosBackendEnvironment.Development
        ? 'http://localhost:8000'
        : env === NemeosBackendEnvironment.Preprod
        ? 'https://testnet-api.nemeos.finance'
        : 'https://api.nemeos.finance'

    if (env !== NemeosBackendEnvironment.Production) {
      console.log('[nemeos] NemeosBackendClient will use API at', baseURL)
    }
    NemeosBackendClient.ofetchClient = ofetch.create({ baseURL })
  }

  //
  // ------------------------------
  //

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

  //
  // Nemeos Pool BuyOpenSea mode
  //
  public static async fetchLivePriceBuyOpenSeaData(
    nftCollectionAddress: string,
    nftId: string,
    loanDurationDays: number,
    borrowerAddress: string,
  ): Promise<NftLivePriceBuyOpenSeaData> {
    return NemeosBackendClient.ofetchClient<NftLivePriceBuyOpenSeaData>(
      `/nftCollections/${nftCollectionAddress}/protocolVariant/buyOpenSea/nftId/${nftId}/livePriceData`,
      {
        query: {
          loanDurationDays,
          customerWalletAddress: borrowerAddress,
        },
      },
    ).catch(extractHttpErrorMessageThenThrow)
  }

  public static async fetchStartLoanBuyOpenSeaData(
    nftCollectionAddress: string,
    nftId: string,
    loanDurationDays: number,
    borrowerAddress: string,
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

  //
  // Nemeos Pool DirectMint mode
  //

  public static async fetchLivePriceDirectMintData(
    nftCollectionAddress: string,
    loanDurationDays: number,
    borrowerAddress: string,
  ): Promise<NftLivePriceDirectMintData> {
    return NemeosBackendClient.ofetchClient<NftLivePriceDirectMintData>(
      `/nftCollections/${nftCollectionAddress}/protocolVariant/directMint/livePriceData`,
      {
        query: {
          loanDurationDays,
          customerWalletAddress: borrowerAddress,
        },
      },
    ).catch(extractHttpErrorMessageThenThrow)
  }

  public static async fetchStartLoanDirectMintData(
    nftCollectionAddress: string,
    loanDurationDays: number,
    borrowerAddress: string,
    whitelistProof?: string[],
  ): Promise<NftStartLoanDirectMintData> {
    return NemeosBackendClient.ofetchClient<NftStartLoanDirectMintData>(
      `/nftCollections/${nftCollectionAddress}/protocolVariant/directMint/startLoanData`,
      {
        query: {
          loanDurationDays,
          customerWalletAddress: borrowerAddress,
          whitelistProof,
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

//
// Nemeos Pool BuyOpenSea mode
//

export type NftLivePriceBuyOpenSeaData = {
  nftFullLivePriceData: {
    /** @example "231" */
    nftId: string
    /** @example "4000000000000000000" */
    openSeaNftPrice: string
    /** @example "4" */
    openSeaNftPriceHuman: string
    /** @example "4" */
    openSeaNftPriceHumanShortRound: string
    /** @example "12686.2" */
    openSeaNftPriceHumanUSD: string
    /** @example "160000000000000003" */
    nemeosOracleNftCollectionFloorPrice: string
    /** @example "0.16" */
    nemeosOracleNftCollectionFloorPriceHuman: string
    /** @example "0.16" */
    nemeosOracleNftCollectionFloorPriceHumanShortRound: string
    /** @example "507.45" */
    nemeosOracleNftCollectionFloorPriceHumanUSD: string
    /** @example "3880000000000000000" */
    proposedUpfrontPaymentGivenPrices: string
    /** @example "3.88" */
    proposedUpfrontPaymentGivenPricesHuman: string
    /** @example "3.88" */
    proposedUpfrontPaymentGivenPricesHumanShortRound: string
    /** @example "12305.61" */
    proposedUpfrontPaymentGivenPricesHumanUSD: string
    /** @example "4000000000000000000" */
    openSeaNftCollectionFloorPrice: string
    /** @example "4" */
    openSeaNftCollectionFloorPriceHuman: string
    /** @example "4" */
    openSeaNftCollectionFloorPriceHumanShortRound: string
    /** @example "12686.2" */
    openSeaNftCollectionFloorPriceHumanUSD: string
    /** @example "3171.55" */
    exchangeRateToUSD: string
    /** @example "120000000000000000" */
    remainingToPayPrice: string
    /** @example "0.12" */
    remainingToPayPriceHuman: string
    /** @example "0.12" */
    remainingToPayPriceHumanShortRound: string
    /** @example "380.59" */
    remainingToPayPriceHumanUSD: string
    /** @example "121464000000000000" */
    remainingToPayPriceWithInterests: string
    /** @example "0.121464" */
    remainingToPayPriceWithInterestsHuman: string
    /** @example "0.121" */
    remainingToPayPriceWithInterestsHumanShortRound: string
    /** @example "385.23" */
    remainingToPayPriceWithInterestsHumanUSD: string
    /** @example "1464000000000000" */
    interestsToPay: string
    /** @example "0.001464" */
    interestsToPayHuman: string
    /** @example "0.001" */
    interestsToPayHumanShortRound: string
    /** @example "4.64" */
    interestsToPayHumanUSD: string
    /** @example "4001464000000000000" */
    totalLoanPrice: string
    /** @example "4.001464" */
    totalLoanPriceHuman: string
    /** @example "4.001" */
    totalLoanPriceHumanShortRound: string
    /** @example "12690.84" */
    totalLoanPriceHumanUSD: string
    /** @example 3 */
    numberOfInstallments: number
    paySchedule: Array<{
      /** @example "3880000000000000000" */
      toPay: string
      /** @example "3.88" */
      toPayHuman: string
      /** @example "3.88" */
      toPayHumanShortRound: string
      /** @example "12305.61" */
      toPayHumanUSD: string
      /** @example "1721947310346" */
      unixTimestampMs: string
      /** @example "Friday, July 26" */
      dateTimeHuman: string
      /** @example "2024-07-25T22:41:50.346Z" */
      dateTimeJSON: string
    }>
  }
  nftPoolLiveData: {
    /** @example "0x3a668917C167dfa823b2816e782704444503078D" */
    nftPoolAddress: string
    /** @example "25" */
    minimalDepositPercent: string
    /** @example "25" */
    minimalDepositPercentHuman: string
    /** @example "7" */
    yearlyInterestPercent: string
    /** @example "7" */
    yearlyInterestPercentHuman: string
    /** @example "5.6000000000000005" */
    yearlyLiquidityProviderProfitsEstimationPercent: string
    /** @example "5.6" */
    yearlyLiquidityProviderProfitsEstimationPercentHuman: string
    /** @example "309586878710840000" */
    availableLiquidity: string
    /** @example "0.30958687871084" */
    availableLiquidityHuman: string
    /** @example "0.31" */
    availableLiquidityHumanShortRound: string
    /** @example "981.87" */
    availableLiquidityHumanUSD: string
    /** @example "0" */
    liquidityLockedInLoans: string
    /** @example "0" */
    liquidityLockedInLoansHuman: string
    /** @example "0" */
    liquidityLockedInLoansHumanShortRound: string
    /** @example "0" */
    liquidityLockedInLoansHumanUSD: string
    /** @example "309586878710840000" */
    totalValueLocked: string
    /** @example "0.30958687871084" */
    totalValueLockedHuman: string
    /** @example "0.31" */
    totalValueLockedHumanShortRound: string
    /** @example "981.87" */
    totalValueLockedHumanUSD: string
    /** @example "3650" */
    maxYearlyLoanRate: string
    /** @example "43200" */
    vestingTimePerBasisPoint: string
    /** @example 0 */
    currentOngoingLoansCount: number
    /** @example 3 */
    allTimeLoansCount: number
  }
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

//
// Nemeos Pool DirectMint mode
//

export type NftLivePriceDirectMintData = {
  nftFullLivePriceData: {
    /** @example "231" */
    nextMintNftId: string
    /** @example "100000000000000000" */
    mintPrice: string
    /** @example "0.1" */
    mintPriceHuman: string
    /** @example "0.1" */
    mintPriceHumanShortRound: string
    /** @example "316.55" */
    mintPriceHumanUSD: string
    /** @example "25000000000000000" */
    proposedUpfrontPaymentGivenPrices: string
    /** @example "0.025" */
    proposedUpfrontPaymentGivenPricesHuman: string
    /** @example "0.025" */
    proposedUpfrontPaymentGivenPricesHumanShortRound: string
    /** @example "79.14" */
    proposedUpfrontPaymentGivenPricesHumanUSD: string
    /** @example "3165.45" */
    exchangeRateToUSD: string
    /** @example "75000000000000000" */
    remainingToPayPrice: string
    /** @example "0.075" */
    remainingToPayPriceHuman: string
    /** @example "0.075" */
    remainingToPayPriceHumanShortRound: string
    /** @example "237.41" */
    remainingToPayPriceHumanUSD: string
    /** @example "76372500000000000" */
    remainingToPayPriceWithInterests: string
    /** @example "0.0763725" */
    remainingToPayPriceWithInterestsHuman: string
    /** @example "0.076" */
    remainingToPayPriceWithInterestsHumanShortRound: string
    /** @example "241.75" */
    remainingToPayPriceWithInterestsHumanUSD: string
    /** @example "1372500000000000" */
    interestsToPay: string
    /** @example "0.0013725" */
    interestsToPayHuman: string
    /** @example "0.001" */
    interestsToPayHumanShortRound: string
    /** @example "4.34" */
    interestsToPayHumanUSD: string
    /** @example "101372500000000000" */
    totalLoanPrice: string
    /** @example "0.1013725" */
    totalLoanPriceHuman: string
    /** @example "0.101" */
    totalLoanPriceHumanShortRound: string
    /** @example "320.89" */
    totalLoanPriceHumanUSD: string
    /** @example 3 */
    numberOfInstallments: number
    paySchedule: Array<{
      /** @example "25000000000000000" */
      toPay: string
      /** @example "0.025" */
      toPayHuman: string
      /** @example "0.025" */
      toPayHumanShortRound: string
      /** @example "79.14" */
      toPayHumanUSD: string
      /** @example "1721946366176" */
      unixTimestampMs: string
      /** @example "Friday, July 26" */
      dateTimeHuman: string
      /** @example "2024-07-25T22:26:06.176Z" */
      dateTimeJSON: string
    }>
  }
  nftPoolLiveData: {
    /** @example "0xf4180C986Aec6f8fAdc6eFe4A0eC237c819AC074" */
    nftPoolAddress: string
    /** @example "25" */
    minimalDepositPercent: string
    /** @example "25" */
    minimalDepositPercentHuman: string
    /** @example "10" */
    yearlyInterestPercent: string
    /** @example "10" */
    yearlyInterestPercentHuman: string
    /** @example "8" */
    yearlyLiquidityProviderProfitsEstimationPercent: string
    /** @example "8" */
    yearlyLiquidityProviderProfitsEstimationPercentHuman: string
    /** @example "100000000000000000" */
    availableLiquidity: string
    /** @example "0.1" */
    availableLiquidityHuman: string
    /** @example "0.1" */
    availableLiquidityHumanShortRound: string
    /** @example "316.55" */
    availableLiquidityHumanUSD: string
    /** @example "0" */
    liquidityLockedInLoans: string
    /** @example "0" */
    liquidityLockedInLoansHuman: string
    /** @example "0" */
    liquidityLockedInLoansHumanShortRound: string
    /** @example "0" */
    liquidityLockedInLoansHumanUSD: string
    /** @example "100000000000000000" */
    totalValueLocked: string
    /** @example "0.1" */
    totalValueLockedHuman: string
    /** @example "0.1" */
    totalValueLockedHumanShortRound: string
    /** @example "316.55" */
    totalValueLockedHumanUSD: string
    /** @example "3650" */
    maxYearlyLoanRate: string
    /** @example "43200" */
    vestingTimePerBasisPoint: string
    /** @example 0 */
    currentOngoingLoansCount: number
    /** @example 0 */
    allTimeLoansCount: number
  }
}

export type NftStartLoanDirectMintData = {
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
    /** Address of the crowdsale contract that will process the NFT payment */
    crowdsaleContractAddress: string
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
    /**
     * Duration of the loan in seconds
     *
     * `loanDurationDays * 24 * 60 * 60`
     */
    loanDurationInSeconds: number
    /** Extra data of the order */
    orderExtraData: string
    /** Signature of the oracle */
    oracleSignature: string
    /** Array of proof elements for verification purposes */
    proof: string[]
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
