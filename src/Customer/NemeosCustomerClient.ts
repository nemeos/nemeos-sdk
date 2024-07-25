import { ethers } from 'ethers'
import { CustomerData, NemeosBackendClient, NemeosLoginSignature } from '../NemeosBackendClient.js'

export class NemeosCustomerClient {
  constructor(private readonly signer: ethers.Signer, private readonly enableLogging: boolean) {}

  /**
   * Trigger a signature request to the wallet. This signature is used to ensure that the customer is the owner of the wallet when
   * interacting with the Nemeos backend.
   *
   * The signature is valid for a few days.
   */
  public async requestLoginSignature(): Promise<NemeosLoginSignature> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(`[nemeos][generateLoginSignature] Requesting wallet signature for borrowerAddress=${borrowerAddress}`)
    }
    return NemeosBackendClient.generateLoginSignature(this.signer)
  }

  /**
   * Fetch the customer data associated with the wallet address.
   *
   * @param loginSignature Signature to ensure that the customer is the owner of the wallet
   */
  public async fetchCustomerData(loginSignature: NemeosLoginSignature): Promise<CustomerData> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(`[nemeos][fetchCustomerData] Fetching customer data for borrowerAddress=${borrowerAddress}`)
    }
    return NemeosBackendClient.fetchCustomerData(borrowerAddress, loginSignature)
  }

  /**
   * Register the wallet to an email address. This is used to send email notifications and reminders to customers about their loans.
   *
   * The email address will not be broadcasted on the blockchain. It is only stored in Nemeos backend database.
   *
   * @param loginSignature Signature to ensure that the customer is the owner of the wallet
   * @param customerEmail Email address to associate with the wallet address
   */
  public async registerEmail(loginSignature: NemeosLoginSignature, customerEmail: string): Promise<void> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(`[nemeos][registerEmail] Registering customerEmail=${customerEmail} for borrowerAddress=${borrowerAddress}...`)
    }
    await NemeosBackendClient.setCustomerDataEmail(borrowerAddress, loginSignature, customerEmail)
    if (this.enableLogging) {
      console.log(
        `[nemeos][registerEmail] Successfully registered customerEmail=${customerEmail} ` + `for borrowerAddress=${borrowerAddress}!`,
      )
    }
  }

  /**
   * Unregister the wallet from its associated email address. The customer will no longer receive email notifications and reminders.
   *
   * This will remove the email address from the Nemeos backend database.
   *
   * @param loginSignature Signature to ensure that the customer is the owner of the wallet
   */
  public async unregisterEmail(loginSignature: NemeosLoginSignature): Promise<void> {
    const borrowerAddress = await this.signer.getAddress()

    if (this.enableLogging) {
      console.log(`[nemeos][unregisterEmail] Unregistering email for borrowerAddress=${borrowerAddress}...`)
    }
    await NemeosBackendClient.deleteCustomerDataEmail(borrowerAddress, loginSignature)
    if (this.enableLogging) {
      console.log(`[nemeos][unregisterEmail] Successfully unregistered email for borrowerAddress=${borrowerAddress}!`)
    }
  }
}
