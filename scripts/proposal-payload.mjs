/** Generate exact Sputnik DAO FunctionCall proposal JSON without signing. */
import {readFileSync} from 'node:fs';
import {parseNear,isValidAccount,isSinglePurpose} from '../web/src/engine.mjs';
const [contract,id,recipient,purposeRaw,amountNear,title,...rest]=process.argv.slice(2);
if(![contract,id,recipient,purposeRaw,amountNear,title].every(Boolean)){
 console.error('Usage: node scripts/proposal-payload.mjs CONTRACT ID RECIPIENT PURPOSE_BIT AMOUNT_NEAR TITLE [REFERENCE]');process.exit(2);
}
const purpose=Number(purposeRaw);
if(!isValidAccount(contract)||!isValidAccount(recipient)||!isSinglePurpose(purpose)||id.length<8||id.length>64)throw Error('Invalid contract, recipient, purpose, or unique mandate ID');
const amount=parseNear(amountNear).toString();
const args={id,recipient,purpose,amount,title,reference:rest.join(' ')};
const proposal={
 description:JSON.stringify({protocol:'COVAUNT',mandate_id:id,title,purpose,recipient,amount_yocto:amount,contract}),
 kind:{FunctionCall:{receiver_id:contract,actions:[{method_name:'execute_spend',args:Buffer.from(JSON.stringify(args)).toString('base64'),deposit:'0',gas:'150000000000000'}]}}
};
console.log(JSON.stringify({proposal},null,2));
