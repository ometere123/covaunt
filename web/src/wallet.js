import {CONFIG} from './config.js';
// Wallet Selector 10 requires NAJ-format actionCreators, not v9 object actions.
let selectorPromise;
async function ready() {
  if (!selectorPromise) selectorPromise=(async()=>{
    const [{setupWalletSelector,actionCreators},{setupMyNearWallet}]=await Promise.all([
      import('@near-wallet-selector/core'),import('@near-wallet-selector/my-near-wallet')
    ]);
    const selector=await setupWalletSelector({network:CONFIG.network,modules:[setupMyNearWallet()]});
    return {selector,actionCreators};
  })();
  return selectorPromise;
}
export async function account() {
  const {selector}=await ready();
  const wallet=await selector.wallet('my-near-wallet');
  const accounts=await wallet.getAccounts();
  return accounts[0]?.accountId||null;
}
export async function connect() {
  if(!CONFIG.contractId)throw Error('Set contractId in src/config.js after deploying the contract');
  const {selector}=await ready();
  const wallet=await selector.wallet('my-near-wallet');
  await wallet.signIn({contractId:CONFIG.contractId,methodNames:['contribute','request_refund']});
  return account();
}
export async function disconnect() {
  const {selector}=await ready();
  const wallet=await selector.wallet('my-near-wallet');
  await wallet.signOut();
}
export async function signCall(receiverId,method,args,gas,deposit) {
  const {selector,actionCreators}=await ready();
  const wallet=await selector.wallet('my-near-wallet');
  return wallet.signAndSendTransaction({receiverId,actions:[actionCreators.functionCall(method,args,BigInt(gas),BigInt(deposit))]});
}
