// @ts-check

import * as ethers from 'ethers'
import { NemeosSDK } from '../dist/index.js'

import { config } from 'dotenv'
config()

async function main() {
  if (!process.env.WALLET_PRIVATE_KEY || !process.env.INFURA_ENDPOINT_WITH_API_KEY) {
    const missingVariables = Object.entries({
      WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY,
      INFURA_ENDPOINT_WITH_API_KEY: process.env.INFURA_ENDPOINT_WITH_API_KEY,
    })
      .filter(([_, value]) => !value)
      .map(([key]) => key)
      .join(', ')
    throw new Error(`Missing environment variables: ${missingVariables}.`)
  }

  const provider = new ethers.JsonRpcProvider(process.env.INFURA_ENDPOINT_WITH_API_KEY)
  const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider)

  const nemeosSdk = new NemeosSDK(wallet, {
    nemeosBackendEnvironment: NemeosSDK.NemeosBackendEnvironment.Development,
  })
  // const nemeosSdk = new NemeosSDK(wallet, { enableLogging: true })

  //
  // NemeosCustomerClient
  //

  const nemeosCustomerClient = nemeosSdk.getNemeosCustomerClient()

  const loginSignature = await nemeosCustomerClient.requestLoginSignature()
  console.log('loginSignature:', loginSignature)

  await nemeosCustomerClient.unregisterEmail(loginSignature)

  const customerDataBeforeEmailRegistration = await nemeosCustomerClient.fetchCustomerData(loginSignature)
  console.log('customerData before email registration:', customerDataBeforeEmailRegistration)

  await nemeosCustomerClient.registerEmail(loginSignature, 'nemeos.hello.testing1234@yopmail.com')

  const customerDataAfterEmailRegistration = await nemeosCustomerClient.fetchCustomerData(loginSignature)
  console.log('customerData after email registration:', customerDataAfterEmailRegistration)

  //
  // NemeosPoolBuyOpenSeaClient
  //

  const nemeosPoolBuyOpenSeaAddress = '0x812db15b8Bb43dBA89042eA8b919740C23aD48a3'
  const nftCollectionCyberKongzAddress = '0x15cd1cfCd48C06cfC44D433D66C7a9fE06b2C2c3'
  const nftId1 = '231'
  const loanDurationDays1 = 90

  const nemeosPoolBuyOpenSeaClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress: nemeosPoolBuyOpenSeaAddress,
    nftCollectionAddress: nftCollectionCyberKongzAddress,
    nemeosPoolMode: NemeosSDK.NemeosPoolMode.BuyOpenSea,
  })

  const loan1 = await nemeosPoolBuyOpenSeaClient.previewLoan(nftId1, loanDurationDays1)
  console.dir(loan1, { depth: null })
  await nemeosPoolBuyOpenSeaClient.startLoan(nftId1, loanDurationDays1)
  await new Promise(res => setTimeout(res, 10_000))

  await nemeosPoolBuyOpenSeaClient.retrieveLoan(nftId1)
  await nemeosPoolBuyOpenSeaClient.payNextLoanStep(nftId1)
  await new Promise(res => setTimeout(res, 3_000))

  await nemeosPoolBuyOpenSeaClient.retrieveLoan(nftId1)
  await nemeosPoolBuyOpenSeaClient.payNextLoanStep(nftId1)
  await new Promise(res => setTimeout(res, 3_000))

  await nemeosPoolBuyOpenSeaClient.retrieveLoan(nftId1)

  //
  // NemeosPoolDirectMintClient
  //

  const nemeosPoolDirectMintAddress = '0x4d09110F392C93D8f3e9843F0aBA40F6aB839C11'
  const nftCollectionWaldosAddress = '0x0518EbdD8dE2cEAE8eaeD1c5cd93234bA14E75d0'
  const loanDurationDays2 = 61

  const nemeosPoolDirectMintClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress: nemeosPoolDirectMintAddress,
    nftCollectionAddress: nftCollectionWaldosAddress,
    nemeosPoolMode: NemeosSDK.NemeosPoolMode.DirectMint,
  })

  console.log('Calling previewLoan...')
  const loan2 = await nemeosPoolDirectMintClient.previewLoan(loanDurationDays2)
  console.dir(loan2, { depth: null })
  // console.log('Calling isWhitelistedAddress...')
  // await nemeosPoolDirectMintClient.isWhitelistedAddress(['0x0'])
  console.log('Calling startLoan...')
  await nemeosPoolDirectMintClient.startLoan(loanDurationDays2)
  await new Promise(res => setTimeout(res, 10_000))

  console.log('Calling retrieveLoan 1...')
  await nemeosPoolDirectMintClient.retrieveLoan(loan2.nftFullLivePriceData.nextMintNftId)
  console.log('Calling payNextLoanStep 1...')
  await nemeosPoolDirectMintClient.payNextLoanStep(loan2.nftFullLivePriceData.nextMintNftId)
  await new Promise(res => setTimeout(res, 3_000))

  console.log('Calling retrieveLoan 2...')
  await nemeosPoolDirectMintClient.retrieveLoan(loan2.nftFullLivePriceData.nextMintNftId)
  console.log('Calling payNextLoanStep 2...')
  await nemeosPoolDirectMintClient.payNextLoanStep(loan2.nftFullLivePriceData.nextMintNftId)
  await new Promise(res => setTimeout(res, 3_000))

  console.log('Calling retrieveLoan 3...')
  await nemeosPoolDirectMintClient.retrieveLoan(loan2.nftFullLivePriceData.nextMintNftId)
  console.log('Calling payNextLoanStep 3...')
  await nemeosPoolDirectMintClient.payNextLoanStep(loan2.nftFullLivePriceData.nextMintNftId)
}

main().catch(console.error)
