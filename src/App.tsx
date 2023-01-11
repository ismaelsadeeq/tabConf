import { useEffect, useState } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { MenuIcon } from "@heroicons/react/outline";

import Sidebar from "src/components/Sidebar";

import Instructions from "src/pages/Instructions";
import Addresses from "src/pages/Addresses";
import Send from "src/pages/Send";
import Receive from "src/pages/Receive";
import Transactions from "src/pages/Transactions";
import Utxos from "src/pages/UTXOs";
import Settings from "src/pages/Settings";

import { Address, DecoratedTx, DecoratedUtxo } from "src/types";
import { getNewMnemonic,getMasterPrivateKey, getXpubFromPrivateKey, deriveChildPublicKey, getAddressFromChildPubkey } from "./utils/bitcoinjs-lib";
import { BIP32Interface } from "bip32";
import axios from 'axios'; 

const BASE_URL = 'https://blockstream.info/api/address';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mnemonic, setMnemonic] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [xpub, setXpub] = useState(""); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [masterFingerprint, setMasterFingerprint] = useState(new Buffer("")); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [addresses, setAddresses] = useState<Address[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [changeAddresses, setChangeAddresses] = useState<Address[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [transactions, setTransactions] = useState<DecoratedTx[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars
  const [utxos, setUtxos] = useState<DecoratedUtxo[]>([]); // eslint-disable-line @typescript-eslint/no-unused-vars

  // Mnemonic / Private Key / XPub
  useEffect(() => {
    const getSeed = async () => {
      try {
        //Get the Mnemonic words
        const mnemonic:string = getNewMnemonic()

        //Set to global state
        setMnemonic(mnemonic)

        // Generate private key from mnemonic phrase
        const privateKey:BIP32Interface = await getMasterPrivateKey(mnemonic)

        //set privateKey to global state
        setMasterFingerprint(privateKey.fingerprint)

        const derivationPath:string = "m/84'/0'/0'"; // P2WPKH 
 
        // Generate extended public key
        const xPubKey:string = getXpubFromPrivateKey(privateKey,derivationPath)
        setXpub(xPubKey)


      } catch (e) {
        console.log(e);
      }
    };
    getSeed();
  }, []);

  // Addresses
  useEffect(() => {
    try {
      const currentAddresses:Address[] = []
      const currentChangeAddresses:Address[] = []
      for (let i = 0; i < 10; i++) {
        //Receiving address
        const currentDerivationPath = `0/${i}`
        const currentChildPubKey = deriveChildPublicKey(xpub,currentDerivationPath)
        const currentAddress = getAddressFromChildPubkey(currentChildPubKey);
        currentAddresses.push({...currentAddress,derivationPath:currentDerivationPath,masterFingerprint:masterFingerprint})

        //Change Address
        const changeDerivationPath = `1/${i}`
        const currentChildChangePubKey = deriveChildPublicKey(xpub,changeDerivationPath)
        const currentChangeAddress = getAddressFromChildPubkey(currentChildChangePubKey);
        currentChangeAddresses.push({...currentChangeAddress,derivationPath:changeDerivationPath,masterFingerprint:masterFingerprint})
        
      }
      setAddresses(currentAddresses)
      setChangeAddresses(currentChangeAddresses)
    } catch (e) {
      console.log(e);
    }
  }, [masterFingerprint, xpub]);

  // Transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
          const transactions:DecoratedTx[] = [] 
          for(let i=0;i<transactions.length;i++){
            const { data } = await axios.get(`${BASE_URL}/${transactions[i]}/txs`);
            console.log(data)
            transactions.push(data)

          }
          setTransactions(transactions)
      } catch (e) {
        console.log(e);
      }
    };

    fetchTransactions();
  }, [addresses, changeAddresses]);

  // UTXOs
  useEffect(() => {
    const fetchUtxos = async () => {
      try {
        throw new Error("Function not implemented yet");
      } catch (e) {
        console.log(e);
      }
    };

    fetchUtxos();
  }, [addresses, changeAddresses, masterFingerprint]);

  return (
    <Router>
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <Switch>
          <Route exact path="/">
            <Instructions />
          </Route>
          <Route exact path="/addresses">
            <Addresses
              addresses={addresses}
              changeAddresses={changeAddresses}
            />
          </Route>
          <Route exact path="/send">
            <Send
              utxos={utxos}
              changeAddresses={changeAddresses}
              mnemonic={mnemonic}
            />
          </Route>
          <Route exact path="/receive">
            <Receive addresses={addresses} />
          </Route>
          <Route exact path="/transactions">
            <Transactions transactions={transactions} />
          </Route>
          <Route exact path="/utxos">
            <Utxos utxos={utxos} />
          </Route>
          <Route exact path="/settings">
            <Settings mnemonic={mnemonic} xpub={xpub} />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}
