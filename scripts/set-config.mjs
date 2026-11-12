import {readFileSync,writeFileSync} from 'node:fs';
import {isValidAccount} from '../web/src/engine.mjs';
const [contract,dao]=process.argv.slice(2);
if(!isValidAccount(contract)||!isValidAccount(dao)||contract===dao){console.error('Usage: node scripts/set-config.mjs covaunt-account.testnet council-dao.testnet');process.exit(2);}
const path='web/src/config.js';
let data=readFileSync(path,'utf8');
data=data.replace(/contractId:\s*'[^']*'/,`contractId: '${contract}'`).replace(/daoId:\s*'[^']*'/,`daoId: '${dao}'`);
writeFileSync(path,data);
console.log('Configured web frontend with account IDs; before deploying UI, check on-chain DAO binding and proposal bond.');
