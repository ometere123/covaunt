import {defineConfig, devices} from '@playwright/test';
export default defineConfig({
 testDir:'./tests',
 timeout:30_000,
 retries:0,
 use:{baseURL:'http://127.0.0.1:4173',trace:'retain-on-failure'},
 projects:[
   {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
   {name:'mobile-chromium',use:{...devices['iPhone 13'],browserName:'chromium'}}
 ],
 webServer:{command:'npm run dev -- --hostname 127.0.0.1 --port 4173',port:4173,reuseExistingServer:!process.env.CI,timeout:60_000},
 reporter:process.env.CI?'github':'list'
});
