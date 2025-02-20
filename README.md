# MerkleMind Bot
I’m looking to build a telegram bot for a private crypto investment community that uses an AI agent to recommend a LONG/SHORT trading pair for the day.
However, in order to execute it, the AI need to create a poll in the telegram group and only if there are x votes that agree with the pair trade, then it will execute the trade.
Anyone can join this Telegram group but in order to vote, they need to deposit USDC into the AI Agent. The AI agent will then keep track of the shares they get based on the current number of shares outstanding and how much total value the agent is managing. Underneath the hood, the AI agent uses the Merkle Trade ts lib to handle deposits and trade executions.
This telegram should be able to send notification on trade actions to the group.


## Work Assignment for AI Agent Development

### Developer 1: AI Core and Decision-Making

#### Focus: This developer will handle the AI agent’s core functionality, including generating trading recommendations, analyzing data, and making trade execution decisions.

#### Assigned Stories:
Generating Trading Recommendations
Implement market data analysis and trading pair recommendation logic.
Add functionality to explain the rationale behind recommendations.
Trade Execution Decision
Develop logic to decide whether to execute trades based on poll results and rules.
Integrate notifications for trade decisions.

### Developer 2: Integration and User Interaction

#### Focus: This developer will work on integrating the AI agent with the Telegram bot, managing user deposits, and handling voting power calculations.

#### Assigned Stories:
Poll Creation and Voting Integration
Implement poll creation in the Telegram group.
Track poll results and integrate them with trade execution logic.
USDC Deposit and Share Management
Verify deposits and calculate voting power based on shares.
Securely manage deposited funds.
Admin Configuration
Build tools for configuring AI trading parameters and monitoring performance


## ENV
7678337507:AAGcpv43ylWmMbEwEkif2DNJC_ikVuIZzBU
