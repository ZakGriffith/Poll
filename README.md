## 🏗 Scaffold-Eth Poll Voting

---

A quick and easy contract to deploy an on-chain poll.  In the contract, enter the number of voting options you will need, voter whitelist, and timeleft then deploy your poll to the network of your choice.
Options are displayed on the front end, currently hard coded for a quick implementation.  Enter your info as necessary in App.jsx.

Each option currently allows values of 0-100 with each voter getting a total of 100 votes to spread out between the options as they see fit.

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

---

### To Do:

* Port to Scaffold-ETH2
* Create the contract to allow multiple polls.  Anyone can create and poll with open voting or a vote whitelist.  Only those on the whitelist will be able to see that poll.
* Allow easy entry of voting options and whitelists.  Maybe a copy/paste comma seperated lists into the front end?
* Allow a variable vote count per voter.
* Allow multiple voter contribution levels, some will get more votes than others.

