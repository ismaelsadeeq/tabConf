import { BIP32Interface } from "bip32";
import { payments, Psbt } from "bitcoinjs-lib";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { fromSeed } from "bip32";
import { networks } from "bitcoinjs-lib";
import * as bip32 from 'bip32'; 

import { Address, DecoratedUtxo } from "src/types";
import coinselect from "coinselect";
import { getFeeRates } from "./blockstream-api";

export const getNewMnemonic = (): string => {
  try {
    //Generating a 12 words Mnemonic string from 128 bit source of entropy
    //Note we can generate 24 words by writing 256
    const mnemonic:string = generateMnemonic(128);
    return mnemonic;
  }catch(err){
    throw new Error("failed to generate Mnemonic");
  }

};

export const getMasterPrivateKey = async (
  mnemonic: string
): Promise<BIP32Interface> => {
  try {
    // this functions takes the mnemonic and stretch it into a seed 512 bits
    const seed:Buffer = await mnemonicToSeed(mnemonic);

    //generate the private key from seed for bitcoin network

    const privKey:BIP32Interface = fromSeed(seed,networks.bitcoin);

    return privKey
  } catch (err) {
  
    throw new Error("failed to generate maser private key");
  }
};

export const getXpubFromPrivateKey = (
  privateKey: BIP32Interface,
  derivationPath: string
): string => {
  try {
    const child:BIP32Interface = privateKey.derivePath(derivationPath).neutered(); 
    const xpub:string = child.toBase58(); 
    return xpub;
  } catch (error) {
    throw new Error("Failed to generate extended public keys");
  }
  
};

export const deriveChildPublicKey = (
  xpub: string,
  derivationPath: string
): BIP32Interface => {
  try {
    const node = bip32.fromBase58(xpub, networks.bitcoin); 
    const child = node.derivePath(derivationPath); 
    return child;
  } catch (err) {
    throw new Error("Failed to derive the child");
  }
};

export const getAddressFromChildPubkey = (
  child: BIP32Interface
): payments.Payment => {
  try {
    const address:payments.Payment = payments.p2wpkh({ 
      pubkey: child.publicKey, 
      network: networks.bitcoin, 
      
      }); 
      
    return address;
  } catch (error) {
    throw new Error("Failed to generate address");
  }
  
};

export const createTransaction = async (
  utxos: DecoratedUtxo[],
  recipientAddress: string,
  amountInSatoshis: number,
  changeAddress: Address
) => {
  try{
    const feeRate = await getFeeRates();

    const { inputs, outputs, fee } = coinselect(
      utxos,
      [
        {
          address: recipientAddress,
          value: amountInSatoshis,
        },
      ],
      parseInt(feeRate)
    );

    if (!inputs || !outputs) throw new Error("Unable to send.. No UTXO available")
    if (fee > amountInSatoshis) throw new Error("Invalid amount");

    const psbt = new Psbt({ network: networks.bitcoin });
    psbt.setVersion(2); // These are defaults. This line is not needed.
    psbt.setLocktime(0); // These are defaults. This line is not needed.

    inputs.forEach((input) => {
      psbt.addInput({
        hash: input.txid,
        index: input.vout,
        sequence: 0xfffffffd, // enables RBF
        witnessUtxo: {
          value: input.value,
          script: input.address.output!,
        },
        bip32Derivation: input.bip32Derivation,
      });
    });
  
  outputs.forEach((output) => {
    // coinselect doesnt apply address to change output, so add it here
    if (!output.address) {
      output.address = changeAddress.address!;
    }

    psbt.addOutput({
      address: output.address,
      value: output.value,
    });
  });

  return psbt;
  }
  catch(err){
    throw new Error("unable to create transaction");
  }
  
};

export const signTransaction = async (
  psbt: any,
  mnemonic: string
): Promise<Psbt> => {
  try {
    const seed = await mnemonicToSeed(mnemonic);
    const root = bip32.fromSeed(seed, networks.bitcoin);

    psbt.signAllInputsHD(root);
    psbt.finalizeAllInputs();
    return psbt;
  }
  catch(err){
    throw new Error("unable to sign transaction");
  }
 
};
