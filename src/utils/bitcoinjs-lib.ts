import { BIP32Interface } from "bip32";
import { payments, Psbt } from "bitcoinjs-lib";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { fromSeed } from "bip32";
import { networks } from "bitcoinjs-lib";
import * as bip32 from 'bip32'; 

import { Address, DecoratedUtxo } from "src/types";

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

export const createTransasction = async (
  utxos: DecoratedUtxo[],
  recipientAddress: string,
  amountInSatoshis: number,
  changeAddress: Address
): Promise<Psbt> => {
  throw new Error("Function not implemented yet");
};

export const signTransaction = async (
  psbt: any,
  mnemonic: string
): Promise<Psbt> => {
  throw new Error("Function not implemented yet");
};
