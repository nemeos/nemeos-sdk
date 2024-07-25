// @ts-check

import * as ethers from 'ethers'
import { NemeosSDK } from '../dist/index.js'

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

  const nemeosSdk = new NemeosSDK(wallet)
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

  const nemeosPoolBuyOpenSeaClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress: nemeosPoolBuyOpenSeaAddress,
    nftCollectionAddress: nftCollectionCyberKongzAddress,
    nemeosPoolMode: NemeosSDK.NemeosPoolMode.BuyOpenSea,
  })

  await nemeosPoolBuyOpenSeaClient.startLoan(224, 90)
  // await new Promise(res => setTimeout(res, 10_000))
  await nemeosPoolBuyOpenSeaClient.retrieveLoan(224)
  await nemeosPoolBuyOpenSeaClient.payNextLoanStep(224)
  await nemeosPoolBuyOpenSeaClient.retrieveLoan(224)
  await nemeosPoolBuyOpenSeaClient.payNextLoanStep(224)
  await nemeosPoolBuyOpenSeaClient.retrieveLoan(224)

  //
  // NemeosPoolDirectMintClient
  //

  const nemeosPoolDirectMintAddress = '0x0000000000000000000000000000000000000000'
  const nftCollectionWaldosAddress = '0x53ca73EE747ceD027c677feCCC13b885f31Ee4dF'

  const nemeosPoolDirectMintClient = nemeosSdk.getNemeosPoolClient({
    nemeosPoolAddress: nemeosPoolDirectMintAddress,
    nftCollectionAddress: nftCollectionWaldosAddress,
    nemeosPoolMode: NemeosSDK.NemeosPoolMode.DirectMint,
  })

  await nemeosPoolDirectMintClient.startLoan(224, 90)
  // await new Promise(res => setTimeout(res, 10_000))
  await nemeosPoolDirectMintClient.retrieveLoan(224)
  await nemeosPoolDirectMintClient.payNextLoanStep(224)
  await nemeosPoolDirectMintClient.retrieveLoan(224)
  await nemeosPoolDirectMintClient.payNextLoanStep(224)
  await nemeosPoolDirectMintClient.retrieveLoan(224)
}

main().catch(console.error)
