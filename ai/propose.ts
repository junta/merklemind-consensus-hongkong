import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();
import { MerkleClient, MerkleClientConfig } from "@merkletrade/ts-sdk";
import axios from "axios";
import _ from "lodash";

export async function propose(): Promise<object[]> {
  const merkle = new MerkleClient(await MerkleClientConfig.mainnet());

  const response = await axios.get(
    "https://api.merkle.trade/v1/indexer/trading/pairstate"
  );
  const pairStateData = response.data;

  const filteredPair = pairStateData.map(({ pairType, fundingRate }) => ({
    pairType,
    fundingRate,
  }));

  const pairWithId = filteredPair.map((item) => ({
    ...item,
    id: item.pairType.split("::pair_types::")[1], // Extract pairSymbol
  }));

  const summary = await merkle.api.getSummary();

  const priceWithDiff = summary.prices.map((item) => ({
    ...item,
    priceDiff1D: item.price - item.price24ago,
  }));

  const mergedData = _.mergeWith(
    _.keyBy(pairWithId, "id"),
    _.keyBy(priceWithDiff, "id"),
    (objValue, srcValue) => {
      if (_.isObject(objValue) && _.isObject(srcValue)) {
        return _.merge(objValue, srcValue);
      }
      return objValue || srcValue;
    }
  );

  //   console.log(Object.values(mergedData));

  const Token = z.object({
    id: z.string(),
    explanation: z.string(),
  });

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const content = `Take the below input data for each token and return the best token id we should buy

Input:
     ${JSON.stringify(Object.values(mergedData), null, 2)}
     
Sample Output: 
     {id: "BTC_USD", 
      explanation: "your reasoning text"
}`;
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    store: true,
    response_format: zodResponseFormat(Token, "token"),
    messages: [
      {
        role: "system",
        content:
          "You are a professional crypto trader. Guide the user by analyzing the provided token data.",
      },
      { role: "user", content: content },
    ],
  });

  const text = completion.choices[0].message;

  const parsedData = JSON.parse(text.content);
  parsedData["side"] = "long";

  console.log(parsedData);

  const contentSell = `Take the below input data for each token and return the best token id we should sell. Please make sure to exclude ${
    parsedData.id
  } from the list.

  Input:
       ${JSON.stringify(Object.values(mergedData), null, 2)}
       
  Sample Output: 
       {id: "BTC_USD", 
        explanation: "your reasoning text"
  }`;
  const completionSell = await openai.chat.completions.create({
    model: "gpt-4o",
    store: true,
    response_format: zodResponseFormat(Token, "token"),
    messages: [
      {
        role: "system",
        content:
          "You are a professional crypto trader. Guide the user by analyzing the provided token data.",
      },
      { role: "user", content: contentSell },
    ],
  });

  const textSell = completionSell.choices[0].message;

  const parsedDataSell = JSON.parse(textSell.content);
  parsedDataSell["side"] = "short";

  console.log(parsedDataSell);

  return [parsedData, parsedDataSell];
}
