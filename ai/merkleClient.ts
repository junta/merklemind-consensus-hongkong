import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import { Aptos } from "@aptos-labs/ts-sdk";
import dotenv from "dotenv";
dotenv.config();
import { Ed25519PrivateKey } from "@aptos-labs/ts-sdk";

class MerkleOrderManager {
  private merkle: MerkleClient;
  private aptos: Aptos;
  private account: any;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.merkle = new MerkleClient(await MerkleClientConfig.mainnet());
    this.aptos = new Aptos(this.merkle.config.aptosConfig);
    this.account = await this.aptos.deriveAccountFromPrivateKey({
      privateKey: new Ed25519PrivateKey(process.env.APTOS_PRIVATE_KEY!),
    });
  }

  public async openOrder(longSymbol: string, shortSymbol: string) {
    await this.initialize();
    console.log(longSymbol);
    console.log(shortSymbol);
    const sizeDelta = 300_000_000n; // 300 USDC
    const collateralDelta = 3_000_000n; // 3 USDC
    const orderLong = await this.merkle.payloads.placeMarketOrder({
      pair: longSymbol,
      userAddress: this.account.accountAddress,
      sizeDelta,
      collateralDelta,
      isLong: true,
      isIncrease: true,
    });

    const committedTransactionLong = await this.aptos.transaction.build
      .simple({ sender: this.account.accountAddress, data: orderLong })
      .then((transaction) =>
        this.aptos.signAndSubmitTransaction({
          signer: this.account,
          transaction,
        })
      )
      .then(({ hash }) =>
        this.aptos.waitForTransaction({ transactionHash: hash })
      );

    // console.log(committedTransactionLong);
    console.log("Successfully placed open long order!");

    const orderSell = await this.merkle.payloads.placeMarketOrder({
      pair: shortSymbol,
      userAddress: this.account.accountAddress,
      sizeDelta,
      collateralDelta,
      isLong: false,
      isIncrease: true,
    });

    const committedTransactionSell = await this.aptos.transaction.build
      .simple({ sender: this.account.accountAddress, data: orderSell })
      .then((transaction) =>
        this.aptos.signAndSubmitTransaction({
          signer: this.account,
          transaction,
        })
      )
      .then(({ hash }) =>
        this.aptos.waitForTransaction({ transactionHash: hash })
      );

    console.log(committedTransactionSell);
    console.log("Successfully placed open short order!");
  }

  private async closePosition(symbol: string) {
    const positions = await this.merkle.getPositions({
      address: this.account.accountAddress.toString(),
    });

    const position = positions.find((position) =>
      position.pairType.endsWith(symbol)
    );
    if (!position) {
      throw new Error(`${symbol} position not found`);
    }

    const closePayload = this.merkle.payloads.placeMarketOrder({
      pair: symbol,
      userAddress: this.account.accountAddress,
      sizeDelta: position.size,
      collateralDelta: position.collateral,
      isLong: position.isLong,
      isIncrease: false,
    });

    const committedTransaction = await this.aptos.transaction.build
      .simple({ sender: this.account.accountAddress, data: closePayload })
      .then((transaction) =>
        this.aptos.signAndSubmitTransaction({
          signer: this.account,
          transaction,
        })
      )
      .then(({ hash }) =>
        this.aptos.waitForTransaction({ transactionHash: hash })
      );

    console.log(`Successfully placed close order for ${symbol}!`);
  }

  public async closeOrder(longSymbol: string, shortSymbol: string) {
    await this.initialize();
    console.log(longSymbol);
    console.log(shortSymbol);

    await this.closePosition(longSymbol);
    await this.closePosition(shortSymbol);
  }
}

export default MerkleOrderManager;
