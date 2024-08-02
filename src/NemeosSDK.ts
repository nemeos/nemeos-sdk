import * as ethers from 'ethers'
import { NemeosCustomerClient } from './Customer/NemeosCustomerClient.js'
import { NemeosPoolBuyOpenSeaClient } from './Pool/NemeosPoolBuyOpenSeaClient.js'
import { NemeosPoolDirectMintClient } from './Pool/NemeosPoolDirectMintClient.js'
import { assertValidHexAddress } from './utils.js'
import { NemeosPoolMode } from './constants.js'
import { NemeosBackendClient, NemeosBackendEnvironment } from './NemeosBackendClient.js'

export const getBrowserProvider = (windowEthereum: ethers.Eip1193Provider) => {
  return new ethers.BrowserProvider(windowEthereum)
}

export class NemeosSDK {
  private readonly enableLogging: boolean

  constructor(
    private readonly signer: ethers.Signer,
    options?: {
      /** Enable logging to the console - Optional, default: `true` */
      enableLogging?: boolean
      /** Nemeos Backend environment - Optional, default: `NemeosBackendEnvironment.Production` */
      nemeosBackendEnvironment?: NemeosBackendEnvironment
    },
  ) {
    this.enableLogging = options?.enableLogging === undefined ? true : options.enableLogging
    NemeosBackendClient.setEnvironment(options?.nemeosBackendEnvironment || NemeosBackendEnvironment.Production)
  }

  public getNemeosCustomerClient(): NemeosCustomerClient {
    return new NemeosCustomerClient(this.signer, this.enableLogging)
  }

  public getNemeosPoolClient<T extends NemeosPoolMode>(params: {
    nftCollectionAddress: string
    nemeosPoolAddress: string
    nemeosPoolMode: T
  }): T extends NemeosPoolMode.BuyOpenSea
    ? NemeosPoolBuyOpenSeaClient
    : T extends NemeosPoolMode.DirectMint
    ? NemeosPoolDirectMintClient
    : never {
    assertValidHexAddress(params.nftCollectionAddress)
    assertValidHexAddress(params.nemeosPoolAddress)

    switch (params.nemeosPoolMode) {
      case NemeosPoolMode.BuyOpenSea:
        return new NemeosPoolBuyOpenSeaClient(this.signer, this.enableLogging, params.nftCollectionAddress, params.nemeosPoolAddress) as any
      case NemeosPoolMode.DirectMint:
        return new NemeosPoolDirectMintClient(this.signer, this.enableLogging, params.nftCollectionAddress, params.nemeosPoolAddress) as any
      default:
        throw new Error(
          `Unsupported Nemeos Pool mode: ${(params as any).nemeosPoolMode}, supported modes: ${Object.values(NemeosPoolMode).join(', ')}`,
        )
    }
  }

  public static NemeosPoolMode = NemeosPoolMode
  public static NemeosBackendEnvironment = NemeosBackendEnvironment
}
