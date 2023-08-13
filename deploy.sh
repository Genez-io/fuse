#!/bin/bash

echo "starting deployment process"

# download new version of our application
cd ./core-deployment
git pull origin main

# install all the dependencies
echo "installing dependencies"
npm install

# build the application
echo "building application"
npm run build

# run the application
echo "starting the application"
pm2 restart 0
echo "deployment process completed"