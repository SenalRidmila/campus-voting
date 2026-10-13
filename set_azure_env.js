const { execSync } = require('child_process');

const requiredSettings = [
	'DATABASE_URL',
	'EMAIL_USER',
	'EMAIL_PASS',
	'JWT_SECRET',
	'ENCRYPTION_KEY',
	'ADMIN_PRIVATE_KEY',
	'VOTING_ADDRESS',
	'FORWARDER_ADDRESS',
];

for (const name of requiredSettings) {
	if (!process.env[name]) {
		throw new Error(`${name} must be set before running this script.`);
	}
}

const settings = {
	DATABASE_URL: process.env.DATABASE_URL,
	RPC_URL: process.env.RPC_URL || 'http://blockchain:8545',
	EMAIL_USER: process.env.EMAIL_USER,
	EMAIL_PASS: process.env.EMAIL_PASS,
	JWT_SECRET: process.env.JWT_SECRET,
	ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
	ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY,
	VOTING_ADDRESS: process.env.VOTING_ADDRESS,
	FORWARDER_ADDRESS: process.env.FORWARDER_ADDRESS,
	NEXT_PUBLIC_API_URL: 'https://campusvotingappsea7768.azurewebsites.net',
	NEXT_PUBLIC_RPC_URL: 'https://campusvotingappsea7768.azurewebsites.net/rpc',
	POSTGRES_USER: process.env.POSTGRES_USER || 'user',
	POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD || 'password',
	POSTGRES_DB: process.env.POSTGRES_DB || 'voting_db',
};

const appSettings = Object.entries(settings)
	.map(([name, value]) => `${name}="${value.replace(/"/g, '\\"')}"`)
	.join(' ');
const command = `az webapp config appsettings set --name campusvotingappsea7768 --resource-group CampusVoting_SEA_7768 --settings ${appSettings}`;

console.log("Running appsettings setup...");
execSync(command, { stdio: 'inherit' });
console.log("Done!");
