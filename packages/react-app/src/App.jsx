import WalletConnectProvider from "@walletconnect/web3-provider";
//import Torus from "@toruslabs/torus-embed"
import WalletLink from "walletlink";
import { Alert, Button, Col, Menu, Row, List, Card, Input } from "antd";
import "antd/dist/antd.css";
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import Web3Modal from "web3modal";
import "./App.css";
import { Account, Address, Balance, Contract, Faucet, GasGauge, Header, Ramp, ThemeSwitch } from "./components";
import { INFURA_ID, NETWORK, NETWORKS } from "./constants";
import { Transactor } from "./helpers";
import {
  useBalance,
  useContractLoader,
  useContractReader,
  useGasPrice,
  useOnBlock,
  useUserProviderAndSigner,
} from "eth-hooks";
import { useEventListener } from "eth-hooks/events/useEventListener";
import { useExchangeEthPrice } from "eth-hooks/dapps/dex";
// import Hints from "./Hints";
import { ExampleUI, Hints, Subgraph } from "./views";

import { useContractConfig } from "./hooks";
import Portis from "@portis/web3";
import Fortmatic from "fortmatic";
import Authereum from "authereum";
import humanizeDuration from "humanize-duration";
import DisplayVariable from "./components/Contract/DisplayVariable";

const { ethers } = require("ethers");
/*
    Welcome to 🏗 scaffold-eth !

    Code:
    https://github.com/austintgriffith/scaffold-eth

    Support:
    https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA
    or DM @austingriffith on twitter or telegram

    You should get your own Infura.io ID and put it in `constants.js`
    (this is your connection to the main Ethereum network for ENS etc.)


    🌏 EXTERNAL CONTRACTS:
    You can also bring in contract artifacts in `constants.js`
    (and then use the `useExternalContractLoader()` hook!)
*/

/// 📡 What chain are your contracts deployed to?
const targetNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

// 😬 Sorry for all the console logging
const DEBUG = true;
const NETWORKCHECK = true;

// 🛰 providers
if (DEBUG) console.log("📡 Connecting to Mainnet Ethereum");
// const mainnetProvider = getDefaultProvider("mainnet", { infura: INFURA_ID, etherscan: ETHERSCAN_KEY, quorum: 1 });
// const mainnetProvider = new InfuraProvider("mainnet",INFURA_ID);
//
// attempt to connect to our own scaffold eth rpc and if that fails fall back to infura...
// Using StaticJsonRpcProvider as the chainId won't change see https://github.com/ethers-io/ethers.js/issues/901
const scaffoldEthProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://rpc.scaffoldeth.io:48544")
  : null;
const poktMainnetProvider = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider(
      "https://eth-mainnet.gateway.pokt.network/v1/lb/611156b4a585a20035148406",
    )
  : null;
const mainnetInfura = navigator.onLine
  ? new ethers.providers.StaticJsonRpcProvider("https://mainnet.infura.io/v3/" + INFURA_ID)
  : null;
// ( ⚠️ Getting "failed to meet quorum" errors? Check your INFURA_ID

// 🏠 Your local provider is usually pointed at your local blockchain
const localProviderUrl = targetNetwork.rpcUrl;
// as you deploy to other networks you can set REACT_APP_PROVIDER=https://dai.poa.network in packages/react-app/.env
const localProviderUrlFromEnv = process.env.REACT_APP_PROVIDER ? process.env.REACT_APP_PROVIDER : localProviderUrl;
if (DEBUG) console.log("🏠 Connecting to provider:", localProviderUrlFromEnv);
const localProvider = new ethers.providers.StaticJsonRpcProvider(localProviderUrlFromEnv);

// 🔭 block explorer URL
const blockExplorer = targetNetwork.blockExplorer;

// Coinbase walletLink init
const walletLink = new WalletLink({
  appName: "coinbase",
});

// WalletLink provider
const walletLinkProvider = walletLink.makeWeb3Provider(`https://mainnet.infura.io/v3/${INFURA_ID}`, 1);

// Portis ID: 6255fb2b-58c8-433b-a2c9-62098c05ddc9
/*
  Web3 modal helps us "connect" external wallets:
*/
const web3Modal = new Web3Modal({
  network: "mainnet", // Optional. If using WalletConnect on xDai, change network to "xdai" and add RPC info below for xDai chain.
  cacheProvider: true, // optional
  theme: "light", // optional. Change to "dark" for a dark theme.
  providerOptions: {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        bridge: "https://polygon.bridge.walletconnect.org",
        infuraId: INFURA_ID,
        rpc: {
          1: `https://mainnet.infura.io/v3/${INFURA_ID}`, // mainnet // For more WalletConnect providers: https://docs.walletconnect.org/quick-start/dapps/web3-provider#required
          42: `https://kovan.infura.io/v3/${INFURA_ID}`,
          100: "https://dai.poa.network", // xDai
        },
      },
    },
    portis: {
      display: {
        logo: "https://user-images.githubusercontent.com/9419140/128913641-d025bc0c-e059-42de-a57b-422f196867ce.png",
        name: "Portis",
        description: "Connect to Portis App",
      },
      package: Portis,
      options: {
        id: "6255fb2b-58c8-433b-a2c9-62098c05ddc9",
      },
    },
    fortmatic: {
      package: Fortmatic, // required
      options: {
        key: "pk_live_5A7C91B2FC585A17", // required
      },
    },
    // torus: {
    //   package: Torus,
    //   options: {
    //     networkParams: {
    //       host: "https://localhost:8545", // optional
    //       chainId: 1337, // optional
    //       networkId: 1337 // optional
    //     },
    //     config: {
    //       buildEnv: "development" // optional
    //     },
    //   },
    // },
    "custom-walletlink": {
      display: {
        logo: "https://play-lh.googleusercontent.com/PjoJoG27miSglVBXoXrxBSLveV6e3EeBPpNY55aiUUBM9Q1RCETKCOqdOkX2ZydqVf0",
        name: "Coinbase",
        description: "Connect to Coinbase Wallet (not Coinbase App)",
      },
      package: walletLinkProvider,
      connector: async (provider, _options) => {
        await provider.enable();
        return provider;
      },
    },
    authereum: {
      package: Authereum, // required
    },
  },
});

function App(props) {
  const mainnetProvider =
    poktMainnetProvider && poktMainnetProvider._isProvider
      ? poktMainnetProvider
      : scaffoldEthProvider && scaffoldEthProvider._network
      ? scaffoldEthProvider
      : mainnetInfura;

  const [injectedProvider, setInjectedProvider] = useState();
  const [address, setAddress] = useState();

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (injectedProvider && injectedProvider.provider && typeof injectedProvider.provider.disconnect == "function") {
      await injectedProvider.provider.disconnect();
    }
    setTimeout(() => {
      window.location.reload();
    }, 1);
  };

  /* 💵 This hook will get the price of ETH from 🦄 Uniswap: */
  const price = useExchangeEthPrice(targetNetwork, mainnetProvider);

  /* 🔥 This hook will get the price of Gas from ⛽️ EtherGasStation */
  const gasPrice = useGasPrice(targetNetwork, "fast");
  // Use your injected provider from 🦊 Metamask or if you don't have it then instantly generate a 🔥 burner wallet.
  const userProviderAndSigner = useUserProviderAndSigner(injectedProvider, localProvider);
  const userSigner = userProviderAndSigner.signer;

  useEffect(() => {
    async function getAddress() {
      if (userSigner) {
        const newAddress = await userSigner.getAddress();
        setAddress(newAddress);
      }
    }
    getAddress();
  }, [userSigner]);

  // You can warn the user if you would like them to be on a specific network
  const localChainId = localProvider && localProvider._network && localProvider._network.chainId;
  const selectedChainId =
    userSigner && userSigner.provider && userSigner.provider._network && userSigner.provider._network.chainId;

  // For more hooks, check out 🔗eth-hooks at: https://www.npmjs.com/package/eth-hooks

  // The transactor wraps transactions and provides notificiations
  const tx = Transactor(userSigner, gasPrice);

  // Faucet Tx can be used to send funds from the faucet
  const faucetTx = Transactor(localProvider, gasPrice);

  // 🏗 scaffold-eth is full of handy hooks like this one to get your balance:
  const yourLocalBalance = useBalance(localProvider, address);

  // Just plug in different 🛰 providers to get your balance on different chains:
  const yourMainnetBalance = useBalance(mainnetProvider, address);

  const contractConfig = useContractConfig();

  // Load in your local 📝 contract and read a value from it:
  const readContracts = useContractLoader(localProvider, contractConfig);

  // If you want to make 🔐 write transactions to your contracts, use the userSigner:
  const writeContracts = useContractLoader(userSigner, contractConfig, localChainId);

  // EXTERNAL CONTRACT EXAMPLE:
  //
  // If you want to bring in the mainnet DAI contract it would look like:
  const mainnetContracts = useContractLoader(mainnetProvider, contractConfig);

  // If you want to call a function on a new block
  useOnBlock(mainnetProvider, () => {
    console.log(`⛓ A new mainnet block is here: ${mainnetProvider._lastBlockNumber}`);
  });

  // Then read your DAI balance like:
  const myMainnetDAIBalance = useContractReader(mainnetContracts, "DAI", "balanceOf", [
    "0x34aA3F359A9D614239015126635CE7732c18fDF3",
  ]);

  const voteEvents = useEventListener(readContracts, "Polling", "Voted", localProvider, 1);
  console.log("Vote events:", voteEvents);

  let voted = false;
  for (let u = 0; u<voteEvents.length; u++) {
    if(address == voteEvents[u]?.args[0]) {
      voted=true;
    }
  }

  let votedDisplay = "";
  if(voted) {
    votedDisplay = (
      <div style={{ padding: 32, fontWeight: "bolder", fontSize: "large" }}>
        Thank you for voting!!
      </div>
    )
  }


  //
  // 🧫 DEBUG 👨🏻‍🔬
  //
  useEffect(() => {
    if (
      DEBUG &&
      mainnetProvider &&
      address &&
      selectedChainId &&
      yourLocalBalance &&
      yourMainnetBalance &&
      readContracts &&
      writeContracts &&
      mainnetContracts
    ) {
      console.log("_____________________________________ 🏗 scaffold-eth _____________________________________");
      console.log("🌎 mainnetProvider", mainnetProvider);
      console.log("🏠 localChainId", localChainId);
      console.log("👩‍💼 selected address:", address);
      console.log("🕵🏻‍♂️ selectedChainId:", selectedChainId);
      console.log("💵 yourLocalBalance", yourLocalBalance ? ethers.utils.formatEther(yourLocalBalance) : "...");
      console.log("💵 yourMainnetBalance", yourMainnetBalance ? ethers.utils.formatEther(yourMainnetBalance) : "...");
      console.log("📝 readContracts", readContracts);
      console.log("🌍 DAI contract on mainnet:", mainnetContracts);
      console.log("💵 yourMainnetDAIBalance", myMainnetDAIBalance);
      console.log("🔐 writeContracts", writeContracts);
    }
  }, [
    mainnetProvider,
    address,
    selectedChainId,
    yourLocalBalance,
    yourMainnetBalance,
    readContracts,
    writeContracts,
    mainnetContracts,
  ]);

  let networkDisplay = "";
  if (NETWORKCHECK && localChainId && selectedChainId && localChainId !== selectedChainId) {
    const networkSelected = NETWORK(selectedChainId);
    const networkLocal = NETWORK(localChainId);
    if (selectedChainId === 1337 && localChainId === 31337) {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network ID"
            description={
              <div>
                You have <b>chain id 1337</b> for localhost and you need to change it to <b>31337</b> to work with
                HardHat.
                <div>(MetaMask -&gt; Settings -&gt; Networks -&gt; Chain ID -&gt; 31337)</div>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    } else {
      networkDisplay = (
        <div style={{ zIndex: 2, position: "absolute", right: 0, top: 60, padding: 16 }}>
          <Alert
            message="⚠️ Wrong Network"
            description={
              <div>
                You have <b>{networkSelected && networkSelected.name}</b> selected and you need to be on{" "}
                <Button
                  onClick={async () => {
                    const ethereum = window.ethereum;
                    const data = [
                      {
                        chainId: "0x" + targetNetwork.chainId.toString(16),
                        chainName: targetNetwork.name,
                        nativeCurrency: targetNetwork.nativeCurrency,
                        rpcUrls: [targetNetwork.rpcUrl],
                        blockExplorerUrls: [targetNetwork.blockExplorer],
                      },
                    ];
                    console.log("data", data);

                    let switchTx;
                    // https://docs.metamask.io/guide/rpc-api.html#other-rpc-methods
                    try {
                      switchTx = await ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: data[0].chainId }],
                      });
                    } catch (switchError) {
                      // not checking specific error code, because maybe we're not using MetaMask
                      try {
                        switchTx = await ethereum.request({
                          method: "wallet_addEthereumChain",
                          params: data,
                        });
                      } catch (addError) {
                        // handle "add" error
                      }
                    }

                    if (switchTx) {
                      console.log(switchTx);
                    }
                  }}
                >
                  <b>{networkLocal && networkLocal.name}</b>
                </Button>
              </div>
            }
            type="error"
            closable={false}
          />
        </div>
      );
    }
  } else {
    networkDisplay = (
      <div style={{ zIndex: -1, position: "absolute", right: 154, top: 28, padding: 16, color: targetNetwork.color }}>
        {targetNetwork.name}
      </div>
    );
  }

  const loadWeb3Modal = useCallback(async () => {
    const provider = await web3Modal.connect();
    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", chainId => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code, reason) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
  }, [setInjectedProvider]);

  useEffect(() => {
    if (web3Modal.cachedProvider) {
      loadWeb3Modal();
    }
  }, [loadWeb3Modal]);

  const [route, setRoute] = useState();
  useEffect(() => {
    setRoute(window.location.pathname);
  }, [setRoute]);

  let faucetHint = "";
  const faucetAvailable = localProvider && localProvider.connection && targetNetwork.name.indexOf("local") !== -1;

  // const [faucetClicked, setFaucetClicked] = useState(false);
  // if (
  //   !faucetClicked &&
  //   localProvider &&
  //   localProvider._network &&
  //   localProvider._network.chainId === 31337 &&
  //   yourLocalBalance &&
  //   ethers.utils.formatEther(yourLocalBalance) <= 0
  // ) {
  //   faucetHint = (
  //     <div style={{ padding: 16 }}>
  //       <Button
  //         type="primary"
  //         onClick={() => {
  //           faucetTx({
  //             to: address,
  //             value: ethers.utils.parseEther("0.01"),
  //           });
  //           setFaucetClicked(true);
  //         }}
  //       >
  //         💰 Grab funds from the faucet ⛽️
  //       </Button>
  //     </div>
  //   );
  // }

  const optionCount=44;
  const [myVote, setMyVote] = useState(new Array(optionCount).fill(0));
  const [voting, setVoting] = useState();
  const [results, setResults] = useState([]);
  const [allocated, setAllocated] = useState(0);
  const [buttonEnabled, setButtonEnabled] = useState(false);
  const submissions = [
    "",
    "LSD",
    "PoP: Proof of Prompt",
    "Tic Tac Toe Smart Contract",
    "History NFT",
    "Family Contributors",
    "SolidStreaming",
    "Pokemon-Wars",
    "Mecenate",
    "GoBuidlMe",
    "Buidlguidl Funding",
    "CES-2 work listing dapp",
    "Cross",
    "SE-2-Foundry",
    "Web3 Pomodoro",
    "Promises on ETH",
    "P2P NFT Lending Borrowing Platform",
    "c-entry",
    "Intergalactic Marble Race",
    "LENS LENDING",
    "Proof of Participation",
    "Storagoor ( •̀ ω •́ )✧",
    "PxLend",
    "Multisig-SE2",
    "Apartments Reviews",
    "MultiSig Factory",
    "Country Club",
    "P2P Addspace",
    "TicketKiosk - Event tickets on-chain",
    "Ai Article generator and article marketplace",
    "CharityStream",
    "Unit - NFT Marketplace",
    "SE2 Token MultiSend Transfer Contract",
    "SE2H NFT Mint App",
    "TrueToken",
    "NFT Collateral",
    "Accountability Protocol",
    "NFT Passport",
    "Proof of Engagement Protocol",
    "ZKVerifier",
    "Scaffold-ETH-2 with pnpm",
    "No-Life",
    "Emotion owned liquidity",
    "YEETH - YEET your ETH!"
  ];
  const submissionRepo = [
  "",
  "https://github.com/kevinjoshi46b/lsd",
  "https://github.com/gjacuna/pop",
  "https://github.com/cacosta88/pipoca_se2_hackathon",
  "https://github.com/cart0uche/History-NFT",
  "https://github.com/web3goals/family-contributors-prototype",
  "https://github.com/solidoracle/solidstreaming",
  "https://github.com/Abbas-Khann/Pokemon-Attack",
  "https://github.com/scobru/mecenate-monorepo",
  "https://github.com/CMD10M/GoBuidlMe",
  "https://github.com/KcPele/se-2/tree/buidlguidlfunding",
  "https://github.com/NewearthartTech/ces-2",
  "https://github.com/EngrGord/Cross",
  "https://github.com/0xSooki/se-2-foundry",
  "https://github.com/oemerfurkan/web3-pomodoro",
  "https://github.com/tokodev/eth-promises",
  "https://github.com/uok825/p2p-nft-lending",
  "https://github.com/wildanvin/c-entry",
  "https://github.com/SpaceUY/scaffoldeth-hackathon",
  "https://github.com/kriptoe/se-2/tree/main/packages",
  "https://github.com/ysongh/First-Project-with-Scaffold-Eth2/tree/scaffoldeth2",
  "https://github.com/portdeveloper/storagoor",
  "https://github.com/alikonuk1/se-2/tree/main",
  "https://github.com/Naim-Bijapure/multisig-se2",
  "https://github.com/electrone901/apartment-reviews",
  "https://github.com/mertcanciy/se-2",
  "https://github.com/hurley87/country-club",
  "https://github.com/sverps/p2p-addspace",
  "https://github.com/damianmarti/ticketing",
  "https://github.com/spiritbroski/decentralized-ai-article",
  "https://github.com/nzmpi/CharityStream-se2-hackathon",
  "https://github.com/ValentineCodes/se-2",
  "https://github.com/NJarosz/se-2.git",
  "https://github.com/xyuu98/se-2",
  "https://github.com/spichen/truetoken.one",
  "https://github.com/RevanthGundala/NFTCollateral/tree/NFTCollateral",
  "https://github.com/ronnakamoto/accountability-protocol",
  "https://github.com/Nazeeh21/NFT-passport",
  "https://github.com/angelmc32/poep",
  "https://github.com/AvinashNayak27/scafflodETHDemo",
  "https://github.com/darrylyeo/se-2/tree/pnpm",
  "https://github.com/RohanNero/No-Life",
  "https://github.com/The-Wary-One/emotion-owned-liquidity",
  "https://github.com/sigmachirality/yeeth"
  ];
  const submissionLive = [
    "",
    "https://lsd-kevinjoshi46b.vercel.app/",
    "https://pop-nextjs.vercel.app/",
    "https://www.youtube.com/watch?v=a_mNnkebA2E",
    "https://historynft-cart0uche.vercel.app/",
    "https://family-contributors-app.vercel.app/",
    "https://solidstreaming.vercel.app/",
    "https://pokemon-wars.vercel.app/",
    "https://mecenate.vercel.app/",
    "https://gobuidlme-cmd10m.vercel.app/",
    "https://buidlguidlfunding-kcpele.vercel.app/",
    "https://ces-2-nextjs-nine.vercel.app/listings",
    "https://cross-bridge-xi.vercel.app/",
    "https://se-2-foundry.vercel.app/",
    "https://blockchain-pomodoro-omertheblnk-gmailcom.vercel.app/",
    "https://eth-promises-nextjs.vercel.app/",
    "https://p2pnftlending.vercel.app/",
    "https://c-entry.vercel.app/",
    "https://scaffoldeth-hackaton.vercel.app/",
    "https://www.floor101.dev/",
    "https://proof-of-participation.vercel.app/",
    "https://storagoor.vercel.app/",
    "https://se-2-alikonuk1.vercel.app/",
    "https://multisig-se2-naimbijapure7407.vercel.app/",
    "https://nfts-apartment-referrals.netlify.app/",
    "https://buidlguidlhackathon-mertcanciy.vercel.app/",
    "https://countryclub-ehr19riiu-dhurls99-s-team.vercel.app",
    "https://adspace-marketplace.vercel.app/marketplace",
    "https://ticket-kiosk.vercel.app",
    "https://nextjs-flame-five-21.vercel.app/",
    "https://charitystream-three.vercel.app/",
    "https://unit-valentinecodes.vercel.app/",
    "https://se2multisend.vercel.app/example-ui",
    "https://se-2-mint.vercel.app/",
    "https://truetoken.vercel.app/",
    "https://nftcollateral.vercel.app/nftcollat",
    "https://accountability-protocol.vercel.app",
    "https://nft-passport.vercel.app/",
    "https://poep-angelmc32.vercel.app/",
    "https://scafflod-eth-demo-nextjs.vercel.app/example-ui",
    "https://gitpod.io/#https://github.com/darrylyeo/se-2/tree/pnpm",
    "https://no-life-rohannero.vercel.app/",
    "https://emotion-owned-liquidity.vercel.app",
    "https://yeeth-splitter.vercel.app/"
  ];
    const submissionVideo = [
    "",
    "https://youtu.be/OZpSNxjCBVY",
    "https://youtu.be/g8LXzjFTN5I",
    "https://www.youtube.com/watch?v=a_mNnkebA2E",
    "https://www.youtube.com/watch?v=rUrUHlCVf7o",
    "https://www.youtube.com/watch?v=-a7I7dZBEME",
    "https://www.loom.com/share/9beeda651140483bbcaaae5c83fc8392",
    "https://www.youtube.com/watch?v=cWDF1TGlQqA",
    "https://www.youtube.com/playlist?list=PLTenf2t5YuIp68AlFJWjFiJtf4svPuQiX",
    "https://www.youtube.com/watch?v=vBX1NrhjGqA",
    "https://vimeo.com/815678587/2abc9e45ef",
    "https://youtu.be/Up5IQpVpyzc",
    "https://youtu.be/jPh8OXPzpcg",
    "https://www.youtube.com/watch?v=bDp0-YVpYwc",
    "https://youtu.be/jgqyhHyqmNg",
    "https://www.loom.com/share/a1e91056beab4b2c807197b51f8ee741",
    "https://www.loom.com/share/6df4f1b9e995410ba793b9ac6acf58e3",
    "https://www.youtube.com/watch?v=Xv-ZR2GbRTc",
    "https://youtu.be/BDl2Gd4YF-o",
    "https://youtu.be/N2yG-QxSs2M",
    "https://youtu.be/x3Ia-2HfFhY",
    "https://youtu.be/gj-wvpb_e6Q",
    "https://www.loom.com/share/113d5479cf4d454ebb0f86866fdea579",
    "https://www.loom.com/share/1dfd06430c6e4091baed741a6211c7e4",
    "https://nfts-apartment-referrals.netlify.app/",
    "https://www.loom.com/share/a896156d1d9c4e1ea6e5892ad3ffd47a",
    "https://www.loom.com/share/6bb14dcc9cab4085805e620773a51032",
    "https://www.loom.com/share/ef4853ae72bf4d16ad4c4ca00c382dea",
    "https://www.youtube.com/watch?v=00j14JeSkrw",
    "https://www.youtube.com/watch?v=md2SPRD4PUg",
    "https://youtu.be/ttvlBqkK54k",
    "https://www.youtube.com/watch?v=M6UHlhepcBo",
    "https://youtu.be/ZSuBqo5wL_E",
    "https://youtu.be/Md7ylUq_-es",
    "https://user-images.githubusercontent.com/6624197/230739749-35823b54-6446-4ff6-920e-90d5bb7669eb.mp4",
    "https://www.youtube.com/watch?v=ALRsm-inSww",
    "https://youtu.be/Nes7HxJD9GI",
    "https://youtu.be/qb0VusN3qMg",
    "https://www.loom.com/share/3d42cd38dc5148928978c1386fcf21ee",
    "https://youtu.be/5pYo0NlbSns",
    "https://github.com/scaffold-eth/se-2/pull/291/",
    "https://youtu.be/pAEtaWvoB_0",
    "https://youtu.be/vstXjW48e4w",
    "https://www.loom.com/share/092013ff14a54990bd00bbee9ad6d0a1"
  ];
  let allocatedDisplay="";
  let optionsDisplay="";
  async function calculateAllocated() {
    let count=0;
    let i=0;
    while(i<optionCount) {
      count+=myVote[i];
      i++;
    }
    setAllocated(count);
    if(count==100){ 
      setButtonEnabled(true);
    } else {
      setButtonEnabled(false);
    }
  }
  let buttonDisplay="";
  if(!voted) {
    buttonDisplay = (
      <div style={{ padding: 8 }}>
      <Button
        type={"primary"}
        loading={voting}
        disabled={!buttonEnabled}
        style={{width: 300, height: 50, fontSize: 25, marginTop: "25px"}}
        onClick={async () => {
          setVoting(true);
          let total=0;
          for (let i = 0; i < myVote.length; i++) {
            console.log("i", i);
            console.log("myVote[i]", myVote[i]);
            if(!isNaN(myVote[i]) && typeof myVote[i] !== 'undefined') {
              total+=myVote[i];
            } 
            console.log("Total:", total);
          } 
          if(total==100) {
            console.log("myVote", myVote);
            await tx(writeContracts.Polling.vote(myVote));
            setMyVote([]);
            //Clear all number inputs here
          } 
          setVoting(false);
        }}
      >
        Vote!
      </Button>
    </div>
    )
    if(isNaN(allocated)) {
      setAllocated(0);
    }
    if(allocated < 100) {
      allocatedDisplay = (
        <div style={{fontWeight: "bold", fontSize: "20px", marginBottom: "5px"}}>({allocated}/100) Votes Allocated</div>
      )
    } else if (allocated == 100) {
      allocatedDisplay = (
        <div style={{fontWeight: "bold", fontSize: "20px", marginBottom: "5px"}}>(<span style={{color: "green"}}>{allocated}/100</span>) Votes Allocated</div>
      )
    } else if (allocated >= 100){
      allocatedDisplay = (
        <div style={{fontWeight: "bold", fontSize: "20px", marginBottom: "5px"}}>(<span style={{color: "red"}}>{allocated}/100</span>) Votes Allocated</div>
      )
    } 

    useEffect(() => {
      //Called everytime myVote is updated
      console.log('Updated State', myVote);
      calculateAllocated();
    }, [myVote])
    
    optionsDisplay = (
      (() => {
        const arr = [];
        arr.push(allocatedDisplay)
        for (let i = 1; i < optionCount; i++) {
            arr.push(
                <div style={{fontWeight: "bold", float:"left", width: "100%"}}>            
                  <Input
                      type="tel"
                      value={myVote[i]}
                      style={{ textAlign: "left", width: 80, float: "left"}}
                      placeholder={"0"}
                      maxLength={3}
                      onChange={e => {
                        let result = e.target.value.replace(/\D/g, '0');
                        if(isNaN(result) || result.length == 0) {
                          result = 0;
                        }
                        const newValue = parseInt(result);
                        const nextVotes = myVote.map((value, index) => {
                          if(i === index) {
                            return newValue;
                          } else {
                            return value;
                          }
                        })
                        setMyVote(nextVotes);
                      }}
                  />
                  <span style={{float: "left", marginLeft: "20px", marginTop: "4px"}}>{submissions[i]}</span>
                  <span style={{float: "right", marginTop: "4px"}}>
                    (<Link to={{ pathname: submissionRepo[i] }} target="_blank">GitHub</Link>)
                    (<Link to={{ pathname: submissionLive[i] }} target="_blank">Live</Link>)
                    (<Link to={{ pathname: submissionVideo[i] }} target="_blank">Intro Video</Link>)
                  </span>
                </div>
            );
        }
        return arr;
      })()
    )
  } else {
    optionsDisplay=votedDisplay;
  }

  return (
    <div className="App">
      {/* ✏️ Edit the header and change the title to your project name */}
      <Header />
      {/* {networkDisplay} */}
      <BrowserRouter>
        {/* <Menu style={{ textAlign: "center" }} selectedKeys={[route]} mode="horizontal">
          <Menu.Item key="/">
            <Link
              onClick={() => {
                setRoute("/");
              }}
              to="/"
            >
              Vote
            </Link>
          </Menu.Item>
          <Menu.Item key="/results">
            <Link
              onClick={() => {
                setRoute("/results");
              }}
              to="/results"
            >
              Voted List
            </Link>
          </Menu.Item>
          <Menu.Item key="/contracts">
            <Link
              onClick={() => {
                setRoute("/contracts");
              }}
              to="/contracts"
            >
              Debug Contracts
            </Link>
          </Menu.Item>
        </Menu> */}

        <Switch>
          <Route exact path="/">

            <div style={{ width: 650, margin: "auto", marginTop: 32}}>
              <Card>
                <div style={{ padding: 8}}>
                  <h2>🏆 People's Choice Award Voting! 🏆</h2><br></br>
                  <h3><a href="https://docs.google.com/spreadsheets/d/1-mnvyR-IONPI2K79oVDn6oaj35BifcpZuMxWy4dpgTA/edit#gid=224062085" target="_blank">👀 View All Hackathon Submissions Here! 👀</a></h3>
                  <br></br>
                  <span>Hackathon submitters and BuidlGuidl members each get 100 votes to allocate as they wish.  You have to send all 100 votes in one transaction, so make sure you have allocated all 100!</span>
                  <div style={{marginBottom: 20, marginTop: 20}}>
                    Voting closes on 05/14/2023
                  </div>
                  {optionsDisplay}
                  {allocatedDisplay}
                </div>
                {buttonDisplay}
              </Card>
            </div> 
              
          </Route>
          <Route path="/contracts">
            <Contract
              name="Polling"
              signer={userSigner}
              provider={localProvider}
              address={address}
              blockExplorer={blockExplorer}
              contractConfig={contractConfig}
            />
          </Route>
          <Route path="/results">
          <div style={{ width: 300, margin: "auto", marginTop: 64}}>
            <Card>
              <div>Votes:</div>
              <List
                  dataSource={voteEvents}
                  renderItem={item => {
                    return (
                      <List.Item key={item.blockNumber + item.blockHash}>
                        <Address value={item.args[0]} ensProvider={mainnetProvider} fontSize={16} />
                      </List.Item>
                    );
                  }}
                />
            </Card> 
          </div>
          </Route>
        </Switch>
      </BrowserRouter>

      <ThemeSwitch />

      {/* 👨‍💼 Your account is in the top right with a wallet at connect options */}
      <div style={{ position: "fixed", textAlign: "right", right: 0, top: 0, padding: 10 }}>
        <Account
          address={address}
          userSigner={userSigner}
          mainnetProvider={mainnetProvider}
          price={price}
          web3Modal={web3Modal}
          loadWeb3Modal={loadWeb3Modal}
          logoutOfWeb3Modal={logoutOfWeb3Modal}
          blockExplorer={blockExplorer}
        />
      </div>

      <div style={{ marginTop: 32, paddingBottom: 32}}>
        {/* Add your address here */}
        Built by the 🏰 BuidlGuidl
      </div>

      {/* <div style={{ marginTop: 32 }}>
        <a target="_blank" style={{ padding: 32, color: "#000" }} href="https://github.com/ZakGriffith/Poll/tree/Polling">
          🍴 Fork me!
        </a>
      </div> */}

      {/* 🗺 Extra UI like gas price, eth price, faucet, and support: */}
      {/* <div style={{ position: "fixed", textAlign: "left", left: 0, bottom: 20, padding: 10 }}>
        <Row align="middle" gutter={[4, 4]}>
          <Col span={8}>
            <Ramp price={price} address={address} networks={NETWORKS} />
          </Col>

          <Col span={8} style={{ textAlign: "center", opacity: 0.8 }}>
            <GasGauge gasPrice={gasPrice} />
          </Col>
          <Col span={8} style={{ textAlign: "center", opacity: 1 }}>
            <Button
              onClick={() => {
                window.open("https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA");
              }}
              size="large"
              shape="round"
            >
              <span style={{ marginRight: 8 }} role="img" aria-label="support">
                💬
              </span>
              Support
            </Button>
          </Col>
        </Row>

        <Row align="middle" gutter={[4, 4]}>
          <Col span={24}>
            {
              faucetAvailable ? (
                <Faucet localProvider={localProvider} price={price} ensProvider={mainnetProvider} />
              ) : (
                ""
              )
            }
          </Col>
        </Row>
      </div> */}
    </div>
  );
}

export default App;
