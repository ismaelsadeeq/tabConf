import {
  Address,
  BlockstreamAPITransactionResponse,
  BlockstreamAPIUtxoResponse,
} from "src/types";
import axios from 'axios'; 

const BASE_URL = 'https://blockstream.info/api/address';
export const getTransactionsFromAddress = async (
  address: Address
): Promise<BlockstreamAPITransactionResponse[]> => {
  try {
    const { data } = await axios.get(`${BASE_URL}/${address}/txs`);
    return data;
  } catch (err) {
    throw new Error("failed to get transactions");
  }
 
};

export const getUtxosFromAddress = async (
  address: Address
): Promise<BlockstreamAPIUtxoResponse[]> => {
  try{
    const { data } = await axios.get(
      `${BASE_URL}/address/${address.address}/utxo`
    );
    return data;
  } catch (err) {
    throw new Error("failed to get utxos");
  }
  }



export const getFeeRates = async () => {
  throw new Error("Function not implemented yet");
};

export const broadcastTx = async (txHex: string) => {
  throw new Error("Function not implemented yet");
};
