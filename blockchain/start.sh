#!/bin/sh
echo "Clearing old local chain state to ensure deterministic contract addresses..."
rm -rf /app/ganache_data/*
rm -rf /app/ignition/deployments/chain-31337

echo "Creating necessary directories for persistent storage..."
mkdir -p /app/ganache_data
mkdir -p /app/ignition/deployments

echo "Starting Ganache node in the background..."
npm run node:ganache &
NODE_PID=$!

echo "Waiting for 5 seconds for Ganache to be fully ready..."
sleep 5

echo "Deploying the smart contract using Hardhat scripts..."
npx hardhat run scripts/deploy.ts --network localhost

echo "Smart contract deployed successfully! Keeping Ganache alive..."
wait $NODE_PID
