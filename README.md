# Event Ticket NFT Contract

This Hardhat project contains an OpenZeppelin ERC-721 contract for paid event tickets.

## Commands

```bash
npm install
npm run compile
npm run test:contracts
npx hardhat run scripts/deploy.js
```

`createEvent` is restricted to the deployer/owner. `mintTicket` requires the exact price in wei and records the corresponding event ID for every ticket. The ticket's `tokenURI` is `events/{eventId}/tickets/{tokenId}`, which a front end can resolve against its metadata service.
