<div align="center">
	<br>
	<br>
	<img width="360" src="logo_full_blue.png" alt="Nemeos logo" />
	<br>
	<br>

Building new web3 economies.

[![npm package](https://img.shields.io/npm/v/nemeos-sdk.svg?logo=npm)](https://www.npmjs.com/package/nemeos-sdk)
[![npm downloads](https://img.shields.io/npm/dw/nemeos-sdk)](https://www.npmjs.com/package/nemeos-sdk)
[![license](https://img.shields.io/npm/l/nemeos-sdk?color=blue)](./LICENSE)

</div>

<p align="center">
  <a href="https://x.com/Nemeos_Finance" target="_blank"><img src="https://img.shields.io/twitter/follow/Nemeos_Finance.svg?style=social&label=@Nemeos_Finance"></a>
</p>

# Nemeos SDK

Nemeos SDK to facilitate integration with the [Nemeos](https://nemeos.finance) platform.

## Install

```bash
pnpm install nemeos-sdk
```

## Usage

**Note:** This is a [pure ESM package](https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c). If you are using CommonJS, you can use a bundler or import using dynamic `import()`.

```js
// ESM / TypeScript
import { NemeosSDK } from 'nemeos-sdk'

// CommonJS
const { NemeosSDK } = await import('nemeos-sdk')
```

### Initialize SDK

#### Node.js

```ts
import * as ethers from 'ethers'
import { NemeosSDK } from 'nemeos-sdk'

const provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT_WITH_API_KEY)
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

const nemeosSdk = new NemeosSDK(wallet, {
  enableLogging: true, // Enable logging to the console - Optional, default: `true`
  nemeosBackendEnvironment: NemeosSDK.NemeosBackendEnvironment.Production, // Optional, default: `Production`
})
```

#### Browser

##### Using `ethers.js`

```ts
import * as ethers from 'ethers'
import { NemeosSDK } from 'nemeos-sdk'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const nemeosSdk = new NemeosSDK(signer, {
  enableLogging: true, // Enable logging to the console - Optional, default: `true`
  nemeosBackendEnvironment: NemeosSDK.NemeosBackendEnvironment.Production, // Optional, default: `Production`
})
```

##### Using `window.ethereum`

```ts
import { NemeosSDK, getBrowserProvider } from 'nemeos-sdk'

const provider = getBrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const nemeosSdk = new NemeosSDK(signer, {
  enableLogging: true, // Enable logging to the console - Optional, default: `true`
  nemeosBackendEnvironment: NemeosSDK.NemeosBackendEnvironment.Production, // Optional, default: `Production`
})
```

### Nemeos Customer Client

The Nemeos Customer Client is used to interact with the Nemeos backend to manage customer data.

```ts
const nemeosCustomerClient = nemeosSdk.getNemeosCustomerClient()
```

#### Generate login signature

Trigger a signature request to the wallet. This signature is used to ensure that the customer is the owner of the wallet when interacting with the Nemeos backend.

The signature is valid for a few days.

```ts
const loginSignature = await nemeosCustomerClient.requestLoginSignature()
```

#### Fetch customer data

Fetch the customer data associated with the wallet address.

```ts
const customerData = await nemeosCustomerClient.fetchCustomerData(loginSignature)
```

#### Register email

Register the wallet to an email address. This is used to send email notifications and reminders to customers about their loans.

The email address will not be broadcasted on the blockchain. It is only stored in Nemeos backend database.

```ts
const emailAddress = 'nemeos-sdk-example@yopmail.com'
await nemeosCustomerClient.registerEmail(loginSignature, emailAddress)
```

#### Unregister email

Unregister the wallet from its associated email address. The customer will no longer receive email notifications and reminders.

This will remove the email address from the Nemeos backend database.

```ts
await nemeosCustomerClient.unregisterEmail(loginSignature)
```

### Nemeos Pool Client

The Nemeos Pool Client is used to interact with Nemeos pools smart contracts on the blockchain.

```ts
const nemeosPoolClient = nemeosSdk.getNemeosPoolClient({
  nemeosPoolAddress: '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3',
  nftCollectionAddress: '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3',
  nemeosPoolMode: NemeosSDK.NemeosPoolMode.BuyOpenSea, // Can be `BuyOpenSea` or `DirectMint`
})
```

### Preview a loan

```ts
try {
  // Preview loan for Nemeos Pool `BuyOpenSea` mode
  const nftId = '231'
  const loanDurationDays = 61
  const loanData = await nemeosPoolBuyOpenSeaClient.previewLoan(nftId, loanDurationDays)

  // Preview loan for Nemeos Pool `DirectMint` mode
  const loanDurationDays = 61
  const loanData2 = await nemeosPoolDirectMintClient.previewLoan(loanDurationDays)

  console.log('Preview loanData:', loanData)
  console.log('Preview loanData2:', loanData2)
} catch (error) {
  console.error('Preview loan failed!', error.message)
  throw error
}
```

<details>
<summary>Click to show type: Loan preview for Nemeos Pool `BuyOpenSea` mode</summary>
  
```ts
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
```
</details>

<details>
<summary>Click to show type: Loan preview for Nemeos Pool `DirectMint` mode</summary>
  
```ts
export type NftLivePriceDirectMintData = {
  nftFullLivePriceData: {
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
```
</details>

#### Start a loan

```ts
try {
  // Start loan for Nemeos Pool `BuyOpenSea` mode
  const nftId = '224'
  const loanDurationDays = 90
  const tx = await nemeosPoolBuyOpenSeaClient.startLoan(nftId, loanDurationDays)

  // Start loan for Nemeos Pool `DirectMint` mode
  const loanDurationDays = 90
  const whitelistProof = ['0x1234567890123456789012345678901234567890'] // Optional, necessary if there is a whitelist
  const tx2 = await nemeosPoolDirectMintClient.startLoan(loanDurationDays, whitelistProof)

  console.log('Starting loan success! Transaction hash:', tx.hash)
} catch (error) {
  console.error('Starting loan failed!', error.message)
  throw error
}
```

#### Retrieve a loan

```ts
const nftId = '224'
const loan = await nemeosPoolClient.retrieveLoan(nftId)
```

<details>
<summary>Type: Loan</summary>
  
```ts
type Loan = {
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
```
</details>

#### Pay the next loan step

```ts
try {
  const nftId = '224'
  const tx = await nemeosPoolClient.payNextLoanStep(nftId)

  console.log('Paying next loan step success! Transaction hash:', tx.hash)
} catch (error) {
  console.error('Paying next loan step failed!', error.message)
  throw error
}
```

---

## Build

```bash
pnpm build
```

## Tests

### Test script

```bash
# touch .env, or set the environment variables in the command line
export NODE_ENV=development # to connect to Nemeos backend at http://localhost:3000
export WALLET_PRIVATE_KEY=43ac571235456515454565645445454546123121454848791215488877897123
export INFURA_ENDPOINT_WITH_API_KEY=https://sepolia.infura.io/v3/b3866123121321321231212132131123

node tests/test.mjs
```

### Browser test page

Build the test page and the required dependencies with Parcel

```bash
pnpm i --global parcel
```

```bash
parcel tests/browser/index.html
```

## License

[The MIT License](./LICENSE)
