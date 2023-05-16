## 🏗 Scaffold-Eth Poll Voting

---

A quick and easy contract to deploy an on-chain poll.  In the contract, enter the number of voting options you will need, voter whitelist, and timeleft then deploy your poll to the network of your choice.
Options are displayed on the front end, currently hard coded for a quick implementation.  Enter your info as necessary in App.jsx.

Each option currently allows valuesof 0-100 with each voter getting a total of 100 votes to spread out between the options as they see fit.

---


### Quick Start

```bash
git clone https://github.com/ZakGriffith/Poll.git 
cd poll
yarn install
```

In three seperate terminal windows in the poll directory:

```bash
yarn chain
yarn start
yarn deploy
```

