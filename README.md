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

### Initialize

#### Node.js

```ts
import * as ethers from 'ethers'
import { NemeosSDK } from 'nemeos-sdk'

const provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT_WITH_API_KEY)
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

const nemeosSdk = new NemeosSDK(wallet)
```

#### Browser

##### Using `ethers.js`

```ts
import * as ethers from 'ethers'
import { NemeosSDK } from 'nemeos-sdk'

const provider = new ethers.BrowserProvider(window.ethereum)
const signer = await provider.getSigner()

const nemeosSdk = new NemeosSDK(signer)
```

##### Using `window.ethereum`

```ts
import { NemeosSDK, getBrowserProvider } from 'nemeos-sdk'

const provider = getBrowserProvider(window.ethereum)
const signer = await provider.getSigner()
const nemeosSdk = new NemeosSDK(signer)
```

### Pool methods

#### Connect to a pool

```ts
const nemeosPool = nemeosSdk.getPool({
  nemeosPoolAddress: '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3',
  nftCollectionAddress: '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3',
})
```

#### Register a customer email address

Register the wallet to an email address. The customer will be able to receive notifications and reminders about their loans.

This call will trigger a signature request to the wallet. This is to ensure that the customer is the owner of the wallet.

```ts
const emailAddress = 'nemeos-sdk-example@yopmail.com'
await nemeosPool.registerCustomerEmailAddress(emailAddress)
```

#### Start a loan

```ts
try {
  const nftId = 224
  const loanDurationDays = 90
  const tx = await nemeosPool.startLoan(nftId, loanDurationDays)

  console.log('Starting loan success! Transaction hash:', tx.hash)
} catch (error) {
  console.error('Starting loan failed!', error.message)
  throw error
}
```

#### Retrieve a loan

```ts
const nftId = 224
const loan = await nemeosPool.retrieveLoan(nftId)
```

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

#### Pay the next loan step

```ts
try {
  const nftId = 224
  const tx = await nemeosPool.payNextLoanStep(nftId)

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
# Using ethers.js
parcel tests/testEthersJs.html

# Using window.ethereum
parcel tests/testWindowEthereum.html
```

Then open a server, for example with [`serve`](https://github.com/vercel/serve)

```bash
serve dist/ -p 5555
```

## License

[The MIT License](./LICENSE)
