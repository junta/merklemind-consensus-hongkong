# MerkleMind Bot

a Telegram bot designed for a private cryptocurrency investment community, integrating an AI-driven trading agent to recommend **LONG/SHORT trading pairs** daily.

To ensure collective decision-making, the AI agent analyze market trade data, and propose the best LONG/SHORT trading pairs, then **creates a poll** within the Telegram group. A trade is executed **only if a predefined number of votes approve the proposed pair**.

While anyone can join the Telegram group, voting privileges are restricted to users who **deposit USDC into the AI agent**. The AI agent manages user shares dynamically, calculating ownership based on the **total assets under management and the outstanding shares at any given time**.

At its core, the AI agent leverages the **Merkle Trade TypeScript library** to facilitate secure deposits and seamless trade execution. This approach ensures transparency, fairness, and decentralized decision-making within the investment community.
